import { zh, z } from 'h3-zod'
import aes from 'crypto-js/aes.js'
import { cookieNames, defaultCookieParameters } from '@/server/utils'

const bodyObj = z.object({
	user: z.object({
		host: z.string(),
		port: z.number(),
		secure: z.boolean().optional().default(true),
		username: z.string(),
		password: z.string(),
	}),
})

export type ImapAuthBody = z.infer<typeof bodyObj>
export type User = ImapAuthBody['user']

export default defineEventHandler(async event => {
	try {
		const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
		if (!passwordSalt) {
			throw new Error('No password salt set')
		}

		const body = await zh.useValidatedBody(event, bodyObj)

		// Check IMAP connection
		const client = imapFlowClient({ user: body.user })
		await client.connect()
		await client.logout()

		// Encrypt user data
		const encryptedUser = aes
			.encrypt(JSON.stringify(body.user), passwordSalt)
			.toString()

		// Set cookie
		setCookie(event, cookieNames.imapData, encryptedUser, {
			...defaultCookieParameters,
		})

		return {
			user: body.user,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
