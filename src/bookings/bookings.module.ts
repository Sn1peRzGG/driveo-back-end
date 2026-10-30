import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Vehicle, VehicleSchema } from '../vehicles/vehicle.schema'
import { User, UserSchema } from '../users/user.schema'
import { Booking, BookingSchema } from './booking.schema'
import { BookingsController } from './bookings.controller'
import { BookingsService } from './bookings.service'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Booking.name, schema: BookingSchema },
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: User.name, schema: UserSchema },
		]),
	],
	controllers: [BookingsController],
	providers: [BookingsService],
})
export class BookingsModule {}
