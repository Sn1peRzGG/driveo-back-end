import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateContactDto {
	@ApiProperty({ example: 'John Doe', description: 'Full name of the sender' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name!: string

	@ApiProperty({
		example: 'john@example.com',
		description: 'Email address of the sender',
	})
	@IsEmail()
	email!: string

	@ApiProperty({
		example: 'reservation',
		description: 'Subject category of the message',
	})
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	subject!: string

	@ApiProperty({
		example: 'I would like to know more about long-term rentals.',
		description: 'Message content',
	})
	@IsString()
	@MinLength(10)
	@MaxLength(2000)
	message!: string
}
