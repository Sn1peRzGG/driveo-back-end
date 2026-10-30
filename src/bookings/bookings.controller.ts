import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto'

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
	constructor(private readonly bookingsService: BookingsService) {}

	@Post()
	async createBooking(
		@Body() createBookingDto: CreateBookingDto,
		@Req() req: any,
	) {
		const userId = req.user._id
		return this.bookingsService.create(createBookingDto, userId)
	}

	@Get('my')
	async getMyBookings(@Req() req: any) {
		const userId = req.user._id
		return this.bookingsService.getUserBookings(userId)
	}

	@Get()
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async getAllBookings() {
		return this.bookingsService.getAllBookings()
	}

	@Patch(':id/status')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async updateStatus(
		@Param('id') id: string,
		@Body() updateBookingStatusDto: UpdateBookingStatusDto,
	) {
		return this.bookingsService.updateStatus(id, updateBookingStatusDto)
	}

	@Patch(':id/cancel')
	async cancelBooking(@Param('id') id: string, @Req() req: any) {
		const userId = req.user._id
		return this.bookingsService.cancelBooking(id, userId)
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async deleteBooking(@Param('id') id: string) {
		return this.bookingsService.deleteBooking(id)
	}
}
