import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Brand, BrandDocument } from './brand.schema'
import { CreateBrandDto } from './dto/create-brand.dto'

@Injectable()
export class BrandsService {
	constructor(
		@InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
	) {}

	async create(dto: CreateBrandDto) {
		const brand = await this.brandModel.findOne({ name: dto.name.trim() })
		if (brand) throw new ConflictException('Brand already exists')
		return this.brandModel.create({ name: dto.name.trim() })
	}

	findAll() {
		return this.brandModel.find().sort({ name: 1 }).lean()
	}

	async findOne(id: string) {
		const brand = await this.brandModel.findById(id).lean()
		if (!brand) throw new NotFoundException('Brand not found')
		return brand
	}
}
