import { zh, z } from 'h3-zod'
import aes from 'crypto-js/aes.js'
import { davClient } from '@/server/utils/dav'

const bodyObj = z.object({
	dav: z.object({
		serverUrl: z.string(),
		username: z.string(),
		password: z.string(),
	}),
})

export type DavAuthBody = z.infer<typeof bodyObj>
export type DavUser = DavAuthBody['dav']

export default defineEventHandler(async event => {
	try {
		const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
		if (!passwordSalt) {
			throw new Error('No password salt set')
		}

		const body = await zh.useValidatedBody(event, bodyObj)

		// Check DAV connection
		const dav = await davClient({ davUser: body.dav })
		if (!dav) throw new Error('Failed to connect to DAV server')

		// Encrypt user data
		const encryptedUser = aes
			.encrypt(JSON.stringify(body.dav), passwordSalt)
			.toString()

		// Set cookie
		setCookie(event, cookieNames.davData, encryptedUser, {
			...defaultCookieParameters,
		})

		return {
			dav: body.dav,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
