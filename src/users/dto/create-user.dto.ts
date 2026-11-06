import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsEmail,
	IsOptional,
	IsPhoneNumber,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator'

export class CreateUserDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email address',
	})
	@IsEmail(
		{},
		{
			message: 'Invalid email format',
		},
	)
	email!: string

	@ApiProperty({
		example: 'StrongP@ss1',
		description: 'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)',
	})
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
		message:
			'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter and 1 number',
	})
	password!: string

	@ApiProperty({
		example: 'John',
		description: 'First name',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	firstName!: string

	@ApiProperty({
		example: 'Doe',
		description: 'Last name',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	lastName!: string

	@ApiProperty({
		example: '+380971234567',
		description: 'Phone number',
	})
	@IsPhoneNumber(undefined, {
		message: 'Invalid phone number',
	})
	phoneNumber!: string

	@ApiPropertyOptional({
		example: 'Kyiv',
		description: 'City',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	city?: string

	@ApiPropertyOptional({
		example: 'Khreshchatyk st. 1',
		description: 'Address',
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	address?: string

	@ApiPropertyOptional({
		type: 'string',
		format: 'binary',
		description: 'Avatar image file',
	})
	@IsOptional()
	file?: any
}
