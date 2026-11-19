import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateBrandDto {
	@ApiProperty({ example: 'BMW', description: 'Unique brand name' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name!: string
}
