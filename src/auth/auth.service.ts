import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
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

		if (!user) {
			throw new UnauthorizedException('User with this email does not exist')
		}

		if (!user.password || !(await bcrypt.compare(pass, user.password))) {
			throw new UnauthorizedException('Incorrect password')
		}

		const { password: _password, ...result } = user.toObject()
		return result
	}

	login(user: ValidatedUser): { access_token: string } {
		const payload = { email: user.email, sub: user._id, role: user.role }
		return {
			access_token: this.jwtService.sign(payload),
		}
	}
}
