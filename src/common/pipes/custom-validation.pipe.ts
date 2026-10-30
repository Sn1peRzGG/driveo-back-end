import {
	BadRequestException,
	ValidationPipe,
	ValidationError,
} from '@nestjs/common'

export const createCustomValidationPipe = () => {
	return new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
		stopAtFirstError: false,
		transformOptions: {
			enableImplicitConversion: false,
		},
		exceptionFactory: (errors: ValidationError[]) => {
			const formattedErrors: Record<string, string[]> = {}

			const parseErrors = (errorsList: ValidationError[], parent?: string) => {
				for (const error of errorsList) {
					const property = parent
						? `${parent}.${error.property}`
						: error.property

					if (error.constraints) {
						formattedErrors[property] = Object.values(error.constraints)
					}

					if (error.children && error.children.length > 0) {
						parseErrors(error.children, property)
					}
				}
			}

			parseErrors(errors)

			return new BadRequestException({
				message: 'Validation failed',
				errors: formattedErrors,
			})
		},
	})
}
