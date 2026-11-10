import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { BookingsModule } from './bookings/bookings.module'
import { CategoriesModule } from './categories/categories.module'
import { CitiesModule } from './cities/cities.module'
import { OneWayFeesModule } from './one-way-fees/one-way-fees.module'
import { UsersModule } from './users/users.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { DevelopmentSeedService } from './common/seed/development-seed.service'
import { City, CitySchema } from './cities/city.schema'
import { Category, CategorySchema } from './categories/category.schema'
import { Vehicle, VehicleSchema } from './vehicles/vehicle.schema'
import { OneWayFee, OneWayFeeSchema } from './one-way-fees/one-way-fee.schema'
import { User, UserSchema } from './users/user.schema'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.getOrThrow<string>('DATABASE_URL'),
			}),
		}),
		MongooseModule.forFeature([
			{ name: City.name, schema: CitySchema },
			{ name: Category.name, schema: CategorySchema },
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: OneWayFee.name, schema: OneWayFeeSchema },
			{ name: User.name, schema: UserSchema },
		]),
		AuthModule,
		UsersModule,
		CategoriesModule,
		CitiesModule,
		OneWayFeesModule,
		VehiclesModule,
		BookingsModule,
	],
	providers: [DevelopmentSeedService],
})
export class AppModule {}
