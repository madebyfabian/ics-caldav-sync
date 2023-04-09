import type { MessageStructureObject } from 'imapflow'
import {
	getUserFromCookie,
	getSafeUserConfigFromCookie,
	getSafeImapProcessedMessageFromCookie,
	type MessageResObj,
} from '@/server/utils'

const getDeepIcsChildNodes = ({
	childNodes,
}: {
	childNodes: MessageStructureObject[] | undefined
}) => {
	const nodes: MessageStructureObject[] = []
	if (!childNodes?.length) return nodes

	const foundNode = childNodes.find(node =>
		['text/calendar', 'application/ics'].includes(node.type)
	)
	if (!foundNode) return nodes
	nodes.push(foundNode)

	for (const childNode of childNodes) {
		if (childNode.childNodes?.length > 0) {
			nodes.push(...getDeepIcsChildNodes({ childNodes: childNode.childNodes }))
		}
	}

	return nodes
}

/**
 * - Fetch mailbox & all messages in mailbox
 * - Filter out messages that don't have an ICS attachment
 * - Download & Parse ICS attachment
 */
export default defineEventHandler(async event => {
	const user = getUserFromCookie({ event })
	const userConfig = getSafeUserConfigFromCookie({ event })
	if (!user || !userConfig) throw createError({ statusCode: 401 })

	try {
		const client = imapFlowClient({ user })
		await client.connect()

		let messages: MessageResObj[] = []

		for (const mailboxPath of userConfig.mailboxesPaths || []) {
			let mailboxLock = await client.getMailboxLock(mailboxPath)

			try {
				// Fetch and collect messages
				for await (let message of client.fetch('1:*', {
					envelope: true,
					bodyStructure: true,
					flags: true,
				})) {
					// Skip if already processed
					const alreadyProcessedMessage = getSafeImapProcessedMessageFromCookie(
						{
							event,
							mailboxPath,
							messageUid: message.uid,
						}
					)
					if (alreadyProcessedMessage) continue

					// Skip if no ics attachment
					const icsAttachmentNodes = getDeepIcsChildNodes({
						childNodes: message.bodyStructure.childNodes,
					})
					if (!icsAttachmentNodes.length) continue

					messages.push({
						uid: message.uid,
						envelope: message.envelope,
						flags: [...message.flags],
						mailboxPath,
						attachmentChildNodes: icsAttachmentNodes,
					})
				}
			} finally {
				// Make sure lock is released, otherwise next `getMailboxLock()` never returns
				mailboxLock.release()
			}

			// log out and close connection
			await client.logout()
		}

		return {
			messages,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
