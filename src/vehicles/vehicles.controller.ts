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
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { VehiclesService } from './vehicles.service'

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
	constructor(private readonly vehiclesService: VehiclesService) {}

	@Get('cities')
	@ApiOperation({ summary: 'Get list of unique vehicle cities' })
	@ApiResponse({ status: 200, description: 'Cities list retrieved.' })
	findAllCities() {
		return this.vehiclesService.findAllCities()
	}

	@Get('search')
	@ApiOperation({ summary: 'Search and filter vehicles with pagination' })
	@ApiResponse({ status: 200, description: 'Search results retrieved.' })
	@ApiQuery({ name: 'brand', required: false, type: String })
	@ApiQuery({ name: 'category', required: false, type: String })
	@ApiQuery({ name: 'city', required: false, type: String })
	@ApiQuery({ name: 'page', required: false, type: String })
	@ApiQuery({ name: 'limit', required: false, type: String })
	@ApiQuery({ name: 'minPrice', required: false, type: String })
	@ApiQuery({ name: 'maxPrice', required: false, type: String })
	@ApiQuery({ name: 'seats', required: false, type: String })
	@ApiQuery({ name: 'isAvailable', required: false, type: String })
	@ApiQuery({ name: 'sortBy', required: false, type: String })
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
		@Query('rentalDate') rentalDate?: string,
		@Query('returnDate') returnDate?: string,
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
			rentalDate,
			returnDate,
		)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Create a new vehicle (Admin only)' })
	@ApiResponse({ status: 201, description: 'Vehicle successfully created.' })
	@ApiResponse({
		status: 400,
		description: 'Validation failed or missing image.',
	})
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
	@ApiOperation({ summary: 'Get all active vehicles' })
	@ApiResponse({ status: 200, description: 'Vehicles list retrieved.' })
	findAll() {
		return this.vehiclesService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get vehicle by ID' })
	@ApiResponse({ status: 200, description: 'Vehicle found.' })
	@ApiResponse({ status: 404, description: 'Vehicle not found.' })
	findOne(@Param('id') id: string) {
		return this.vehiclesService.findOne(id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Update vehicle by ID (Admin only)' })
	@ApiResponse({ status: 200, description: 'Vehicle successfully updated.' })
	@ApiResponse({ status: 404, description: 'Vehicle not found.' })
	update(
		@Param('id') id: string,
		@Body() dto: UpdateVehicleDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.vehiclesService.update(id, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Delete(':id')
	@ApiOperation({ summary: 'Delete vehicle by ID (Admin only)' })
	@ApiResponse({ status: 200, description: 'Delete status.' })
	remove(@Param('id') id: string) {
		return this.vehiclesService.remove(id)
	}
}
