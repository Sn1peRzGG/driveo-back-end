import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty } from 'class-validator'
import { BookingStatus } from '../booking.schema'

export class UpdateBookingStatusDto {
	@ApiProperty({
		enum: BookingStatus,
		example: BookingStatus.CONFIRMED,
		description: 'New booking status',
	})
	@IsEnum(BookingStatus)
	@IsNotEmpty()
	status!: BookingStatus
}
