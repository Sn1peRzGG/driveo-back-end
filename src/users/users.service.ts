import {
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { Model } from 'mongoose'
import { extname, join } from 'path'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User, UserDocument } from './user.schema'

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'users')

	private async saveFile(file: Express.Multer.File) {
		if (!existsSync(this.uploadPath))
			mkdirSync(this.uploadPath, { recursive: true })
		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/users/${filename}`
	}

	private async deleteFile(path: string) {
		try {
			await fs.unlink(join(process.cwd(), 'public', path.replace(/^\/+/, '')))
		} catch {}
	}

	private sanitizeUser(user: any) {
		const { password: _password, ...safeUser } =
			user instanceof Model ? user.toObject() : user
		return safeUser
	}

	async create(dto: CreateUserDto, file?: Express.Multer.File) {
		const emailExists = await this.userModel.findOne({
			email: dto.email.toLowerCase(),
		})
		if (emailExists) throw new ConflictException('Email already exists')

		const phoneExists = await this.userModel.findOne({
			phoneNumber: dto.phoneNumber,
		})
		if (phoneExists) throw new ConflictException('Phone number already exists')

		let avatarUrl = ''
		try {
			const hashedPassword = await bcrypt.hash(dto.password, 10)
			if (file) avatarUrl = await this.saveFile(file)

			const user = await this.userModel.create({
				...dto,
				email: dto.email.toLowerCase(),
				password: hashedPassword,
				avatarUrl: avatarUrl || undefined,
			})
			return this.sanitizeUser(user)
		} catch {
			if (avatarUrl) await this.deleteFile(avatarUrl)
			throw new InternalServerErrorException('Failed to create user')
		}
	}

	async findAll() {
		const users = await this.userModel
			.find()
			.populate({ path: 'savedVehicles', match: { isDeleted: false } })
			.lean()

		return users.map(u => {
			if (u.savedVehicles) {
				u.savedVehicles = u.savedVehicles.filter(item => item !== null)
			}
			return this.sanitizeUser(u)
		})
	}

	async findOne(id: string) {
		const user = await this.userModel
			.findById(id)
			.populate({
				path: 'savedVehicles',
				match: { isDeleted: false },
			})
			.lean()

		if (!user) throw new NotFoundException('User not found')

		if (user.savedVehicles) {
			user.savedVehicles = user.savedVehicles.filter(item => item !== null)
		}

		return this.sanitizeUser(user)
	}

	async findByEmail(email: string) {
		return this.userModel
			.findOne({ email: email.toLowerCase() })
			.select('+password')
	}

	async update(
		id: string,
		dto: UpdateUserDto,
		currentUserRole: string,
		file?: Express.Multer.File,
	) {
		const current = await this.userModel.findById(id)
		if (!current) throw new NotFoundException('User not found')

		if (current.role === 'OWNER' && currentUserRole !== 'OWNER') {
			throw new ForbiddenException('You cannot modify the Owner account')
		}

		const updateData: any = { ...dto }
		if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10)
		if (dto.email) updateData.email = dto.email.toLowerCase()

		let avatarUrl = current.avatarUrl
		try {
			if (file) {
				avatarUrl = await this.saveFile(file)
				if (current.avatarUrl) await this.deleteFile(current.avatarUrl)
			}
			const updated = await this.userModel
				.findByIdAndUpdate(
					id,
					{ ...updateData, avatarUrl },
					{ returnDocument: 'after' },
				)
				.lean()
			return this.sanitizeUser(updated)
		} catch {
			if (file && avatarUrl !== current.avatarUrl)
				await this.deleteFile(avatarUrl)
			throw new InternalServerErrorException('Update failed')
		}
	}

	async remove(id: string) {
		const user = await this.userModel.findByIdAndDelete(id)
		if (!user) throw new NotFoundException('User not found')
		if (user.avatarUrl) await this.deleteFile(user.avatarUrl)
		return { success: true }
	}

	async removeMe(id: string, currentUserRole: string) {
		const user = await this.userModel.findById(id)
		if (!user) throw new NotFoundException('User not found')

		if (user.role === 'OWNER' && currentUserRole !== 'OWNER') {
			throw new ForbiddenException('You cannot delete the Owner account')
		}

		await this.userModel.findByIdAndDelete(id)

		if (user.avatarUrl) {
			await this.deleteFile(user.avatarUrl)
		}

		return { success: true }
	}

	async toggleSavedVehicle(id: string, vehicleId: string) {
		const user = await this.userModel.findById(id)
		if (!user) throw new NotFoundException('User not found')

		const exists = user.savedVehicles.includes(vehicleId)
		const update = exists
			? { $pull: { savedVehicles: vehicleId } }
			: { $addToSet: { savedVehicles: vehicleId } }

		const updated = await this.userModel
			.findByIdAndUpdate(id, update, { returnDocument: 'after' })
			.select('savedVehicles')
			.populate('savedVehicles')
			.lean()

		return updated?.savedVehicles || []
	}
}
