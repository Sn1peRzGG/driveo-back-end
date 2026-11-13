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
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiOkResponse,
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
import { VehicleResponseDto } from './dto/vehicle-response.dto'
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
	@ApiQuery({
		name: 'brand',
		required: false,
		type: String,
		description: 'Comma-separated brands',
	})
	@ApiQuery({
		name: 'category',
		required: false,
		type: String,
		description: 'Comma-separated category IDs',
	})
	@ApiQuery({
		name: 'city',
		required: false,
		type: String,
		description: 'Comma-separated city IDs',
	})
	@ApiQuery({ name: 'page', required: false, type: String })
	@ApiQuery({ name: 'limit', required: false, type: String })
	@ApiQuery({ name: 'minPrice', required: false, type: String })
	@ApiQuery({ name: 'maxPrice', required: false, type: String })
	@ApiQuery({
		name: 'seats',
		required: false,
		type: String,
		description: 'Comma-separated seat counts (e.g. 4,5,7)',
	})
	@ApiQuery({
		name: 'transmission',
		required: false,
		type: String,
		description: 'Comma-separated transmissions',
	})
	@ApiQuery({
		name: 'fuelType',
		required: false,
		type: String,
		description: 'Comma-separated fuel types',
	})
	@ApiQuery({ name: 'isAvailable', required: false, type: String })
	@ApiQuery({ name: 'sortBy', required: false, type: String })
	@ApiQuery({ name: 'minYear', required: false, type: String })
	@ApiQuery({ name: 'maxYear', required: false, type: String })
	search(
		@Query('brand') brand?: string,
		@Query('category') category?: string,
		@Query('city') city?: string,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '20',
		@Query('minPrice') minPrice?: string,
		@Query('maxPrice') maxPrice?: string,
		@Query('seats') seats?: string,
		@Query('transmission') transmission?: string,
		@Query('fuelType') fuelType?: string,
		@Query('isAvailable') isAvailable?: string,
		@Query('sortBy') sortBy?: string,
		@Query('rentalDate') rentalDate?: string,
		@Query('returnDate') returnDate?: string,
		@Query('minYear') minYear?: string,
		@Query('maxYear') maxYear?: string,
	) {
		const pageNum = parseInt(page, 10) || 1
		const limitNum = parseInt(limit, 10) || 20

		const minPriceNum = minPrice ? parseFloat(minPrice) : undefined
		const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined
		const minYearNum = minYear ? parseInt(minYear, 10) : undefined
		const maxYearNum = maxYear ? parseInt(maxYear, 10) : undefined
		const isAvailableBool = isAvailable === 'true' ? true : undefined

		return this.vehiclesService.search(
			brand,
			category,
			city,
			pageNum,
			limitNum,
			minPriceNum,
			maxPriceNum,
			seats,
			transmission,
			fuelType,
			isAvailableBool,
			sortBy,
			rentalDate,
			returnDate,
			minYearNum,
			maxYearNum,
		)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FilesInterceptor('images', 3, multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Create a new vehicle (Admin only)' })
	@ApiResponse({ status: 201, description: 'Vehicle successfully created.' })
	@ApiResponse({
		status: 400,
		description: 'Validation failed or missing images.',
	})
	create(
		@Body() dto: CreateVehicleDto,
		@UploadedFiles() files: Express.Multer.File[],
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: { images: ['At least one image is required'] },
			})
		}
		return this.vehiclesService.create(dto, files)
	}

	@Get()
	@ApiOperation({ summary: 'Get all active vehicles' })
	@ApiOkResponse({ type: VehicleResponseDto, isArray: true })
	@ApiResponse({ status: 200, description: 'Vehicles list retrieved.' })
	findAll() {
		return this.vehiclesService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get vehicle by ID' })
	@ApiOkResponse({ type: VehicleResponseDto })
	@ApiResponse({ status: 200, description: 'Vehicle found.' })
	@ApiResponse({ status: 404, description: 'Vehicle not found.' })
	findOne(@Param('id') id: string) {
		return this.vehiclesService.findOne(id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Patch(':id')
	@UseInterceptors(FilesInterceptor('images', 3, multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Update vehicle by ID (Admin only)' })
	@ApiResponse({ status: 200, description: 'Vehicle successfully updated.' })
	@ApiResponse({ status: 404, description: 'Vehicle not found.' })
	update(
		@Param('id') id: string,
		@Body() dto: UpdateVehicleDto,
		@UploadedFiles() files?: Express.Multer.File[],
	) {
		return this.vehiclesService.update(id, dto, files)
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
