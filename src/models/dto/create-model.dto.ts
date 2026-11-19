import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateModelDto {
	@ApiProperty({ example: 'Model X', description: 'Unique model name' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name!: string
}
