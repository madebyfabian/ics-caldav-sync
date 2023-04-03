import aes from 'crypto-js/aes'
import utf8 from 'crypto-js/enc-utf8'
import type { H3Event, setCookie } from 'h3'
import type { User } from '@/server/api/imap/auth.post'
import type { UserConfig } from '@/server/api/imap/config.post'
import type { DavUser } from '@/server/api/dav/auth.post'

export const cookieNames = {
	imapData: 'imap-user-data',
	imapConfig: 'imap-user-config',
	davData: 'dav-user-data',
}

export const defaultCookieParameters: Parameters<typeof setCookie>[3] = {
	httpOnly: true,
	secure: true,
	sameSite: true,
	maxAge: 60 * 60 * 24 * 31, // 31 days
}

const safeParse = <T = unknown>(json: string) => {
	try {
		if (json) return JSON.parse(json) as T
	} catch (error) {
		console.error(error)
		return null
	}

	return null
}

export const getUserFromCookie = ({ event }: { event: H3Event }) => {
	const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
	if (!passwordSalt) {
		throw createError({
			statusCode: 500,
			statusMessage: 'No password salt set',
		})
	}

	// Try to get user data cookie
	const userDataCookieRaw = getCookie(event, cookieNames.imapData)
	if (!userDataCookieRaw)
		throw createError({ statusCode: 401, statusMessage: 'No cookie set' })

	const decryptedUserDataRaw = aes
		.decrypt(userDataCookieRaw, passwordSalt)
		.toString(utf8)
	if (!decryptedUserDataRaw)
		throw createError({
			statusCode: 401,
			statusMessage: 'Failed to decrypt cookie',
		})

	let user = safeParse<User>(decryptedUserDataRaw)
	if (!user)
		throw createError({ statusCode: 401, statusMessage: 'No user set' })

	return user
}

export const getSafeUserConfigFromCookie = ({ event }: { event: H3Event }) => {
	const userConfigCookieRaw = getCookie(event, cookieNames.imapConfig)
	const baseConfig: UserConfig = {
		mailboxesPaths: null,
	}

	if (!userConfigCookieRaw) return baseConfig

	let parsedConfig = safeParse<UserConfig>(userConfigCookieRaw)

	return {
		...baseConfig,
		...parsedConfig,
	}
}
export const getSafeDavUserFromCookie = ({ event }: { event: H3Event }) => {
	try {
		const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
		if (!passwordSalt) {
			throw createError({
				statusCode: 500,
				statusMessage: 'No password salt set',
			})
		}

		// Try to get user data cookie
		const davUserDataCookieRaw = getCookie(event, cookieNames.davData)
		if (!davUserDataCookieRaw)
			throw createError({ statusCode: 401, statusMessage: 'No cookie set' })

		const decryptedUserDataRaw = aes
			.decrypt(davUserDataCookieRaw, passwordSalt)
			.toString(utf8)
		if (!decryptedUserDataRaw)
			throw createError({
				statusCode: 401,
				statusMessage: 'Failed to decrypt cookie',
			})

		let davUser = safeParse<DavUser>(decryptedUserDataRaw)
		if (!davUser)
			throw createError({ statusCode: 401, statusMessage: 'No davUser set' })

		return davUser
	} catch (error) {
		console.error(error)
		return null
	}
}
