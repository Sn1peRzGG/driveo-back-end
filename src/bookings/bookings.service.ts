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

interface BookingQuoteInput {
	vehicleId: string
	startDate: string
	endDate: string
	returnCity?: string
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

	private normalizeStartDate(dateString: string): Date {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) {
			throw new BadRequestException(`Invalid date format: ${dateString}`)
		}
		date.setUTCHours(0, 0, 0, 0)
		return date
	}

	private normalizeEndDate(dateString: string): Date {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) {
			throw new BadRequestException(`Invalid date format: ${dateString}`)
		}
		date.setUTCDate(date.getUTCDate() + 1)
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

		return previousBooking
			? String(previousBooking.returnCity)
			: String(vehicle.city)
	}

	private async getQuoteData(input: BookingQuoteInput, session: ClientSession) {
		const { vehicleId, startDate, endDate } = input
		const start = this.normalizeStartDate(startDate)
		const end = this.normalizeEndDate(endDate)
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		if (start < today) {
			throw new BadRequestException('Start date cannot be in the past')
		}

		if (start >= end) {
			throw new BadRequestException(
				'End date must be on or after the start date',
			)
		}

		const vehicle = await this.vehicleModel
			.findOne({ _id: vehicleId as any, isDeleted: false })
			.session(session)

		if (!vehicle || !vehicle.isAvailable) {
			throw new NotFoundException('Vehicle not found or unavailable for rental')
		}

		const pickupCityId = await this.resolveExpectedPickupCity(
			vehicle,
			start,
			session,
		)
		const selectedReturnCityId = input.returnCity || pickupCityId
		const returnCityExists = await this.cityModel
			.exists({ _id: selectedReturnCityId as any })
			.session(session)

		if (!returnCityExists) {
			throw new NotFoundException('Return city not found')
		}

		const [overlappingBooking, nextBooking] = await Promise.all([
			this.bookingModel
				.findOne({
					vehicle: vehicleId as any,
					status: { $in: BLOCKING_STATUSES },
					startDate: { $lt: end },
					endDate: { $gt: start },
				})
				.session(session)
				.lean(),
			this.bookingModel
				.findOne({
					vehicle: vehicleId as any,
					status: { $in: BLOCKING_STATUSES },
					startDate: { $gte: end },
				})
				.sort({ startDate: 1 })
				.session(session)
				.lean(),
		])

		const rentalDays = Math.round((end.getTime() - start.getTime()) / 86400000)
		const pricePerDay = Number(vehicle.pricePerDay ?? 0)
		const rentalSubtotal = Number((pricePerDay * rentalDays).toFixed(2))
		const isOneWay = selectedReturnCityId !== pickupCityId

		const [pickupCity, returnCity, nextPickupCity] = await Promise.all([
			this.cityModel.findById(pickupCityId).session(session).lean(),
			this.cityModel.findById(selectedReturnCityId).session(session).lean(),
			nextBooking
				? this.cityModel
						.findById(String(nextBooking.pickupCity))
						.session(session)
						.lean()
				: Promise.resolve(null),
		])

		const routeFee = isOneWay
			? await this.oneWayFeeModel
					.findOne({
						originCity: pickupCityId as any,
						destinationCity: selectedReturnCityId as any,
					})
					.session(session)
					.lean()
			: null

		let error: string | null = null

		if (overlappingBooking) {
			error =
				'Vehicle is already booked for one or more dates in the selected range.'
		} else if (
			nextBooking &&
			String(nextBooking.pickupCity) !== selectedReturnCityId
		) {
			error =
				'The return city must match the pickup city of the next scheduled booking.'
		} else if (isOneWay && !routeFee) {
			error = 'No one-way fee is configured for this route.'
		}

		const oneWayFee = routeFee?.fee ?? 0
		const totalPrice = Number((rentalSubtotal + oneWayFee).toFixed(2))

		return {
			available: !error,
			pickupCity: pickupCityId,
			pickupCityName: pickupCity?.name ?? 'Vehicle Location',
			returnCity: selectedReturnCityId,
			returnCityName: returnCity?.name ?? '',
			rentalDays,
			pricePerDay,
			rentalSubtotal,
			isOneWay,
			oneWayFee,
			totalPrice,
			nextBooking: nextBooking
				? {
						startDate: nextBooking.startDate,
						pickupCity: String(nextBooking.pickupCity),
						pickupCityName: nextPickupCity?.name ?? 'Unknown city',
					}
				: null,
			error,
		}
	}

	async getBookingQuote(input: BookingQuoteInput) {
		const session = await this.connection.startSession()
		try {
			let quote: any
			await session.withTransaction(async () => {
				quote = await this.getQuoteData(input, session)
			})
			return quote
		} finally {
			await session.endSession()
		}
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

		const start = this.normalizeStartDate(startDate)
		const end = this.normalizeEndDate(endDate)
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		if (start < today) {
			throw new BadRequestException('Start date cannot be in the past')
		}

		if (start >= end) {
			throw new BadRequestException(
				'End date must be on or after the start date',
			)
		}

		const session = await this.connection.startSession()
		try {
			let createdBooking!: Booking

			await session.withTransaction(async () => {
				const vehicle = await this.vehicleModel
					.findOne<VehicleDocument>({ _id: vehicleId as any, isDeleted: false })
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

				if (!returnCityExists)
					throw new NotFoundException('Return city not found')
				if (!user) throw new NotFoundException('User not found')

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

				if (nextBooking && String(nextBooking.pickupCity) !== returnCity) {
					throw new BadRequestException(
						'Return city conflicts with a subsequent scheduled booking for this vehicle',
					)
				}

				const rentalDays = Math.round(
					(end.getTime() - start.getTime()) / 86400000,
				)
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
			.populate({
				path: 'vehicle',
				populate: [{ path: 'brand' }, { path: 'model' }, { path: 'category' }],
			})
			.populate('pickupCity')
			.populate('returnCity')
			.sort({ createdAt: -1 })
			.exec()
	}

	async getAllBookings(): Promise<Booking[]> {
		return this.bookingModel
			.find()
			.populate('user', 'name email phoneNumber')
			.populate({
				path: 'vehicle',
				populate: [{ path: 'brand' }, { path: 'model' }, { path: 'category' }],
			})
			.populate('pickupCity')
			.populate('returnCity')
			.sort({ createdAt: -1 })
			.exec()
	}

	async updateStatus(
		id: string,
		updateBookingStatusDto: UpdateBookingStatusDto,
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`)

		const nextStatus = updateBookingStatusDto.status
		if (booking.status === nextStatus) return booking

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

			if (String(booking.pickupCity) !== String(booking.returnCity)) {
				const vehicle = await this.vehicleModel.findOne<VehicleDocument>({
					_id: booking.vehicle as any,
					isDeleted: false,
				})
				if (!vehicle) throw new NotFoundException('Vehicle not found')
				vehicle.city = booking.returnCity
				await vehicle.save()
			}
		}

		booking.status = nextStatus
		return booking.save()
	}

	async cancelBooking(id: string, userId: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`)

		if (String(booking.user) !== String(userId)) {
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
		if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`)
		return { message: 'Booking successfully deleted' }
	}
}
