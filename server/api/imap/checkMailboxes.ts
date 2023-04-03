import ical, { type CalendarComponent } from 'ical'
import type { MessageStructureObject, MessageEnvelopeObject } from 'imapflow'

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

type AttachmentResObj = {
	content: string
	calMeta: CalendarComponent | undefined
}

/**
 * List all mailboxes
 */
export default defineEventHandler(async event => {
	const user = getUserFromCookie({ event })
	const userConfig = getSafeUserConfigFromCookie({ event })
	if (!user || !userConfig) throw createError({ statusCode: 401 })

	try {
		const client = imapFlowClient({ user })
		await client.connect()

		let messages: {
			uid: string
			envelope: MessageEnvelopeObject
			_icsAttachmentNodes?: MessageStructureObject[]
			attachments: AttachmentResObj[] | null
		}[] = []

		for (const mailboxPath of userConfig.mailboxesPaths || []) {
			let lock = await client.getMailboxLock(mailboxPath)

			try {
				for await (let message of client.fetch('1:*', {
					envelope: true,
					bodyStructure: true,
				})) {
					const icsAttachmentNodes = getDeepIcsChildNodes({
						childNodes: message.bodyStructure.childNodes,
					})
					if (icsAttachmentNodes.length === 0) continue

					messages.push({
						uid: `${message.uid}`,
						envelope: message.envelope,
						_icsAttachmentNodes: icsAttachmentNodes,
						attachments: null,
					})
				}
			} finally {
				// Make sure lock is released, otherwise next `getMailboxLock()` never returns
				lock.release()
			}

			// Download ical
			for (let messageData of messages) {
				try {
					if (!messageData._icsAttachmentNodes) continue

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
						const calMeta = Object.values(icalData).find(
							key => key.type === 'VEVENT'
						)

						attachments.push({
							content: result,
							calMeta: calMeta,
						})
					}

					messageData.attachments = attachments
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
