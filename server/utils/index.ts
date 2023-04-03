import aes from 'crypto-js/aes'
import utf8 from 'crypto-js/enc-utf8'
import type { H3Event, setCookie } from 'h3'
import type { User } from '@/server/api/imap/auth.post'
import type { UserConfig } from '@/server/api/imap/config.post'

export const cookieNames = {
	imapData: 'imap-user-data',
	imapConfig: 'imap-user-config',
}

export const defaultCookieParameters: Parameters<typeof setCookie>[3] = {
	httpOnly: true,
	secure: true,
	sameSite: true,
	maxAge: 60 * 60 * 24 * 31, // 31 days
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

	let user: User | null = null
	try {
		if (decryptedUserDataRaw) user = JSON.parse(decryptedUserDataRaw) as User
	} catch (error) {
		console.error(error)
	}

	if (!user)
		throw createError({ statusCode: 401, statusMessage: 'No user set' })

	return user
}

export const getUserConfigFromCookie = ({ event }: { event: H3Event }) => {
	const userConfigCookieRaw = getCookie(event, cookieNames.imapConfig)
	const baseConfig: UserConfig = {
		mailboxesPaths: null,
	}

	if (!userConfigCookieRaw) return baseConfig

	let parsedConfig: UserConfig | null = null
	try {
		parsedConfig = JSON.parse(userConfigCookieRaw) as UserConfig
	} catch (_) {}
	if (!parsedConfig) return baseConfig

	return {
		...baseConfig,
		...parsedConfig,
	}
}
