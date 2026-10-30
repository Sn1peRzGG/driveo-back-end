import { IsEnum, IsNotEmpty } from 'class-validator'
import { BookingStatus } from '../booking.schema'

export class UpdateBookingStatusDto {
	@IsEnum(BookingStatus)
	@IsNotEmpty()
	status!: BookingStatus
}
