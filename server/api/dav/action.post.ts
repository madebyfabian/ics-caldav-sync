import { zh, z } from 'h3-zod'
import {
	getSafeDavUserFromCookie,
	upsertSafeImapProcessedMessages,
} from '@/server/utils'
import { davClient, transformUidToFileName } from '@/server/utils/dav'
import { safeDownloadIcsAttachments } from '~~/server/utils/imapFlow'

const bodyObj = z.object({
	imapMessage: z.object({
		mailboxPath: z.string(),
		uid: z.number(),
		attachmentChildNodes: z.array(
			z.object({
				part: z.string(),
			})
		),
	}),
})

export type DavActionBody = z.infer<typeof bodyObj>

export default defineEventHandler(async event => {
	let executedAction: 'created' | 'updated' | 'deleted' | null = null

	try {
		const body = await zh.useValidatedBody(event, bodyObj)

		const davUser = getSafeDavUserFromCookie({ event })
		if (!davUser) throw new Error('No DAV user found')

		// Check DAV connection
		const dav = await davClient({ davUser })
		if (!dav) throw new Error('Failed to connect to DAV server')

		// Add event
		const calendars = await dav.fetchCalendars()
		if (!calendars?.length) throw new Error('No calendars found')

		const calendar = calendars?.[0]

		const attachments = await safeDownloadIcsAttachments({
			messageData: {
				uid: body.imapMessage.uid,
				mailboxPath: body.imapMessage.mailboxPath,
				attachmentChildNodes: body.imapMessage.attachmentChildNodes,
			},
			event,
		})
		const attachment = attachments?.[0]
		if (!attachment) throw new Error('No attachment found')

		const uid = attachment.calMeta.uid
		if (!uid) throw new Error('No UID found')

		const fileName = transformUidToFileName({ uid })

		// Fetch all calendar objects + find the one we want to update/delete
		const calendarObjects = await dav.fetchCalendarObjects({
			calendar,
		})
		const calendarObject = calendarObjects.find(obj =>
			obj.url.endsWith(fileName)
		)

		// Now check whether we want to create, update or delete the event.
		// If the event is cancelled, we delete it.
		switch (attachment.calMeta.status) {
			case 'CANCELLED': {
				// Delete event
				try {
					if (!calendarObject) throw new Error(`Calendar object not found`)
					const res = await dav.deleteCalendarObject({
						calendarObject: {
							url: calendarObject.url,
							etag: calendarObject.etag,
						},
					})
					const deletedCalendarObject = await res.json()
					if (deletedCalendarObject) {
						executedAction = 'deleted'
					}
				} catch (error) {
					console.error(`Failed to delete calendar object`, {
						uid: attachment.calMeta,
					})
				} finally {
					break
				}
			}

			case 'CONFIRMED':
			case 'TENTATIVE': {
				if (calendarObject) {
					// Update if existing
					try {
						const res = await dav.updateCalendarObject({
							calendarObject: {
								url: calendarObject.url,
								etag: calendarObject.etag,
								data: attachment.content,
							},
						})
						const updatedCalendarObject = await res.json()
						if (updatedCalendarObject) {
							executedAction = 'updated'
							break
						}
					} catch (error) {
						console.error(`Failed to update calendar object`, {
							uid: attachment.calMeta,
						})
					}
				} else {
					// Create if not existing
					try {
						const res = await dav.createCalendarObject({
							calendar,
							iCalString: attachment.content,
							filename: fileName,
						})

						const createdCalendarObject = await res.json()

						if (createdCalendarObject) {
							executedAction = 'created'
							break
						}
					} catch (error) {
						console.error(`Failed to create calendar object`, {
							uid: attachment.calMeta,
						})
					}
				}

				break
			}
		}

		// Finally, if we managed to create/update/delete the event, we internally mark the message as processed.
		if (executedAction) {
			upsertSafeImapProcessedMessages({
				event,
				mailboxPath: body.imapMessage.mailboxPath,
				messageUid: body.imapMessage.uid,
			})
		}

		return {
			executedAction,
		}
	} catch (error) {
		console.error(error)
		throw createError({ statusCode: 500, message: 'Error' })
	}
})
