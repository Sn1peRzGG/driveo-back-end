import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
	IsBoolean,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'

export class CreateVehicleDto {
	@ApiProperty({
		example: 'Toyota',
		description: 'Vehicle brand',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(60)
	brand!: string

	@ApiProperty({
		example: 'Camry',
		description: 'Vehicle model',
	})
	@IsString()
	@MinLength(1)
	@MaxLength(60)
	model!: string

	@ApiProperty({
		example: 'Sedan',
		description: 'Vehicle type',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	type!: string

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'Category UUIDv4 ID',
	})
	@IsString()
	category!: string

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'City UUIDv4 ID',
	})
	@IsUUID('4')
	city!: string

	@ApiProperty({
		example: 75.5,
		description: 'Price per day',
	})
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	pricePerDay!: number

	@ApiProperty({
		example: 5,
		description: 'Number of seats',
	})
	@Type(() => Number)
	@IsInt()
	@Min(1)
	seats!: number

	@ApiPropertyOptional({
		example: true,
		description: 'Availability status',
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true' || value === true || value === 1 || value === '1')
			return true
		if (value === 'false' || value === false || value === 0 || value === '0')
			return false
		return value
	})
	@IsBoolean()
	isAvailable?: boolean

	@ApiPropertyOptional({
		type: 'string',
		format: 'binary',
		description: 'Vehicle image file',
	})
	@IsOptional()
	file?: any
}
