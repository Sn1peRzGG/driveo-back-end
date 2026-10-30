import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { VehiclesController } from './vehicles.controller'
import { Vehicle, VehicleSchema } from './vehicle.schema'
import { VehiclesService } from './vehicles.service'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
	],
	controllers: [VehiclesController],
	providers: [VehiclesService],
})
export class VehiclesModule {}
