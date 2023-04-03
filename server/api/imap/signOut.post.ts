import { cookieNames } from '@/server/utils'

export default defineEventHandler(async event => {
	try {
		deleteCookie(event, cookieNames.imapData)
		deleteCookie(event, cookieNames.imapConfig)

		return {
			user: null,
			userConfig: null,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
