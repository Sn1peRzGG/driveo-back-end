import {
	Body,
	Controller,
	Get,
	ParseUUIDPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
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
	@Roles('FLEET_ADMIN')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create or update a one-way fee (Fleet admin and higher)',
	})
	create(@Body() dto: CreateOneWayFeeDto) {
		return this.oneWayFeesService.create(dto)
	}

	@Get('calculate')
	@ApiOperation({ summary: 'Get one-way fee between two cities' })
	calculateFee(
		@Query('originCityId', new ParseUUIDPipe()) originCityId: string,
		@Query('destinationCityId', new ParseUUIDPipe()) destinationCityId: string,
	) {
		return this.oneWayFeesService.findByRoute(originCityId, destinationCityId)
	}
}
