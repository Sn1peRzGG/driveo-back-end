import { ApiProperty } from '@nestjs/swagger'
import { FuelType, Transmission } from '../vehicle.schema'

export class VehicleReferenceDto {
	@ApiProperty()
	_id!: string

	@ApiProperty()
	name!: string
}

export class VehicleResponseDto {
	@ApiProperty()
	_id!: string

	@ApiProperty()
	brand!: string

	@ApiProperty()
	model!: string

	@ApiProperty()
	year!: number

	@ApiProperty()
	description!: string

	@ApiProperty()
	images!: string[]

	@ApiProperty({ type: VehicleReferenceDto })
	category!: VehicleReferenceDto

	@ApiProperty({ type: VehicleReferenceDto })
	city!: VehicleReferenceDto

	@ApiProperty()
	pricePerDay!: number

	@ApiProperty()
	seats!: number

	@ApiProperty({ enum: Transmission })
	transmission!: Transmission

	@ApiProperty({ enum: FuelType })
	fuelType!: FuelType

	@ApiProperty()
	doors!: number

	@ApiProperty({ type: [String] })
	features!: string[]

	@ApiProperty()
	type!: string

	@ApiProperty()
	isAvailable!: boolean
}
