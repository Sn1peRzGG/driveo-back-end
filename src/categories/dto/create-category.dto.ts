import {
	IsInt,
	IsOptional,
	IsString,
	Min,
	MinLength,
	MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCategoryDto {
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	name!: string

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	count?: number

	@IsOptional()
	file?: any
}
