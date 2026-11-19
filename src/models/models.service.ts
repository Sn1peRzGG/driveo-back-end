import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateModelDto } from './dto/create-model.dto'
import { ModelDocument } from './model.schema'

@Injectable()
export class ModelsService {
	constructor(
		@InjectModel(Model.name) private readonly modelModel: Model<ModelDocument>,
	) {}

	async create(dto: CreateModelDto) {
		const model = await this.modelModel.findOne({ name: dto.name.trim() })
		if (model) throw new ConflictException('Model already exists')
		return this.modelModel.create({ name: dto.name.trim() })
	}

	findAll() {
		return this.modelModel.find().sort({ name: 1 }).lean()
	}

	async findOne(id: string) {
		const model = await this.modelModel.findById(id).lean()
		if (!model) throw new NotFoundException('Model not found')
		return model
	}
}
