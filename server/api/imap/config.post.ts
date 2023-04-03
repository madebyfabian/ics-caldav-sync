import { zh, z } from 'h3-zod'

const bodyObj = z.object({
	config: z.object({
		mailboxesPaths: z.array(z.string()).nullable(),
	}),
})

export type ImapConfigBody = z.infer<typeof bodyObj>
export type UserConfig = ImapConfigBody['config']

/**
 * Update config cookie
 */
export default defineEventHandler(async event => {
	try {
		const body = await zh.useValidatedBody(event, bodyObj)
		const userConfig = getSafeUserConfigFromCookie({ event })

		const newUserConfig: UserConfig = {
			...userConfig,
			...body.config,
		}

		// Update config cookie
		setCookie(event, cookieNames.imapConfig, JSON.stringify(newUserConfig), {
			...defaultCookieParameters,
		})

		return {
			userConfig: newUserConfig,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
