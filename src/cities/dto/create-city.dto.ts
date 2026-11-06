import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCityDto {
	@ApiProperty({ example: 'Berlin', description: 'Unique city name' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name!: string
}
