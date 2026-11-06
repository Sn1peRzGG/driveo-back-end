import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
	statusCode: number
	success: boolean
	message?: string
	data: T
	timestamp: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
	T,
	Response<T>
> {
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<Response<T>> {
		const ctx = context.switchToHttp()
		const response = ctx.getResponse()
		const statusCode = response.statusCode

		return next.handle().pipe(
			map(data => {
				let message = 'Operation successful'
				let resultData = data

				if (data && typeof data === 'object' && !Array.isArray(data)) {
					if ('message' in data && 'data' in data) {
						message = data.message
						resultData = data.data
					} else if ('message' in data && Object.keys(data).length === 1) {
						message = data.message
						resultData = null
					}
				}

				return {
					statusCode,
					success: true,
					message,
					data: resultData,
					timestamp: new Date().toISOString(),
				}
			}),
		)
	}
}
