import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type OneWayFeeDocument = OneWayFee & Document

@Schema({ timestamps: true, versionKey: false })
export class OneWayFee {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({ type: String, ref: 'City', required: true })
	originCity!: string

	@Prop({ type: String, ref: 'City', required: true })
	destinationCity!: string

	@Prop({ required: true, min: 0 })
	fee!: number
}

export const OneWayFeeSchema = SchemaFactory.createForClass(OneWayFee)
OneWayFeeSchema.index({ originCity: 1, destinationCity: 1 }, { unique: true })
