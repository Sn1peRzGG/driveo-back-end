import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { Model } from 'mongoose'
import { extname, join } from 'path'
import { Category, CategoryDocument } from './category.schema'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'categories')

	private async saveFile(file: Express.Multer.File) {
		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}
		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/categories/${filename}`
	}

	private async deleteFile(path: string) {
		try {
			const relativePath = path.replace(/^\/+/, '')
			const fullPath = join(process.cwd(), 'public', relativePath)
			await fs.unlink(fullPath)
		} catch {
			// File deleted
		}
	}

	async create(dto: CreateCategoryDto, file: Express.Multer.File) {
		const existing = await this.categoryModel.findOne({ name: dto.name })
		if (existing) {
			throw new ConflictException({
				message: 'Category already exists',
				errors: { name: ['Category with this name already exists'] },
			})
		}

		let imageUrl = ''
		try {
			imageUrl = await this.saveFile(file)
			return await this.categoryModel.create({ ...dto, imageUrl })
		} catch {
			if (imageUrl) await this.deleteFile(imageUrl)
			throw new InternalServerErrorException({
				message: 'Failed to create category',
			})
		}
	}

	async findAll() {
		return this.categoryModel.find().sort({ name: 1 }).lean()
	}

	async findOne(id: string) {
		const category = await this.categoryModel.findById(id).lean()
		if (!category)
			throw new NotFoundException({ message: 'Category not found' })
		return category
	}

	async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
		const current = await this.categoryModel.findById(id)
		if (!current) throw new NotFoundException({ message: 'Category not found' })

		if (dto.name && dto.name !== current.name) {
			const existing = await this.categoryModel.findOne({ name: dto.name })
			if (existing) {
				throw new ConflictException({
					message: 'Category already exists',
					errors: { name: ['Category with this name already exists'] },
				})
			}
		}

		let imageUrl = current.imageUrl
		try {
			if (file) imageUrl = await this.saveFile(file)
			const updated = await this.categoryModel.findByIdAndUpdate(
				id,
				{ ...dto, imageUrl },
				{ returnDocument: 'after' },
			)
			if (file && current.imageUrl) await this.deleteFile(current.imageUrl)
			return updated
		} catch {
			if (file && imageUrl !== current.imageUrl) await this.deleteFile(imageUrl)
			throw new InternalServerErrorException({
				message: 'Failed to update category',
			})
		}
	}

	async remove(id: string) {
		const category = await this.categoryModel.findByIdAndDelete(id)
		if (!category)
			throw new NotFoundException({ message: 'Category not found' })
		if (category.imageUrl) await this.deleteFile(category.imageUrl)
		return { success: true, message: 'Category deleted successfully' }
	}
}
