import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
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

type UserRole = 'USER' | 'ADMIN' | 'FLEET_ADMIN' | 'SYSADMIN' | 'OWNER'

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
	USER: ['USER'],
	ADMIN: ['ADMIN', 'USER'], // Rent manager (cars, reservations, payments)
	FLEET_ADMIN: ['FLEET_ADMIN', 'ADMIN', 'USER'], // Fleet manager (brands, models, categories, cities, fees)
	SYSADMIN: ['SYSADMIN', 'FLEET_ADMIN', 'ADMIN', 'USER'], // System administrator (logs, settings)
	OWNER: ['OWNER', 'SYSADMIN', 'FLEET_ADMIN', 'ADMIN', 'USER'], // Full access
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
