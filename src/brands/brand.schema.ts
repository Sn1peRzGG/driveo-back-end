import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type BrandDocument = Brand & Document

@Schema({ timestamps: true, versionKey: false })
export class Brand {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({ required: true, unique: true, trim: true })
	name!: string
}

export const BrandSchema = SchemaFactory.createForClass(Brand)
