import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Booking, BookingSchema } from '../bookings/booking.schema'
import { Category, CategorySchema } from '../categories/category.schema'
import { City, CitySchema } from '../cities/city.schema'
import { Vehicle, VehicleSchema } from './vehicle.schema'
import { VehiclesController } from './vehicles.controller'
import { VehiclesService } from './vehicles.service'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: City.name, schema: CitySchema },
			{ name: Category.name, schema: CategorySchema },
			{ name: Booking.name, schema: BookingSchema },
		]),
	],
	controllers: [VehiclesController],
	providers: [VehiclesService],
})
export class VehiclesModule {}
