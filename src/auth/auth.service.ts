import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { UsersService } from '../users/users.service'

interface ValidatedUser {
	_id: string
	email: string
	role: string
	[key: string]: unknown
}

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async validateUser(
		email: string,
		pass: string,
	): Promise<ValidatedUser | null> {
		const user = await this.usersService.findByEmail(email)

		if (
			!user ||
			!user.password ||
			!(await bcrypt.compare(pass, user.password))
		) {
			throw new UnauthorizedException('Invalid email or password')
		}

		const { password: _password, ...result } = user.toObject()
		return result
	}

	generateToken(user: ValidatedUser): { access_token: string } {
		const payload = { email: user.email, sub: user._id, role: user.role }
		return {
			access_token: this.jwtService.sign(payload),
		}
	}

	async signup(dto: CreateUserDto) {
		const user = await this.usersService.create(dto)
		const tokenData = this.generateToken(user as ValidatedUser)

		return {
			user,
			access_token: tokenData.access_token,
		}
	}
}
