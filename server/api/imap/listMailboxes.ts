import { getUserFromCookie } from '@/server/utils'

/**
 * List all mailboxes
 */
export default defineEventHandler(async event => {
	const user = getUserFromCookie({ event })
	if (!user) throw createError({ statusCode: 401 })

	try {
		const client = imapFlowClient({ user })
		await client.connect()

		let mailboxesTree = await client.listTree()

		// log out and close connection
		await client.logout()

		return {
			mailboxes: mailboxesTree.folders,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
