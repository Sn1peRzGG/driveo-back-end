import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import * as express from 'express'

interface UserPayload {
	_id: string
	email: string
	role: string
}

interface RequestWithUser extends express.Request {
	user?: UserPayload
}

const ROLE_HIERARCHY: Record<string, string[]> = {
	USER: ['USER'],
	ADMIN: ['ADMIN', 'USER'],
	OWNER: ['OWNER', 'ADMIN', 'USER'],
}

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.get<string[]>(
			'roles',
			context.getHandler(),
		)
		if (!requiredRoles) {
			return true
		}

		const request = context.switchToHttp().getRequest<RequestWithUser>()
		const user = request.user
		if (!user) {
			return false
		}

		const userRoles = ROLE_HIERARCHY[user.role] || []

		return requiredRoles.some(role => userRoles.includes(role))
	}
}
