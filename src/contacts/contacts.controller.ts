import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ContactsService } from './contacts.service'
import { CreateContactDto } from './dto/create-contact.dto'

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
	constructor(private readonly contactsService: ContactsService) {}

	@Post()
	@ApiOperation({ summary: 'Submit a contact form message' })
	create(@Body() dto: CreateContactDto) {
		return this.contactsService.create(dto)
	}

	@Get()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get all contact messages (Admin and higher)' })
	findAll() {
		return this.contactsService.findAll()
	}
}
