import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type VehicleDocument = Vehicle & Document

export enum Transmission {
	AUTOMATIC = 'AUTOMATIC',
	MANUAL = 'MANUAL',
}

export enum FuelType {
	PETROL = 'PETROL',
	DIESEL = 'DIESEL',
	HYBRID = 'HYBRID',
	ELECTRIC = 'ELECTRIC',
}

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Vehicle {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		required: true,
		trim: true,
	})
	brand!: string

	@Prop({
		required: true,
		trim: true,
	})
	model!: string

	@Prop({
		required: true,
		trim: true,
	})
	year!: number

	@Prop({
		default: '',
	})
	description!: string

	@Prop({
		type: [String],
		required: true,
		default: [],
	})
	images!: string[]

	@Prop({
		type: String,
		ref: 'Category',
		required: true,
	})
	category!: string

	@Prop({
		required: true,
		min: 0,
	})
	pricePerDay!: number

	@Prop({
		required: true,
		min: 1,
	})
	seats!: number

	@Prop({
		enum: Object.values(Transmission),
		default: Transmission.AUTOMATIC,
	})
	transmission!: Transmission

	@Prop({
		type: String,
		enum: Object.values(FuelType),
		default: FuelType.PETROL,
	})
	fuelType!: FuelType

	@Prop({ min: 2, max: 8, default: 4 })
	doors!: number

	@Prop({ type: [String], default: [] })
	features!: string[]

	@Prop({
		type: String,
		ref: 'City',
		required: true,
	})
	city!: string

	@Prop({
		type: String,
		trim: true,
		default: 'car',
	})
	type!: string

	@Prop({ type: Boolean, default: true })
	isAvailable!: boolean

	@Prop({ type: Boolean, default: false })
	isDeleted!: boolean
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle)

async function updateCategoryCount(model: any, categoryId: string) {
	if (!categoryId) return

	const count = await model.countDocuments({
		category: categoryId,
		isDeleted: false,
	})

	await model.db.model('Category').findByIdAndUpdate(categoryId, { count })
}

VehicleSchema.post('save', async function (doc) {
	const model = doc.$model('Vehicle')
	await updateCategoryCount(model, doc.category)
})

VehicleSchema.pre('findOneAndUpdate', async function (this: any) {
	this._updateDocBeforeUpdate = await this.model.findOne(this.getQuery()).lean()
})

VehicleSchema.post('findOneAndUpdate', async function (this: any, doc) {
	if (doc) {
		const model = doc.$model('Vehicle')

		await updateCategoryCount(model, doc.category)

		const oldCategory = this._updateDocBeforeUpdate?.category
		if (oldCategory && oldCategory !== doc.category) {
			await updateCategoryCount(model, oldCategory)
		}
	}
})
