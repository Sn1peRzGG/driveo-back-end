import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'

export class CreateCategoryDto {
	@ApiProperty({
		example: 'SUV',
		description: 'Category name',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	name!: string

	@ApiPropertyOptional({
		example: 5,
		description: 'Number of vehicles in this category',
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	count?: number

	@ApiPropertyOptional({
		type: 'string',
		format: 'binary',
		description: 'Category image file',
	})
	@IsOptional()
	file?: any
}
