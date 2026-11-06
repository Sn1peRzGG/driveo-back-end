import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { City, CityDocument } from '../cities/city.schema'
import { CreateOneWayFeeDto } from './dto/create-one-way-fee.dto'
import { OneWayFee, OneWayFeeDocument } from './one-way-fee.schema'

@Injectable()
export class OneWayFeesService {
	constructor(
		@InjectModel(OneWayFee.name)
		private readonly feeModel: Model<OneWayFeeDocument>,
		@InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
	) {}

	async create(dto: CreateOneWayFeeDto) {
		if (dto.originCity === dto.destinationCity) {
			throw new BadRequestException('Origin and destination cities must differ')
		}
		const cities = await this.cityModel.countDocuments({
			_id: { $in: [dto.originCity, dto.destinationCity] },
		} as any)
		if (cities !== 2)
			throw new NotFoundException('Origin or destination city not found')
		return this.feeModel
			.findOneAndUpdate(
				{ originCity: dto.originCity, destinationCity: dto.destinationCity },
				{ $set: { fee: dto.fee } },
				{ upsert: true, returnDocument: 'after', runValidators: true },
			)
			.populate(['originCity', 'destinationCity'])
	}

	findAll() {
		return this.feeModel
			.find()
			.populate(['originCity', 'destinationCity'])
			.sort({ createdAt: -1 })
			.lean()
	}
}
