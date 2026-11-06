import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CitiesController } from './cities.controller'
import { CitiesService } from './cities.service'
import { City, CitySchema } from './city.schema'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: City.name, schema: CitySchema }]),
	],
	controllers: [CitiesController],
	providers: [CitiesService],
})
export class CitiesModule {}
