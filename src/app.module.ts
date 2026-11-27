import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { BookingsModule } from './bookings/bookings.module'
import { CategoriesModule } from './categories/categories.module'
import { Category, CategorySchema } from './categories/category.schema'
import { CitiesModule } from './cities/cities.module'
import { City, CitySchema } from './cities/city.schema'
import { DevelopmentSeedService } from './common/seed/development-seed.service'
import { ContactsModule } from './contacts/contacts.module'
import { OneWayFee, OneWayFeeSchema } from './one-way-fees/one-way-fee.schema'
import { OneWayFeesModule } from './one-way-fees/one-way-fees.module'
import { User, UserSchema } from './users/user.schema'
import { UsersModule } from './users/users.module'
import { Vehicle, VehicleSchema } from './vehicles/vehicle.schema'
import { VehiclesModule } from './vehicles/vehicles.module'
import { BrandsModule } from './brands/brands.module'
import { ModelsModule } from './models/models.module'

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
		ContactsModule,
		BrandsModule,
		ModelsModule,
	],
	providers: [DevelopmentSeedService],
})
export class AppModule {}
