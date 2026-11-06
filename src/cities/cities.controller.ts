import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CitiesService } from './cities.service'
import { CreateCityDto } from './dto/create-city.dto'

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {
	constructor(private readonly citiesService: CitiesService) {}

	@Get()
	@ApiOperation({ summary: 'Get all cities' })
	findAll() {
		return this.citiesService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get city by ID' })
	findOne(@Param('id') id: string) {
		return this.citiesService.findOne(id)
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a city (Admin only)' })
	create(@Body() dto: CreateCityDto) {
		return this.citiesService.create(dto)
	}
}
