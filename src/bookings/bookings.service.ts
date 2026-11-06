import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from '../users/user.schema'
import { Vehicle, VehicleDocument } from '../vehicles/vehicle.schema'
import { City, CityDocument } from '../cities/city.schema'
import {
	OneWayFee,
	OneWayFeeDocument,
} from '../one-way-fees/one-way-fee.schema'
import { Booking, BookingDocument, BookingStatus } from './booking.schema'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto'

@Injectable()
export class BookingsService {
	constructor(
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

		const vehicle = await this.vehicleModel.findOne({
			_id: vehicleId,
			isDeleted: false,
		} as any)

		if (!vehicle || !vehicle.isAvailable) {
			throw new NotFoundException(
				`Vehicle with ID ${vehicleId} not found or unavailable for rental`,
			)
		}

		if (pickupCity !== vehicle.city) {
			throw new BadRequestException('Pickup city must match the vehicle city')
		}
		if (!(await this.cityModel.exists({ _id: returnCity } as any))) {
			throw new NotFoundException('Return city not found')
		}

		const user = await this.userModel.findById(userId)
		if (!user) {
			throw new NotFoundException('User not found')
		}

		const overlappingBooking = await this.bookingModel.findOne({
			vehicle: vehicleId,
			status: {
				$in: [
					BookingStatus.PENDING,
					BookingStatus.CONFIRMED,
					BookingStatus.ACTIVE,
				],
			},
			startDate: { $lt: end },
			endDate: { $gt: start },
		})

		if (overlappingBooking) {
			throw new BadRequestException(
				'Vehicle is already booked for one or more dates in the selected range',
			)
		}

		const diffTime = Math.abs(end.getTime() - start.getTime())
		const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		const isOneWayRental = returnCity !== vehicle.city
		const routeFee = isOneWayRental
			? await this.oneWayFeeModel
					.findOne({ originCity: vehicle.city, destinationCity: returnCity })
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
			pickupCity: vehicle.city,
			returnCity,
			totalPrice,
			oneWayFee,
			phoneNumber,
			status: BookingStatus.PENDING,
		})

		return newBooking.save()
	}

	async getUserBookings(userId: string): Promise<Booking[]> {
		return this.bookingModel
			.find({ user: userId })
			.populate(['vehicle', 'pickupCity', 'returnCity'])
			.sort({ createdAt: -1 })
			.exec()
	}

	async getAllBookings(): Promise<Booking[]> {
		return this.bookingModel
			.find()
			.populate('user')
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

		if (
			updateBookingStatusDto.status === BookingStatus.COMPLETED &&
			booking.status !== BookingStatus.COMPLETED
		) {
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			if (today < booking.endDate) {
				throw new BadRequestException(
					'Booking cannot be completed before its end date',
				)
			}
		}

		const shouldMoveVehicle =
			updateBookingStatusDto.status === BookingStatus.COMPLETED &&
			booking.status !== BookingStatus.COMPLETED &&
			booking.pickupCity !== booking.returnCity

		if (shouldMoveVehicle) {
			const vehicle = await this.vehicleModel.findOne({
				_id: booking.vehicle,
				isDeleted: false,
			} as any)
			if (!vehicle) {
				throw new NotFoundException('Vehicle not found')
			}
			vehicle.city = booking.returnCity
			await vehicle.save()
		}

		booking.status = updateBookingStatusDto.status
		return booking.save()
	}

	async cancelBooking(id: string, userId: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}

		if (booking.user.toString() !== userId.toString()) {
			throw new ForbiddenException('You can only cancel your own bookings')
		}

		if (
			booking.status !== BookingStatus.PENDING &&
			booking.status !== BookingStatus.CONFIRMED
		) {
			throw new BadRequestException(
				'Cannot cancel an active or already completed booking',
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
