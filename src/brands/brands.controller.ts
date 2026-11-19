import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
	constructor(private readonly brandsService: BrandsService) {}

	@Get()
	@ApiOperation({ summary: 'Get all brands' })
	findAll() {
		return this.brandsService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get brand by ID' })
	findOne(@Param('id') id: string) {
		return this.brandsService.findOne(id)
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('FLEET_ADMIN')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a brand (Fleet admin and higher)' })
	create(@Body() dto: CreateBrandDto) {
		return this.brandsService.create(dto)
	}
}
