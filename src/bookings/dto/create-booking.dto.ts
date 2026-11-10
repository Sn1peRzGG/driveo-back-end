import { ApiProperty } from '@nestjs/swagger'
import {
	IsDateString,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
} from 'class-validator'

export class CreateBookingDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'Vehicle UUIDv4 ID',
	})
	@IsString()
	@IsNotEmpty()
	vehicleId!: string

	@ApiProperty({
		example: '2026-06-01',
		description: 'Rental start date (YYYY-MM-DD)',
	})
	@IsDateString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Start date must use the YYYY-MM-DD format',
	})
	@IsNotEmpty()
	startDate!: string

	@ApiProperty({
		example: '2026-06-05',
		description: 'Rental end date (YYYY-MM-DD)',
	})
	@IsDateString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'End date must use the YYYY-MM-DD format',
	})
	@IsNotEmpty()
	endDate!: string

	@ApiProperty({
		description: 'Pickup city UUIDv4 ID. It must match the vehicle city.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	pickupCity!: string

	@ApiProperty({
		description:
			'Return city UUIDv4 ID. A different city creates a one-way rental.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	returnCity!: string

	@ApiProperty({
		example: '+380971234567',
		description: 'Contact phone number',
	})
	@IsString()
	@IsNotEmpty()
	phoneNumber!: string
}
