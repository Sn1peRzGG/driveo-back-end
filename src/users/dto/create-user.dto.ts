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
	@IsEmail(
		{},
		{
			message: 'Invalid email format',
		},
	)
	email!: string

	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
		message:
			'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter and 1 number',
	})
	password!: string

	@IsString()
	@MinLength(2)
	@MaxLength(50)
	firstName!: string

	@IsString()
	@MinLength(2)
	@MaxLength(50)
	lastName!: string

	@IsPhoneNumber(undefined, {
		message: 'Invalid phone number',
	})
	phoneNumber!: string

	@IsOptional()
	@IsString()
	@MaxLength(100)
	city?: string

	@IsOptional()
	@IsString()
	@MaxLength(255)
	address?: string

	@IsOptional()
	@IsString()
	avatarUrl?: string
}
