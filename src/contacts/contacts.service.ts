import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Contact, ContactDocument } from './contact.schema'
import { CreateContactDto } from './dto/create-contact.dto'

@Injectable()
export class ContactsService {
	constructor(
		@InjectModel(Contact.name)
		private readonly contactModel: Model<ContactDocument>,
	) {}

	async create(dto: CreateContactDto) {
		return this.contactModel.create({
			name: dto.name.trim(),
			email: dto.email.trim().toLowerCase(),
			subject: dto.subject.trim(),
			message: dto.message.trim(),
		})
	}

	findAll() {
		return this.contactModel.find().sort({ createdAt: -1 }).lean()
	}
}
