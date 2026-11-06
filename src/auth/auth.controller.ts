import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import * as express from 'express'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

interface UserPayload {
	_id: string
	email: string
	role: string
}

interface RequestWithUser extends express.Request {
	user: UserPayload
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	@Post('login')
	@ApiOperation({ summary: 'Authenticate user and set JWT cookie' })
	@ApiResponse({ status: 201, description: 'Successfully logged in.' })
	@ApiResponse({ status: 401, description: 'Invalid credentials.' })
	async login(
		@Body() loginDto: LoginDto,
		@Res({ passthrough: true }) res: express.Response,
	): Promise<{ message: string }> {
		const user = await this.authService.validateUser(
			loginDto.email,
			loginDto.password,
		)
		if (!user) {
			throw new UnauthorizedException()
		}
		const tokenData = this.authService.login(user)
		res.cookie('jwt', tokenData.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		})
		return { message: 'Successfully logged in' }
	}

	@Post('logout')
	@ApiOperation({ summary: 'Clear JWT cookie and logout' })
	@ApiResponse({ status: 201, description: 'Successfully logged out.' })
	logout(@Res({ passthrough: true }) res: express.Response): {
		message: string
	} {
		res.clearCookie('jwt', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			path: '/',
		})
		return { message: 'Logged out' }
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Get('me')
	@ApiOperation({ summary: 'Get current authenticated user profile' })
	@ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	async getMe(@Req() req: RequestWithUser) {
		return this.usersService.findOne(req.user._id)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Delete('me')
	@ApiOperation({ summary: 'Permanently delete current user account' })
	@ApiResponse({ status: 200, description: 'Account successfully deleted.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	async deleteMe(
		@Req() req: RequestWithUser,
		@Res({ passthrough: true }) res: express.Response,
	) {
		await this.usersService.removeMe(req.user._id, req.user.role)

		res.clearCookie('jwt')
		return { success: true, message: 'Account permanently deleted' }
	}
}
