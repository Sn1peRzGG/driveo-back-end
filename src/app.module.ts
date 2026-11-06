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
		AuthModule,
		UsersModule,
		CategoriesModule,
		CitiesModule,
		OneWayFeesModule,
		VehiclesModule,
		BookingsModule,
	],
})
export class AppModule {}
