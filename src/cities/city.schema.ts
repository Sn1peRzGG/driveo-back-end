import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type CityDocument = City & Document

@Schema({ timestamps: true, versionKey: false })
export class City {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({ required: true, unique: true, trim: true })
	name!: string
}

export const CitySchema = SchemaFactory.createForClass(City)
