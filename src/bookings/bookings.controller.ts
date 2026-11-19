import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto'

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
	constructor(private readonly bookingsService: BookingsService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new vehicle booking' })
	@ApiResponse({ status: 201, description: 'Booking successfully created.' })
	@ApiResponse({
		status: 400,
		description: 'Vehicle is already booked or invalid range.',
	})
	async createBooking(
		@Body() createBookingDto: CreateBookingDto,
		@Req() req: any,
	) {
		return this.bookingsService.create(createBookingDto, req.user._id)
	}

	@Get('quote')
	@ApiOperation({ summary: 'Get booking availability and price quote' })
	@ApiResponse({ status: 200, description: 'Booking quote calculated.' })
	async getBookingQuote(
		@Query('vehicleId') vehicleId: string,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
		@Query('returnCity') returnCity?: string,
	) {
		return this.bookingsService.getBookingQuote({
			vehicleId,
			startDate,
			endDate,
			returnCity,
		})
	}

	@Get('my')
	@ApiOperation({ summary: 'Get current user bookings' })
	@ApiResponse({ status: 200, description: 'Bookings list retrieved.' })
	async getMyBookings(@Req() req: any) {
		return this.bookingsService.getUserBookings(req.user._id)
	}

	@Get()
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@ApiOperation({ summary: 'Get all bookings (Admin or higher)' })
	@ApiResponse({ status: 200, description: 'All bookings retrieved.' })
	async getAllBookings() {
		return this.bookingsService.getAllBookings()
	}

	@Patch(':id/status')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@ApiOperation({ summary: 'Update booking status (Admin or higher)' })
	@ApiResponse({ status: 200, description: 'Status updated.' })
	async updateStatus(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body() updateBookingStatusDto: UpdateBookingStatusDto,
	) {
		return this.bookingsService.updateStatus(id, updateBookingStatusDto)
	}

	@Patch(':id/cancel')
	@ApiOperation({ summary: 'Cancel user booking' })
	@ApiResponse({ status: 200, description: 'Booking successfully cancelled.' })
	async cancelBooking(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Req() req: any,
	) {
		return this.bookingsService.cancelBooking(id, req.user._id)
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@ApiOperation({ summary: 'Delete booking from database (Admin or higher)' })
	@ApiResponse({ status: 200, description: 'Booking deleted.' })
	async deleteBooking(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.bookingsService.deleteBooking(id)
	}
}
