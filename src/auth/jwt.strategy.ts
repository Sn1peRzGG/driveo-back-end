import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Model } from 'mongoose'
import { Strategy } from 'passport-jwt'
import { User, UserDocument } from '../users/user.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		private readonly configService: ConfigService,
	) {
		super({
			jwtFromRequest: (req: Request) =>
				req?.cookies?.jwt ??
				(req?.headers.authorization?.startsWith('Bearer ')
					? req.headers.authorization.slice(7)
					: null),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
		})
	}

	async validate(payload: { sub: string }) {
		const user = await this.userModel.findById(payload.sub).lean()

		if (!user) {
			throw new UnauthorizedException('User not found or invalid token')
		}

		return {
			_id: user._id,
			email: user.email,
			role: user.role,
		}
	}
}
