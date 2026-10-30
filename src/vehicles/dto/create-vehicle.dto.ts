import { Transform, Type } from 'class-transformer'
import {
	IsBoolean,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'

export class CreateVehicleDto {
	@IsString()
	@MinLength(2)
	@MaxLength(60)
	brand!: string

	@IsString()
	@MinLength(1)
	@MaxLength(60)
	model!: string

	@IsString()
	@MinLength(2)
	@MaxLength(50)
	type!: string

	@IsString()
	category!: string

	@IsString()
	@MinLength(2)
	@MaxLength(100)
	city!: string

	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	pricePerDay!: number

	@Type(() => Number)
	@IsInt()
	@Min(1)
	seats!: number

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
}
