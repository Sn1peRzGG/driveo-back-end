import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type ModelDocument = Model & Document

@Schema({ timestamps: true, versionKey: false })
export class Model {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({ required: true, unique: true, trim: true })
	name!: string
}

export const ModelSchema = SchemaFactory.createForClass(Model)
