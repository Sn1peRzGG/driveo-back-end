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

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	create(
		@Body() dto: CreateUserDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.usersService.create(dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN', 'OWNER')
	@Get()
	findAll() {
		return this.usersService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
		if (
			req.user.role !== 'OWNER' &&
			req.user.role !== 'ADMIN' &&
			req.user._id !== id
		)
			throw new ForbiddenException()
		return this.usersService.findOne(id)
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	update(
		@Param('id') id: string,
		@Body() dto: UpdateUserDto,
		@Req() req: AuthenticatedRequest,
		@UploadedFile() file?: Express.Multer.File,
	) {
		if (
			req.user.role !== 'OWNER' &&
			req.user.role !== 'ADMIN' &&
			req.user._id !== id
		)
			throw new ForbiddenException()
		if (req.user.role !== 'OWNER') delete (dto as any).role
		return this.usersService.update(id, dto, req.user.role, file)
	}

	@UseGuards(JwtAuthGuard)
	@Post('saved/:vehicleId')
	toggleSavedVehicle(
		@Req() req: AuthenticatedRequest,
		@Param('vehicleId') vehicleId: string,
	) {
		return this.usersService.toggleSavedVehicle(req.user._id, vehicleId)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('OWNER')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(id)
	}
}
