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
import { Booking, BookingDocument, BookingStatus } from './booking.schema'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto'

@Injectable()
export class BookingsService {
	constructor(
		@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
		@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
	) {}

	async create(
		createBookingDto: CreateBookingDto,
		userId: string,
	): Promise<Booking> {
		const {
			vehicleId,
			startDate,
			endDate,
			pickupLocation,
			returnLocation,
			phoneNumber,
		} = createBookingDto

		const start = new Date(startDate)
		const end = new Date(endDate)

		if (start >= end) {
			throw new BadRequestException('End date must be greater than start date')
		}

		const vehicle = await this.vehicleModel.findById(vehicleId)
		if (!vehicle || !vehicle.isAvailable) {
			throw new NotFoundException(
				`Vehicle with ID ${vehicleId} not found or unavailable`,
			)
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
			throw new BadRequestException('Vehicle is already booked for these dates')
		}

		const diffTime = Math.abs(end.getTime() - start.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
		const totalPrice = Number((vehicle.pricePerDay * diffDays).toFixed(2))

		const user = await this.userModel.findById(userId)
		if (!user) {
			throw new NotFoundException('User not found')
		}

		const newBooking = new this.bookingModel({
			user: userId,
			vehicle: vehicleId,
			startDate: start,
			endDate: end,
			pickupLocation,
			returnLocation,
			totalPrice,
			phoneNumber,
			status: BookingStatus.PENDING,
		})

		return newBooking.save()
	}

	async getUserBookings(userId: string): Promise<Booking[]> {
		return this.bookingModel
			.find({ user: userId })
			.populate('vehicle')
			.populate('pickupLocation')
			.populate('returnLocation')
			.sort({ createdAt: -1 })
			.exec()
	}

	async getAllBookings(): Promise<Booking[]> {
		return this.bookingModel
			.find()
			.populate('user')
			.populate('vehicle')
			.populate('pickupLocation')
			.populate('returnLocation')
			.sort({ createdAt: -1 })
			.exec()
	}

	async updateStatus(
		id: string,
		updateBookingStatusDto: UpdateBookingStatusDto,
	): Promise<Booking> {
		const booking = await this.bookingModel.findByIdAndUpdate(
			id,
			{ $set: { status: updateBookingStatusDto.status } },
			{ returnDocument: 'after' },
		)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}
		return booking
	}

	async cancelBooking(id: string, userId: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(id)
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`)
		}

		if (booking.user !== userId) {
			throw new ForbiddenException('You can only cancel your own bookings')
		}

		if (booking.status !== BookingStatus.PENDING) {
			throw new ForbiddenException(
				'Cannot cancel a booking after it has been confirmed or processed',
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
		return { message: 'Booking successfully deleted from database' }
	}
}
