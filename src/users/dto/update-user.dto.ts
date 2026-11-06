import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@ApiPropertyOptional({
		enum: ['USER', 'ADMIN', 'OWNER'],
		example: 'ADMIN',
		description: 'User role',
	})
	@IsOptional()
	@IsEnum(['USER', 'ADMIN', 'OWNER'])
	role?: string
}
