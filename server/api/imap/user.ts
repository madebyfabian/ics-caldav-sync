/**
 * This endpoint is used to retrieve the stored user data from the cookie.
 */
export default defineEventHandler(async event => {
	const user = getUserFromCookie({ event })
	const userConfig = getSafeUserConfigFromCookie({ event })
	const davUser = getSafeDavUserFromCookie({ event })

	return {
		user,
		userConfig,
		davUser,
	}
})
