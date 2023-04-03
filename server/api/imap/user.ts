import { getUserFromCookie, getUserConfigFromCookie } from '@/server/utils'

/**
 * This endpoint is used to retrieve the stored user data from the cookie.
 */
export default defineEventHandler(async event => {
	const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
	if (!passwordSalt) {
		throw createError({ statusCode: 500, message: 'No password salt set' })
	}

	// Try to get user data cookie
	const user = getUserFromCookie({ event })

	// Try to get user config
	const userConfig = getUserConfigFromCookie({ event })

	return {
		user,
		userConfig,
	}
})
