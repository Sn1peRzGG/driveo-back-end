import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsString, Min } from 'class-validator'

export class CreateOneWayFeeDto {
	@ApiProperty({ description: 'Origin city UUIDv4 ID' })
	@IsString()
	originCity!: string

	@ApiProperty({ description: 'Destination city UUIDv4 ID' })
	@IsString()
	destinationCity!: string

	@ApiProperty({ example: 50, description: 'One-way rental fee' })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	fee!: number
}
