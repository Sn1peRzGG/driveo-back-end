import { BadRequestException } from '@nestjs/common'
import { memoryStorage } from 'multer'

export const multerImageOptions = {
	storage: memoryStorage(),
	limits: {
		fileSize: 4 * 1024 * 1024,
	},
	fileFilter: (req: any, file: any, cb: any) => {
		const allowed = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowed.includes(file.mimetype)) {
			return cb(
				new BadRequestException('Only JPG, PNG and WEBP images are allowed'),
				false,
			)
		}
		cb(null, true)
	},
}
