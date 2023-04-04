import type { H3Event } from 'h3'
import { ImapFlow } from 'imapflow'
import ical from 'ical'
import type { User } from '@/server/api/imap/auth.post'
import type { MessageResObj, AttachmentResObj } from '@/server/utils/index'

export const imapFlowClient = ({ user }: { user: User }) => {
	return new ImapFlow({
		// User config
		auth: {
			user: user.username,
			pass: user.password,
		},
		host: user.host,
		port: user.port,
		secure: user.secure ?? true,

		// Client config
		logger: {
			debug: () => {},
			info: () => {},
			warn: () => {},
			error: () => {},
		},
		disableAutoIdle: true,
	})
}

export const safeDownloadIcsAttachments = async ({
	messageData,
	event,
}: {
	messageData: {
		attachmentChildNodes: {
			part: string
		}[]
		mailboxPath: MessageResObj['mailboxPath']
		uid: MessageResObj['uid']
	}
	event: H3Event
}) => {
	try {
		// Setup IMAP connection
		const user = getUserFromCookie({ event })
		const client = imapFlowClient({ user })
		await client.connect()
		await client.mailboxOpen(messageData.mailboxPath)

		if (!messageData.attachmentChildNodes) return null

		const downloadsPromises = messageData.attachmentChildNodes.map(node =>
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
			if (!calMeta) {
				console.error('cal meta parsing failed', { meta })
				continue
			}

			attachments.push({
				content: result,
				calMeta: calMeta,
			})
		}

		await client.mailboxClose()
		await client.logout()

		return attachments
	} catch (error) {
		console.error(error)
		return null
	}
}
