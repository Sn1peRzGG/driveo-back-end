import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { City, CitySchema } from '../cities/city.schema'
import { Booking, BookingSchema } from '../bookings/booking.schema'
import { VehiclesController } from './vehicles.controller'
import { Vehicle, VehicleSchema } from './vehicle.schema'
import { VehiclesService } from './vehicles.service'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: City.name, schema: CitySchema },
			{ name: Booking.name, schema: BookingSchema },
		]),
	],
	controllers: [VehiclesController],
	providers: [VehiclesService],
})
export class VehiclesModule {}
