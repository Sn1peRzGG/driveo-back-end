import {
	BadRequestException,
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
import {
	Booking,
	BookingDocument,
	BookingStatus,
} from '../bookings/booking.schema'
import { Category, CategoryDocument } from '../categories/category.schema'
import { City, CityDocument } from '../cities/city.schema'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { Vehicle, VehicleDocument } from './vehicle.schema'

@Injectable()
export class VehiclesService {
	constructor(
		@InjectModel(Vehicle.name)
		private readonly vehicleModel: Model<VehicleDocument>,
		@InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
		@InjectModel(Booking.name)
		private readonly bookingModel: Model<BookingDocument>,
	) {}

	private async ensureCityExists(cityId: string): Promise<void> {
		const city = await this.cityModel.exists({ _id: cityId } as any)
		if (!city) throw new NotFoundException('City not found')
	}

	private readonly uploadPath = join(process.cwd(), 'public', 'vehicles')

	private toResponse(vehicle: any) {
		const source = vehicle?.toObject ? vehicle.toObject() : vehicle
		const reference = (value: any) =>
			typeof value === 'string'
				? { _id: value, name: '' }
				: { _id: value._id, name: value.name }

		return {
			_id: source._id,
			brand: source.brand,
			model: source.model,
			year: source.year,
			description: source.description,
			images: source.images ?? [],
			category: reference(source.category),
			city: reference(source.city),
			pricePerDay: source.pricePerDay,
			seats: source.seats,
			transmission: source.transmission,
			fuelType: source.fuelType,
			doors: source.doors,
			features: source.features,
			type: source.type,
			isAvailable: source.isAvailable,
		}
	}

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
		} catch {
			return
		}
	}

	async create(dto: CreateVehicleDto, files: Express.Multer.File[]) {
		await this.ensureCityExists(dto.city)
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

		const savedImages: string[] = []
		try {
			for (const file of files) {
				const imagePath = await this.saveFile(file)
				savedImages.push(imagePath)
			}

			const vehicle = await this.vehicleModel.create({
				...dto,
				pricePerDay: Number(dto.pricePerDay),
				year: Number(dto.year),
				seats: Number(dto.seats),
				isAvailable: dto.isAvailable ?? true,
				images: savedImages,
				isDeleted: false,
			} as any)

			return this.toResponse(await vehicle.populate(['category', 'city']))
		} catch {
			for (const img of savedImages) {
				await this.deleteFile(img)
			}
			throw new InternalServerErrorException({
				message: 'Failed to create vehicle',
			})
		}
	}

	async findAll() {
		const vehicles = await this.vehicleModel
			.find({ isDeleted: false })
			.populate(['category', 'city'])
			.sort({ createdAt: -1 })
			.lean()
		return vehicles.map(vehicle => this.toResponse(vehicle))
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
		transmission?: string,
		fuelType?: string,
		isAvailable?: boolean,
		sortBy?: string,
		rentalDate?: string,
		returnDate?: string,
		minYear?: number,
		maxYear?: number,
	) {
		const filter: any = { isDeleted: false }

		if (brand && brand !== 'all')
			filter.brand = { $regex: brand, $options: 'i' }
		if (category && category !== 'all') filter.category = category
		if (city && city !== 'all') filter.city = city
		if (seats !== undefined) filter.seats = seats
		if (transmission && transmission !== 'all')
			filter.transmission = transmission
		if (fuelType && fuelType !== 'all') filter.fuelType = fuelType

		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.pricePerDay = {}
			if (minPrice !== undefined) filter.pricePerDay.$gte = minPrice
			if (maxPrice !== undefined) filter.pricePerDay.$lte = maxPrice
		}

		if (minYear !== undefined || maxYear !== undefined) {
			filter.year = {}
			if (minYear !== undefined) filter.year.$gte = minYear
			if (maxYear !== undefined) filter.year.$lte = maxYear
		}

		if (isAvailable === true) filter.isAvailable = true
		if (rentalDate || returnDate) {
			if (!rentalDate || !returnDate) {
				throw new BadRequestException(
					'Rental and return dates are both required',
				)
			}
			const startDate = new Date(rentalDate)
			const endDate = new Date(returnDate)
			if (
				Number.isNaN(startDate.getTime()) ||
				Number.isNaN(endDate.getTime()) ||
				startDate >= endDate
			) {
				throw new BadRequestException('Invalid rental date range')
			}
			const bookedVehicleIds = await this.bookingModel.distinct('vehicle', {
				status: {
					$in: [
						BookingStatus.PENDING,
						BookingStatus.CONFIRMED,
						BookingStatus.ACTIVE,
					],
				},
				startDate: { $lt: endDate },
				endDate: { $gt: startDate },
			})
			filter._id = { $nin: bookedVehicleIds }
		}

		const total = await this.vehicleModel.countDocuments(filter)

		const metaAggregation = await this.vehicleModel.aggregate([
			{ $match: { isDeleted: false } },
			{
				$group: {
					_id: null,
					minPrice: { $min: '$pricePerDay' },
					maxPrice: { $max: '$pricePerDay' },
					minYear: { $min: '$year' },
					maxYear: { $max: '$year' },
					brands: { $addToSet: '$brand' },
					categories: { $addToSet: '$category' },
					cities: { $addToSet: '$city' },
					transmissions: { $addToSet: '$transmission' },
					fuelTypes: { $addToSet: '$fuelType' },
					seats: { $addToSet: '$seats' },
				},
			},
		])

		const metaData = metaAggregation[0] || {}

		const globalMinPrice =
			metaData.minPrice !== undefined && metaData.minPrice !== null
				? Math.floor(metaData.minPrice)
				: 0

		const globalMaxPrice =
			metaData.maxPrice !== undefined && metaData.maxPrice !== null
				? Math.ceil(metaData.maxPrice)
				: 1000

		const globalMinYear = metaData.minYear ?? 2000
		const globalMaxYear = metaData.maxYear ?? new Date().getFullYear()

		const availableBrands = (metaData.brands || []).sort()
		const availableTransmissions = (metaData.transmissions || []).sort()
		const availableFuelTypes = (metaData.fuelTypes || []).sort()
		const availableSeats = (metaData.seats || []).sort(
			(a: number, b: number) => a - b,
		)

		const [availableCategories, availableCities] = await Promise.all([
			this.categoryModel
				? this.categoryModel
						.find({ _id: { $in: metaData.categories || [] } })
						.lean()
				: [],
			this.cityModel.find({ _id: { $in: metaData.cities || [] } }).lean(),
		])

		const sortObject: any = { isAvailable: -1 }

		if (sortBy === 'price-asc') {
			sortObject.pricePerDay = 1
		} else if (sortBy === 'price-desc') {
			sortObject.pricePerDay = -1
		} else if (sortBy === 'year-desc') {
			sortObject.year = -1
		} else if (sortBy === 'year-asc') {
			sortObject.year = 1
		} else {
			sortObject.createdAt = -1
		}

		const data = await this.vehicleModel
			.find(filter)
			.populate(['category', 'city'])
			.sort(sortObject)
			.skip((page - 1) * limit)
			.limit(limit)
			.lean()

		return {
			data: data.map(vehicle => this.toResponse(vehicle)),
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
				minPrice: globalMinPrice,
				maxPrice: globalMaxPrice,
				minYear: globalMinYear,
				maxYear: globalMaxYear,
				options: {
					brands: availableBrands,
					categories: availableCategories.map(c => ({
						_id: c._id,
						name: c.name,
					})),
					cities: availableCities.map(c => ({ _id: c._id, name: c.name })),
					transmissions: availableTransmissions,
					fuelTypes: (metaData.fuelTypes || []).sort(),
					seats: availableSeats,
				},
			},
		}
	}

	async findOne(id: string) {
		const vehicle = await this.vehicleModel
			.findOne({ _id: id, isDeleted: false } as any)
			.populate(['category', 'city'])
			.lean()
		if (!vehicle) throw new NotFoundException({ message: 'Vehicle not found' })
		return this.toResponse(vehicle)
	}

	async update(
		id: string,
		dto: UpdateVehicleDto,
		files?: Express.Multer.File[],
	) {
		const current = await this.vehicleModel.findOne({
			_id: id,
			isDeleted: false,
		} as any)
		if (!current) throw new NotFoundException({ message: 'Vehicle not found' })

		if (dto.city && dto.city !== current.city)
			await this.ensureCityExists(dto.city)

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

		const newSavedImages: string[] = []

		try {
			if (files && files.length > 0) {
				for (const file of files) {
					const imagePath = await this.saveFile(file)
					newSavedImages.push(imagePath)
				}
			}

			let keptImages: string[] = []
			if (dto.existingImages) {
				keptImages = dto.existingImages
			} else if (
				dto.existingImages === undefined &&
				(!files || files.length === 0)
			) {
				keptImages = current.images ?? []
			}

			const finalImages = [...keptImages, ...newSavedImages]
			const oldImages = current.images ?? []
			const imagesToDelete = oldImages.filter(img => !finalImages.includes(img))

			const updateData: any = { ...dto }
			if (dto.pricePerDay) updateData.pricePerDay = Number(dto.pricePerDay)
			if (dto.seats) updateData.seats = Number(dto.seats)
			if (dto.year) updateData.year = Number(dto.year)

			delete updateData.existingImages
			updateData.images = finalImages

			const updated = await this.vehicleModel
				.findByIdAndUpdate(
					id,
					{ $set: updateData },
					{ returnDocument: 'after' },
				)
				.populate(['category', 'city'])

			for (const oldImg of imagesToDelete) {
				await this.deleteFile(oldImg)
			}

			return this.toResponse(updated)
		} catch {
			for (const newImg of newSavedImages) {
				await this.deleteFile(newImg)
			}
			throw new InternalServerErrorException({
				message: 'Failed to update vehicle',
			})
		}
	}

	async findAllCities() {
		return this.cityModel
			.find({
				_id: {
					$in: await this.vehicleModel.distinct('city', { isDeleted: false }),
				},
			} as any)
			.sort({ name: 1 })
			.lean()
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
