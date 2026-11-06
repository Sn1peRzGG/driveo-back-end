import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { City, CityDocument } from './city.schema'
import { CreateCityDto } from './dto/create-city.dto'

@Injectable()
export class CitiesService {
	constructor(
		@InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
	) {}

	async create(dto: CreateCityDto) {
		const city = await this.cityModel.findOne({ name: dto.name.trim() })
		if (city) throw new ConflictException('City already exists')
		return this.cityModel.create({ name: dto.name.trim() })
	}

	findAll() {
		return this.cityModel.find().sort({ name: 1 }).lean()
	}

	async findOne(id: string) {
		const city = await this.cityModel.findById(id).lean()
		if (!city) throw new NotFoundException('City not found')
		return city
	}
}
