import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type ContactDocument = Contact & Document

@Schema({ timestamps: true, versionKey: false })
export class Contact {
	@Prop({ type: String, default: () => randomUUID() })
	_id!: string

	@Prop({ required: true, trim: true })
	name!: string

	@Prop({ required: true, trim: true, lowercase: true })
	email!: string

	@Prop({ required: true, trim: true })
	subject!: string

	@Prop({ required: true, trim: true })
	message!: string
}

export const ContactSchema = SchemaFactory.createForClass(Contact)
