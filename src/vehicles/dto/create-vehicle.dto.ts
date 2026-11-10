import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'
import { FuelType, Transmission } from '../vehicle.schema'

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
		example: 'A reliable and fuel-efficient sedan.',
		description: 'Vehicle description',
	})
	@IsString()
	@MinLength(10)
	@MaxLength(1000)
	description!: string

	@ApiProperty({
		example: 2020,
		description: 'Vehicle manufacturing year',
	})
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(new Date().getFullYear() + 1)
	year!: number

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
	@IsString()
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
		enum: Transmission,
		example: Transmission.AUTOMATIC,
		description: 'Transmission type',
	})
	@IsOptional()
	@IsEnum(Transmission)
	transmission?: Transmission

	@ApiPropertyOptional({ enum: FuelType, example: FuelType.HYBRID })
	@IsOptional()
	@IsEnum(FuelType)
	fuelType?: FuelType

	@ApiPropertyOptional({ example: 4, description: 'Number of doors' })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(2)
	doors?: number

	@ApiPropertyOptional({
		example: ['Bluetooth', 'Apple CarPlay', 'Parking sensors'],
		description: 'JSON array or comma-separated vehicle features',
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (Array.isArray(value)) return value
		if (typeof value !== 'string') return value
		try {
			return JSON.parse(value)
		} catch {
			return value
				.split(',')
				.map(item => item.trim())
				.filter(Boolean)
		}
	})
	@IsArray()
	@IsString({ each: true })
	features?: string[]

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
