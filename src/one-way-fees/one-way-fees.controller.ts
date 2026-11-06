import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateOneWayFeeDto } from './dto/create-one-way-fee.dto'
import { OneWayFeesService } from './one-way-fees.service'

@ApiTags('One-way fees')
@Controller('one-way-fees')
export class OneWayFeesController {
	constructor(private readonly oneWayFeesService: OneWayFeesService) {}

	@Get()
	@ApiOperation({ summary: 'Get all configured one-way fees' })
	findAll() {
		return this.oneWayFeesService.findAll()
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create or update a one-way fee (Admin only)' })
	create(@Body() dto: CreateOneWayFeeDto) {
		return this.oneWayFeesService.create(dto)
	}
}
