import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsDateString,
	IsEmail,
	IsNotEmpty,
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
		example: '2005-06-15T00:00:00.000Z',
		description: 'Birth date (must be at least 18 years old)',
	})
	@IsDateString(
		{},
		{
			message: 'Invalid birth date format',
		},
	)
	@IsNotEmpty({
		message: 'Birth date is required',
	})
	birthDate!: string

	@ApiProperty({
		example: '+491711234567',
		description: 'Phone number',
	})
	@IsPhoneNumber(undefined, {
		message: 'Invalid phone number',
	})
	phoneNumber!: string

	@ApiPropertyOptional({
		example: 'Berlin',
		description: 'City',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	city?: string

	@ApiPropertyOptional({
		type: 'string',
		format: 'binary',
		description: 'Avatar image file',
	})
	@IsOptional()
	file?: any
}
