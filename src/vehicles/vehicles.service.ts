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
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { Vehicle, VehicleDocument } from './vehicle.schema'

@Injectable()
export class VehiclesService {
	constructor(
		@InjectModel(Vehicle.name)
		private readonly vehicleModel: Model<VehicleDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'vehicles')

	private async saveFile(file: Express.Multer.File): Promise<string> {
		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}
		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/vehicles/${filename}`
	}

	private async deleteFile(path: string): Promise<void> {
		try {
			const relativePath = path.replace(/^\/+/, '')
			const fullPath = join(process.cwd(), 'public', relativePath)
			await fs.unlink(fullPath)
		} catch {}
	}

	async create(dto: CreateVehicleDto, file: Express.Multer.File) {
		const existing = await this.vehicleModel.findOne({
			brand: dto.brand,
			model: dto.model,
			isDeleted: false,
		} as any)
		if (existing) {
			throw new ConflictException({
				message: 'Vehicle already exists',
				errors: { model: ['Vehicle with this brand and model already exists'] },
			})
		}

		let image = ''
		try {
			image = await this.saveFile(file)
			const vehicle = await this.vehicleModel.create({
				...dto,
				pricePerDay: Number(dto.pricePerDay),
				seats: Number(dto.seats),
				isAvailable: dto.isAvailable ?? true,
				image,
				isDeleted: false,
			} as any)
			return await vehicle.populate('category')
		} catch {
			if (image) await this.deleteFile(image)
			throw new InternalServerErrorException({
				message: 'Failed to create vehicle',
			})
		}
	}

	async findAll() {
		return this.vehicleModel
			.find({ isDeleted: false })
			.populate('category')
			.sort({ createdAt: -1 })
			.lean()
	}

	async search(
		brand?: string,
		category?: string,
		city?: string,
		page: number = 1,
		limit: number = 20,
		minPrice?: number,
		maxPrice?: number,
		seats?: number,
		isAvailable?: boolean,
		sortBy?: string,
	) {
		const filter: any = { isDeleted: false }

		if (brand) filter.brand = { $regex: brand, $options: 'i' }
		if (category) filter.category = category
		if (city) filter.city = city
		if (seats) filter.seats = seats

		const boundsFilter = { ...filter }

		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.pricePerDay = {}
			if (minPrice !== undefined) filter.pricePerDay.$gte = minPrice
			if (maxPrice !== undefined) filter.pricePerDay.$lte = maxPrice
		}

		if (isAvailable === true) filter.isAvailable = true

		const total = await this.vehicleModel.countDocuments(filter)

		const bounds = await this.vehicleModel.aggregate([
			{ $match: boundsFilter },
			{
				$group: {
					_id: null,
					minPrice: { $min: '$pricePerDay' },
					maxPrice: { $max: '$pricePerDay' },
				},
			},
		])

		const globalMinPrice =
			bounds[0]?.minPrice !== undefined && bounds[0]?.minPrice !== null
				? Math.floor(bounds[0].minPrice)
				: 0

		const globalMaxPrice =
			bounds[0]?.maxPrice !== undefined && bounds[0]?.maxPrice !== null
				? Math.ceil(bounds[0].maxPrice)
				: 1000

		const sortObject: any = { isAvailable: -1 }

		if (sortBy === 'price-asc') {
			sortObject.pricePerDay = 1
		} else if (sortBy === 'price-desc') {
			sortObject.pricePerDay = -1
		} else {
			sortObject.createdAt = -1
		}

		const data = await this.vehicleModel
			.find(filter)
			.populate('category')
			.sort(sortObject)
			.skip((page - 1) * limit)
			.limit(limit)
			.lean()

		return {
			data,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
				minPrice: globalMinPrice,
				maxPrice: globalMaxPrice,
			},
		}
	}

	async findOne(id: string) {
		const vehicle = await this.vehicleModel
			.findOne({ _id: id, isDeleted: false } as any)
			.populate('category')
			.lean()
		if (!vehicle) throw new NotFoundException({ message: 'Vehicle not found' })
		return vehicle
	}

	async update(id: string, dto: UpdateVehicleDto, file?: Express.Multer.File) {
		const current = await this.vehicleModel.findOne({
			_id: id,
			isDeleted: false,
		} as any)
		if (!current) throw new NotFoundException({ message: 'Vehicle not found' })

		if (dto.model && dto.model !== current.model) {
			const existing = await this.vehicleModel.findOne({
				brand: dto.brand || current.brand,
				model: dto.model,
				isDeleted: false,
			} as any)
			if (existing) {
				throw new ConflictException({
					message: 'Vehicle already exists',
					errors: {
						model: ['Vehicle with this brand and model already exists'],
					},
				})
			}
		}

		let image = current.image
		try {
			if (file) image = await this.saveFile(file)

			const updateData: any = { ...dto }
			if (dto.pricePerDay) updateData.pricePerDay = Number(dto.pricePerDay)
			if (dto.seats) updateData.seats = Number(dto.seats)
			updateData.image = image

			const updated = await this.vehicleModel
				.findByIdAndUpdate(
					id,
					{ $set: updateData },
					{ returnDocument: 'after' },
				)
				.populate('category')

			if (file && current.image) await this.deleteFile(current.image)
			return updated
		} catch {
			if (file && image !== current.image) await this.deleteFile(image)
			throw new InternalServerErrorException({
				message: 'Failed to update vehicle',
			})
		}
	}

	async findAllCities(): Promise<string[]> {
		return this.vehicleModel.distinct('city', { isDeleted: false })
	}

	async remove(id: string) {
		const vehicle = await this.vehicleModel.findByIdAndUpdate(
			id,
			{ isDeleted: true, isAvailable: false },
			{ returnDocument: 'after' },
		)

		if (!vehicle) throw new NotFoundException({ message: 'Vehicle not found' })

		return { success: true, message: 'Vehicle deleted successfully' }
	}
}
