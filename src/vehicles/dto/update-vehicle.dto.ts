import { PartialType } from '@nestjs/mapped-types'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { CreateVehicleDto } from './create-vehicle.dto'

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
	@ApiPropertyOptional({
		type: [String],
		description: 'Existing image URLs to keep during update',
		example: ['/vehicles/uuid.jpg'],
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (typeof value === 'string') return [value]
		return value
	})
	@IsArray()
	@IsString({ each: true })
	existingImages?: string[]
}
