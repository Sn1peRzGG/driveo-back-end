import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Model } from 'mongoose'
import { Strategy } from 'passport-jwt'
import { User, UserDocument } from '../users/user.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
		super({
			jwtFromRequest: (req: Request) => {
				if (req && req.cookies) {
					return req.cookies['jwt']
				}
				return null
			},
			ignoreExpiration: false,
			secretOrKey:
				'28ddf7d7db3ee02c41c5d29ad2374b7b0e366daa1d23eb2bf3a4dee747d3af06',
		})
	}

	async validate(payload: any) {
		const user = await this.userModel.findById(payload.sub).lean()

		if (!user) {
			throw new UnauthorizedException('User not found or invalid token')
		}

		return {
			_id: user._id,
			role: user.role,
		}
	}
}
