import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { join } from 'path'
import { AppModule } from './app.module'
import { createCustomValidationPipe } from './common/pipes/custom-validation.pipe'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.use(cookieParser())

	app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
	})

	app.useStaticAssets(join(process.cwd(), 'public'), {
		prefix: '/',
	})

	app.setGlobalPrefix('api/v1')

	app.useGlobalPipes(createCustomValidationPipe())

	await app.listen(process.env.PORT ?? 5555)
}

bootstrap()
