import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type BookingDocument = Booking & Document

export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	ACTIVE = 'ACTIVE',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Booking {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		type: String,
		ref: 'User',
		required: true,
	})
	user!: string

	@Prop({
		type: String,
		ref: 'Vehicle',
		required: true,
	})
	vehicle!: string

	@Prop({ required: true, type: Date })
	startDate!: Date

	@Prop({ required: true, type: Date })
	endDate!: Date

	@Prop({
		type: String,
		ref: 'Location',
		required: true,
	})
	pickupLocation!: string

	@Prop({
		type: String,
		ref: 'Location',
		required: true,
	})
	returnLocation!: string

	@Prop({
		required: true,
		min: 0,
	})
	totalPrice!: number

	@Prop({
		type: String,
		enum: Object.values(BookingStatus),
		default: BookingStatus.PENDING,
	})
	status!: BookingStatus

	@Prop({ required: true })
	phoneNumber!: string
}

export const BookingSchema = SchemaFactory.createForClass(Booking)
