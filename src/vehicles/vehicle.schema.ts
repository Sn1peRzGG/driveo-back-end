import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type VehicleDocument = Vehicle & Document

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
		default: '',
	})
	description!: string

	@Prop({
		required: true,
	})
	image!: string

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
		required: true,
		trim: true,
	})
	city!: string

	@Prop({
		type: String,
		trim: true,
		default: 'car',
	})
	type!: string

	@Prop({ type: Boolean })
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
