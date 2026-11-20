import { CookieOptions } from 'express'

export const jwtCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	path: '/',
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export const jwtCookieClearOptions: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	path: '/',
}
