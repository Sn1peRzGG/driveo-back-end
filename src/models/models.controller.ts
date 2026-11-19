import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateModelDto } from './dto/create-model.dto'
import { ModelsService } from './models.service'

@ApiTags('Models')
@Controller('models')
export class ModelsController {
	constructor(private readonly modelsService: ModelsService) {}

	@Get()
	@ApiOperation({ summary: 'Get all models' })
	findAll() {
		return this.modelsService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get model by ID' })
	findOne(@Param('id') id: string) {
		return this.modelsService.findOne(id)
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('FLEET_ADMIN')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a model (Fleet admin and higher)' })
	create(@Body() dto: CreateModelDto) {
		return this.modelsService.create(dto)
	}
}
