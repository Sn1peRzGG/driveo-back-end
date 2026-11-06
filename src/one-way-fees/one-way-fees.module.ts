import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { City, CitySchema } from '../cities/city.schema'
import { OneWayFeesController } from './one-way-fees.controller'
import { OneWayFeesService } from './one-way-fees.service'
import { OneWayFee, OneWayFeeSchema } from './one-way-fee.schema'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: OneWayFee.name, schema: OneWayFeeSchema },
			{ name: City.name, schema: CitySchema },
		]),
	],
	controllers: [OneWayFeesController],
	providers: [OneWayFeesService],
})
export class OneWayFeesModule {}
