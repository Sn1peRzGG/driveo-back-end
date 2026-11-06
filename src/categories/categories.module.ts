import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Vehicle, VehicleSchema } from '../vehicles/vehicle.schema'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'
import { Category, CategorySchema } from './category.schema'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Category.name, schema: CategorySchema },
			{ name: Vehicle.name, schema: VehicleSchema },
		]),
	],
	controllers: [CategoriesController],
	providers: [CategoriesService],
})
export class CategoriesModule {}
