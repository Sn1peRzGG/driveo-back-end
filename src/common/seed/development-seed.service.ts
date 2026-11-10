import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { Model } from 'mongoose'
import { Category, CategoryDocument } from '../../categories/category.schema'
import { City, CityDocument } from '../../cities/city.schema'
import {
	OneWayFee,
	OneWayFeeDocument,
} from '../../one-way-fees/one-way-fee.schema'
import { User, UserDocument } from '../../users/user.schema'
import {
	FuelType,
	Transmission,
	Vehicle,
	VehicleDocument,
} from '../../vehicles/vehicle.schema'

@Injectable()
export class DevelopmentSeedService implements OnApplicationBootstrap {
	constructor(
		@InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
		@InjectModel(Vehicle.name)
		private readonly vehicleModel: Model<VehicleDocument>,
		@InjectModel(OneWayFee.name)
		private readonly oneWayFeeModel: Model<OneWayFeeDocument>,
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		if (process.env.NODE_ENV !== 'development') return

		const berlin = await this.cityModel.findOneAndUpdate(
			{ name: 'Berlin' },
			{ $setOnInsert: { name: 'Berlin' } },
			{ new: true, upsert: true },
		)
		const kyiv = await this.cityModel.findOneAndUpdate(
			{ name: 'Kyiv' },
			{ $setOnInsert: { name: 'Kyiv' } },
			{ new: true, upsert: true },
		)
		const sedan = await this.categoryModel.findOneAndUpdate(
			{ name: 'Sedan' },
			{
				$setOnInsert: {
					name: 'Sedan',
					imageUrl: '/categories/6bf20a91-79f9-46c2-9fc4-fe307f4a3443.png',
					count: 0,
				},
			},
			{ new: true, upsert: true },
		)

		await this.oneWayFeeModel.findOneAndUpdate(
			{ originCity: berlin._id, destinationCity: kyiv._id },
			{
				$setOnInsert: {
					originCity: berlin._id,
					destinationCity: kyiv._id,
					fee: 75,
				},
			},
			{ upsert: true },
		)

		await this.vehicleModel.findOneAndUpdate(
			{ brand: 'Toyota', model: 'Camry', isDeleted: false } as any,
			{
				$setOnInsert: {
					brand: 'Toyota',
					model: 'Camry',
					description: 'Comfortable sedan for city and highway travel.',
					image: '/vehicles/790bd74b-7ba4-4e19-936a-b9ae66f60713.png',
					category: sedan._id,
					city: berlin._id,
					pricePerDay: 75,
					seats: 5,
					transmission: Transmission.AUTOMATIC,
					fuelType: FuelType.HYBRID,
					doors: 4,
					features: ['Bluetooth', 'Apple CarPlay', 'Parking sensors'],
					type: 'Sedan',
					isAvailable: true,
					isDeleted: false,
				},
			} as any,
			{ upsert: true },
		)

		await this.userModel.findOneAndUpdate(
			{ email: 'owner@driveo.test' },
			{
				$setOnInsert: {
					email: 'owner@driveo.test',
					password: await bcrypt.hash('OwnerPass123', 10),
					firstName: 'Driveo',
					lastName: 'Owner',
					phoneNumber: '+380501234567',
					role: 'OWNER',
				},
			} as any,
			{ upsert: true },
		)
	}
}
