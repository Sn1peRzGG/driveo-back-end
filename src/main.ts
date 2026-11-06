import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { join } from 'path'
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { createCustomValidationPipe } from './common/pipes/custom-validation.pipe'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.use(cookieParser())

	app.enableCors({
		origin:
			process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) ??
			'http://localhost:3000',
		credentials: true,
	})

	app.useStaticAssets(join(process.cwd(), 'public'), {
		prefix: '/',
	})

	app.setGlobalPrefix('api/v1')

	app.useGlobalPipes(createCustomValidationPipe())
	app.useGlobalInterceptors(new TransformInterceptor())

	const swaggerConfig = new DocumentBuilder()
		.setTitle('Driveo API')
		.setDescription('API documentation for Driveo application')
		.setVersion('1.0')
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
		.addCookieAuth('jwt')
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('api/v1/docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	})

	await app.listen(process.env.PORT ?? 5555)
}

bootstrap()
