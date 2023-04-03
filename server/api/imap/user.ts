/**
 * This endpoint is used to retrieve the stored user data from the cookie.
 */
export default defineEventHandler(async event => {
	const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
	if (!passwordSalt) {
		throw createError({ statusCode: 500, message: 'No password salt set' })
	}

	const user = getUserFromCookie({ event })
	const userConfig = getSafeUserConfigFromCookie({ event })
	const davUser = getSafeDavUserFromCookie({ event })

	return {
		user,
		userConfig,
		davUser,
	}
})
