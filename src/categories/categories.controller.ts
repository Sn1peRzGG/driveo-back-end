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
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Create a new category (Admin only)' })
	@ApiResponse({ status: 201, description: 'Category successfully created.' })
	@ApiResponse({
		status: 400,
		description: 'Validation failed or missing image.',
	})
	create(
		@Body() dto: CreateCategoryDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		if (!file) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: {
					file: ['Image is required'],
				},
			})
		}
		return this.categoriesService.create(dto, file)
	}

	@Get()
	@ApiOperation({ summary: 'Get all categories' })
	@ApiResponse({ status: 200, description: 'Categories list retrieved.' })
	findAll() {
		return this.categoriesService.findAll()
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get category by ID' })
	@ApiResponse({ status: 200, description: 'Category found.' })
	@ApiResponse({ status: 404, description: 'Category not found.' })
	findOne(@Param('id') id: string) {
		return this.categoriesService.findOne(id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Update category by ID (Admin only)' })
	@ApiResponse({ status: 200, description: 'Category successfully updated.' })
	@ApiResponse({ status: 404, description: 'Category not found.' })
	update(
		@Param('id') id: string,
		@Body() dto: UpdateCategoryDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.categoriesService.update(id, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@Delete(':id')
	@ApiOperation({ summary: 'Delete category by ID (Admin only)' })
	@ApiResponse({ status: 200, description: 'Category successfully deleted.' })
	@ApiResponse({ status: 404, description: 'Category not found.' })
	remove(@Param('id') id: string) {
		return this.categoriesService.remove(id)
	}
}
