import { IsDateString, IsNotEmpty, IsString } from 'class-validator'

export class CreateBookingDto {
	@IsString()
	@IsNotEmpty()
	vehicleId!: string

	@IsDateString()
	@IsNotEmpty()
	startDate!: string

	@IsDateString()
	@IsNotEmpty()
	endDate!: string

	@IsString()
	@IsNotEmpty()
	pickupLocation!: string

	@IsString()
	@IsNotEmpty()
	returnLocation!: string

	@IsString()
	@IsNotEmpty()
	phoneNumber!: string
}
