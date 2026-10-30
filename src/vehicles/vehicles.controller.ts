import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { VehiclesService } from './vehicles.service'

@Controller('vehicles')
export class VehiclesController {
	constructor(private readonly vehiclesService: VehiclesService) {}

	@Get('cities')
	findAllCities() {
		return this.vehiclesService.findAllCities()
	}

	@Get('search')
	search(
		@Query('brand') brand?: string,
		@Query('category') category?: string,
		@Query('city') city?: string,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '20',
		@Query('minPrice') minPrice?: string,
		@Query('maxPrice') maxPrice?: string,
		@Query('seats') seats?: string,
		@Query('isAvailable') isAvailable?: string,
		@Query('sortBy') sortBy?: string,
	) {
		const pageNum = parseInt(page, 10) || 1
		const limitNum = parseInt(limit, 10) || 20

		const minPriceNum = minPrice ? parseFloat(minPrice) : undefined
		const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined
		const seatsNum = seats ? parseInt(seats, 10) : undefined

		const isAvailableBool = isAvailable === 'true' ? true : undefined

		return this.vehiclesService.search(
			brand,
			category,
			city,
			pageNum,
			limitNum,
			minPriceNum,
			maxPriceNum,
			seatsNum,
			isAvailableBool,
			sortBy,
		)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	create(
		@Body() dto: CreateVehicleDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		if (!file) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: { file: ['Image is required'] },
			})
		}
		return this.vehiclesService.create(dto, file)
	}

	@Get()
	findAll() {
		return this.vehiclesService.findAll()
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.vehiclesService.findOne(id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	update(
		@Param('id') id: string,
		@Body() dto: UpdateVehicleDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.vehiclesService.update(id, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.vehiclesService.remove(id)
	}
}
