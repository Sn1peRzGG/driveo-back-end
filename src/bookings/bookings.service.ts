import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { ClientSession, Connection, Model } from 'mongoose'
import { City, CityDocument } from '../cities/city.schema'
import {
	OneWayFee,
	OneWayFeeDocument,
} from '../one-way-fees/one-way-fee.schema'
import { User, UserDocument } from '../users/user.schema'
import { Vehicle, VehicleDocument } from '../vehicles/vehicle.schema'
import { Booking, BookingDocument, BookingStatus } from './booking.schema'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto'

const BLOCKING_STATUSES = [
	BookingStatus.PENDING,
	BookingStatus.CONFIRMED,
	BookingStatus.ACTIVE,
]

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
	[BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
	[BookingStatus.CONFIRMED]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
	[BookingStatus.ACTIVE]: [BookingStatus.COMPLETED],
	[BookingStatus.COMPLETED]: [],
	[BookingStatus.CANCELLED]: [],
}

@Injectable()
export class BookingsService {
	constructor(
		@InjectConnection() private readonly connection: Connection,
		@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
		@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(City.name) private cityModel: Model<CityDocument>,
		@InjectModel(OneWayFee.name)
		private oneWayFeeModel: Model<OneWayFeeDocument>,
	) {}

	private normalizeDate(dateString: string): Date {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) {
			throw new BadRequestException(`Invalid date format: ${dateString}`)
		}
		date.setUTCHours(0, 0, 0, 0)
		return date
	}

	private async resolveExpectedPickupCity(
		vehicle: VehicleDocument,
		start: Date,
		session: ClientSession,
	): Promise<string> {
		const previousBooking = await this.bookingModel
			.findOne({
				vehicle: vehicle._id as any,
				status: { $in: BLOCKING_STATUSES },
				endDate: { $lte: start },
			})
			.sort({ endDate: -1 })
			.session(session)
			.lean()

		return previousBooking ? previousBooking.returnCity : vehicle.city
	}

	async create(
		createBookingDto: CreateBookingDto,
		userId: string,
	): Promise<Booking> {
		const {
			vehicleId,
			startDate,
			endDate,
			pickupCity,
			returnCity,
			phoneNumber,
		} = createBookingDto

		const start = this.normalizeDate(startDate)
		const end = this.normalizeDate(endDate)
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		if (start < today) {
			throw new BadRequestException('Start date cannot be in the past')
		}

		if (start >= end) {
			throw new BadRequestException(
				'End date must be strictly after start date',
			)
		}

		const session = await this.connection.startSession()
		try {
			let createdBooking!: Booking

			await session.withTransaction(async () => {
				const vehicle = await this.vehicleModel
					.findOne<VehicleDocument>({
						_id: vehicleId as any,
						isDeleted: false,
					})
					.session(session)

				if (!vehicle || !vehicle.isAvailable) {
					throw new NotFoundException(
						`Vehicle with ID ${vehicleId} not found or unavailable for rental`,
					)
				}

				const [returnCityExists, user] = await Promise.all([
					this.cityModel.exists({ _id: returnCity as any }).session(session),
					this.userModel.findById(userId).session(session),
				])

				if (!returnCityExists) {
					throw new NotFoundException('Return city not found')
				}
				if (!user) {
					throw new NotFoundException('User not found')
				}

				const overlappingBooking = await this.bookingModel
					.findOne({
						vehicle: vehicleId as any,
						status: { $in: BLOCKING_STATUSES },
						startDate: { $lt: end },
						endDate: { $gt: start },
					})
					.session(session)

				if (overlappingBooking) {
					throw new BadRequestException(
						'Vehicle is already booked for one or more dates in the selected range',
					)
				}

				const expectedPickupCity = await this.resolveExpectedPickupCity(
					vehicle,
					start,
					session,
				)

				if (pickupCity !== expectedPickupCity) {
					throw new BadRequestException(
						'Pickup city must match the vehicle location on the start date',
					)
				}

				const nextBooking = await this.bookingModel
					.findOne({
						vehicle: vehicleId as any,
						status: { $in: BLOCKING_STATUSES },
						startDate: { $gte: end },
					})
					.sort({ startDate: 1 })
					.session(session)
					.lean()

				if (nextBooking && nextBooking.pickupCity !== returnCity) {
					throw new BadRequestException(
						'Return city conflicts with a subsequent scheduled booking for this vehicle',
					)
				}

				const diffTime = end.getTime() - start.getTime()
				const rentalDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
				const isOneWayRental = returnCity !== expectedPickupCity

				const routeFee = isOneWayRental
					? await this.oneWayFeeModel
							.findOne({
								originCity: expectedPickupCity as any,
								destinationCity: returnCity as any,
							})
							.session(session)
							.lean()
					: null

				if (isOneWayRental && !routeFee) {
					throw new BadRequestException(
						'No one-way fee is configured for this route',
					)
				}

				const oneWayFee = routeFee?.fee ?? 0
				const totalPrice = Number(
					(vehicle.pricePerDay * rentalDays + oneWayFee).toFixed(2),
				)

				const newBooking = new this.bookingModel({
					user: userId,
					vehicle: vehicleId,
					startDate: start,
					endDate: end,
					pickupCity: expectedPickupCity,
					returnCity,
					totalPrice,
					oneWayFee,
					phoneNumber,
					status: BookingStatus.PENDING,
				})

				createdBooking = await newBooking.save({ session })
			})

			return createdBooking
		} finally {
			await session.endSession()
		}
	}

	async getUserBookings(userId: string): Promise<Booking[]> {
		return this.bookingModel
			.find({ user: userId as any })
			.populate(['vehicle', 'pickupCity', 'returnCity'])
			.sort({ createdAt: -1 })
			.exec()
	}

	async getAllBookings(): Promise<Booking[]> {
		return this.bookingModel
			.find()
			.populate('user', 'name email phoneNumber')
			.populate(['vehicle', 'pickupCity', 'returnCity'])
			.sort({ createdAt: -1 })
			.exec()
	}

	async updateStatus(
		id: string,
		updateBookingStatusDto: UpdateBookingStatusDto,
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}

		const nextStatus = updateBookingStatusDto.status
		if (booking.status === nextStatus) {
			return booking
		}

		const allowed = ALLOWED_TRANSITIONS[booking.status] ?? []
		if (!allowed.includes(nextStatus)) {
			throw new BadRequestException(
				`Cannot transition booking from ${booking.status} to ${nextStatus}`,
			)
		}

		if (nextStatus === BookingStatus.COMPLETED) {
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			if (today < booking.endDate) {
				throw new BadRequestException(
					'Booking cannot be completed before its end date',
				)
			}

			if (booking.pickupCity !== booking.returnCity) {
				const vehicle = await this.vehicleModel.findOne<VehicleDocument>({
					_id: booking.vehicle as any,
					isDeleted: false,
				})
				if (!vehicle) {
					throw new NotFoundException('Vehicle not found')
				}
				vehicle.city = booking.returnCity
				await vehicle.save()
			}
		}

		booking.status = nextStatus
		return booking.save()
	}

	async cancelBooking(id: string, userId: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}

		if (booking.user !== userId) {
			throw new ForbiddenException('You can only cancel your own bookings')
		}

		if (
			booking.status !== BookingStatus.PENDING &&
			booking.status !== BookingStatus.CONFIRMED
		) {
			throw new BadRequestException(
				'Cannot cancel an active, completed, or already cancelled booking',
			)
		}

		booking.status = BookingStatus.CANCELLED
		return booking.save()
	}

	async deleteBooking(id: string): Promise<{ message: string }> {
		const booking = await this.bookingModel.findByIdAndDelete(id)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}
		return { message: 'Booking successfully deleted' }
	}
}
