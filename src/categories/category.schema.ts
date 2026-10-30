import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type CategoryDocument = Category & Document

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Category {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({
		required: true,
		trim: true,
	})
	name!: string

	@Prop({
		required: true,
	})
	imageUrl!: string

	@Prop({
		default: 0,
		min: 0,
	})
	count!: number
}

export const CategorySchema = SchemaFactory.createForClass(Category)
