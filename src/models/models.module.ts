import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ModelSchema } from './model.schema'
import { ModelsController } from './models.controller'
import { ModelsService } from './models.service'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Model.name, schema: ModelSchema }]),
	],
	controllers: [ModelsController],
	providers: [ModelsService],
})
export class ModelsModule {}
