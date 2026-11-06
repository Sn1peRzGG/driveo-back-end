import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsUUID, Min } from 'class-validator'

export class CreateOneWayFeeDto {
	@ApiProperty({ description: 'Origin city UUIDv4 ID' })
	@IsUUID('4')
	originCity!: string

	@ApiProperty({ description: 'Destination city UUIDv4 ID' })
	@IsUUID('4')
	destinationCity!: string

	@ApiProperty({ example: 50, description: 'One-way rental fee' })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	fee!: number
}
