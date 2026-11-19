import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

interface AuthenticatedRequest extends Request {
	user: { _id: string; role: string }
}

const STAFF_ROLES = ['ADMIN', 'FLEET_ADMIN', 'SYSADMIN', 'OWNER']

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({ status: 201, description: 'User successfully created.' })
	@ApiResponse({ status: 400, description: 'Validation failed.' })
	@ApiResponse({ status: 409, description: 'Email or phone already exists.' })
	create(
		@Body() dto: CreateUserDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.usersService.create(dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN', 'OWNER')
	@ApiBearerAuth()
	@Get()
	@ApiOperation({ summary: 'Get all users (Admin or Owner only)' })
	@ApiResponse({ status: 200, description: 'List of users retrieved.' })
	findAll() {
		return this.usersService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Get(':id')
	@ApiOperation({ summary: 'Get user by ID' })
	findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
		const isStaff = STAFF_ROLES.includes(req.user.role)
		if (!isStaff && req.user._id !== id) {
			throw new ForbiddenException('You can only view your own profile.')
		}
		return this.usersService.findOne(id)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Update user by ID' })
	@ApiResponse({ status: 200, description: 'User successfully updated.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateUserDto,
		@Req() req: AuthenticatedRequest,
		@UploadedFile() file?: Express.Multer.File,
	) {
		const currentUser = req.user
		const targetUserId = id

		const isStaff = ['OWNER', 'SYSADMIN', 'ADMIN'].includes(currentUser.role)
		const isSelf = currentUser._id === targetUserId

		if (!isStaff && !isSelf) {
			throw new ForbiddenException(
				'You do not have permission to update this user.',
			)
		}

		if (dto.role) {
			if (currentUser.role !== 'OWNER' && currentUser.role !== 'SYSADMIN') {
				throw new ForbiddenException(
					'Only Owners and System Administrators can change user roles.',
				)
			}

			if (
				currentUser.role === 'SYSADMIN' &&
				(dto.role === 'SYSADMIN' || dto.role === 'OWNER')
			) {
				throw new ForbiddenException(
					'System Administrators cannot assign SYSADMIN or OWNER roles.',
				)
			}
		} else {
			if (currentUser.role !== 'OWNER' && currentUser.role !== 'SYSADMIN') {
				delete (dto as any).role
			}
		}

		return this.usersService.update(id, dto, currentUser.role, file)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Post('saved/:vehicleId')
	@ApiOperation({ summary: 'Toggle vehicle in saved list' })
	@ApiResponse({ status: 200, description: 'Saved vehicles list updated.' })
	toggleSavedVehicle(
		@Req() req: AuthenticatedRequest,
		@Param('vehicleId') vehicleId: string,
	) {
		return this.usersService.toggleSavedVehicle(req.user._id, vehicleId)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@Delete('me')
	@ApiOperation({ summary: 'Delete own user account (Regular users only)' })
	@ApiResponse({ status: 200, description: 'Account successfully deleted.' })
	removeMyAccount(@Req() req: AuthenticatedRequest) {
		const user = req.user

		if (STAFF_ROLES.includes(user.role)) {
			throw new ForbiddenException(
				'Admins and higher-tier staff cannot delete their own accounts through self-service.',
			)
		}

		return this.usersService.remove(user._id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('SYSADMIN')
	@ApiBearerAuth()
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete user by ID (System Administrator or higher)',
	})
	@ApiResponse({ status: 200, description: 'User successfully deleted.' })
	remove(@Param('id') id: string) {
		return this.usersService.remove(id)
	}
}
