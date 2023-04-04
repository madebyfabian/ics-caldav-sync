import ical, { type CalendarComponent } from 'ical'
import type {
	MessageStructureObject,
	FetchMessageObject,
	ImapFlow,
} from 'imapflow'
import {
	getUserFromCookie,
	getSafeUserConfigFromCookie,
	getSafeImapProcessedMessageFromCookie,
} from '@/server/utils'

const getDeepIcsChildNodes = ({
	childNodes,
}: {
	childNodes: MessageStructureObject[]
}) => {
	const nodes: MessageStructureObject[] = []

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

const downloadIcsAttachments = async ({
	messageData,
	client,
}: {
	messageData: MessageResObj
	client: ImapFlow
}) => {
	if (!messageData._icsAttachmentNodes) return null

	const downloadsPromises = messageData._icsAttachmentNodes.map(node =>
		client.download(`${messageData.uid}`, node.part, { uid: true })
	)
	const downloadsRes = await Promise.allSettled(downloadsPromises)

	const attachments: AttachmentResObj[] = []
	for (const downloadRes of downloadsRes) {
		if (downloadRes.status !== 'fulfilled') continue
		const { meta, content } = downloadRes.value
		if (!meta) continue

		// Parse buffer
		let result = ''
		for await (const chunk of content) {
			result += chunk
		}

		// Parse to ical
		const icalData = ical.parseICS(result)
		const calMeta = Object.values(icalData).find(key => key.type === 'VEVENT')

		attachments.push({
			content: result,
			calMeta: calMeta,
		})
	}

	return attachments
}

export type AttachmentResObj = {
	content: string
	calMeta: CalendarComponent | undefined
}

export type MessageResObj = {
	uid: FetchMessageObject['uid']
	envelope: FetchMessageObject['envelope']
	flags: string[]
	attachments: AttachmentResObj[] | null
	mailboxPath: string
	_icsAttachmentNodes?: MessageStructureObject[]
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
			let lock = await client.getMailboxLock(mailboxPath)

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
					if (icsAttachmentNodes.length === 0) continue

					messages.push({
						uid: message.uid,
						envelope: message.envelope,
						flags: [...message.flags],
						mailboxPath,
						attachments: null,
						_icsAttachmentNodes: icsAttachmentNodes,
					})
				}
			} finally {
				// Make sure lock is released, otherwise next `getMailboxLock()` never returns
				lock.release()
			}

			// Download ical
			for (let messageData of messages) {
				try {
					messageData.attachments = await downloadIcsAttachments({
						messageData,
						client,
					})

					delete messageData._icsAttachmentNodes
				} catch (error) {
					console.error(error)
				}
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
