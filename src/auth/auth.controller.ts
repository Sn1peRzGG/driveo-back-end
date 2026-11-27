import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
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
import type { Request, Response } from 'express'
import {
	jwtCookieClearOptions,
	jwtCookieOptions,
} from '../common/config/cookie.config'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

interface UserPayload {
	_id: string
	email: string
	role: string
}

interface RequestWithUser extends Request {
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
		@Res({ passthrough: true }) res: Response,
	): Promise<{ message: string }> {
		const user = await this.authService.validateUser(
			loginDto.email,
			loginDto.password,
		)
		if (!user) {
			throw new UnauthorizedException()
		}
		const tokenData = this.authService.generateToken(user)

		res.cookie('jwt', tokenData.access_token, jwtCookieOptions)
		return { message: 'Successfully logged in' }
	}

	@Post('signup')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Register a new user and set JWT cookie' })
	@ApiResponse({
		status: 201,
		description: 'User successfully created and logged in.',
	})
	@ApiResponse({ status: 400, description: 'Validation failed.' })
	@ApiResponse({ status: 409, description: 'Email or phone already exists.' })
	async signup(
		@Body() dto: CreateUserDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { user, access_token } = await this.authService.signup(dto)

		res.cookie('jwt', access_token, jwtCookieOptions)

		return { message: 'Successfully registered and logged in', user }
	}

	@Post('logout')
	@ApiOperation({ summary: 'Clear JWT cookie and logout' })
	@ApiResponse({ status: 201, description: 'Successfully logged out.' })
	logout(@Res({ passthrough: true }) res: Response): {
		message: string
	} {
		res.clearCookie('jwt', jwtCookieClearOptions)
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
		@Res({ passthrough: true }) res: Response,
	) {
		await this.usersService.removeMe(req.user._id, req.user.role)

		res.clearCookie('jwt', jwtCookieClearOptions)
		return { success: true, message: 'Account permanently deleted' }
	}
}
