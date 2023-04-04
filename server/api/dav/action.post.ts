import { zh, z } from 'h3-zod'
import {
	getSafeDavUserFromCookie,
	upsertSafeImapProcessedMessages,
} from '@/server/utils'
import { davClient, transformUidToFileName } from '@/server/utils/dav'

const bodyObj = z.object({
	imapMessage: z.object({
		mailboxPath: z.string(),
		uid: z.number(),
	}),
	icsAttachment: z.object({
		content: z.string(),
		calMeta: z.object({
			uid: z.string(),
			status: z.string(),
		}),
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

		const uid = body.icsAttachment.calMeta.uid
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
		switch (body.icsAttachment.calMeta.status) {
			case 'CANCELLED': {
				// Delete event
				try {
					if (!calendarObject) throw new Error(`Calendar object not found`)
					const deletedCalendarObject = await dav.deleteCalendarObject({
						calendarObject: {
							url: calendarObject.url,
							etag: calendarObject.etag,
						},
					})
					if (deletedCalendarObject) {
						executedAction = 'deleted'
					}
				} catch (error) {
					console.error(`Failed to delete calendar object`, {
						uid: body.icsAttachment.calMeta.uid,
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
						const updatedCalendarObject = await dav.updateCalendarObject({
							calendarObject: {
								url: calendarObject.url,
								etag: calendarObject.etag,
								data: body.icsAttachment.content,
							},
						})
						if (updatedCalendarObject) {
							executedAction = 'updated'
							break
						}
					} catch (error) {
						console.error(`Failed to update calendar object`, {
							uid: body.icsAttachment.calMeta.uid,
						})
					}
				} else {
					// Create if not existing
					try {
						const createdCalendarObject = await dav.createCalendarObject({
							calendar,
							iCalString: body.icsAttachment.content,
							filename: fileName,
						})
						if (createdCalendarObject) {
							executedAction = 'created'
							break
						}
					} catch (error) {
						console.error(`Failed to create calendar object`, {
							uid: body.icsAttachment.calMeta.uid,
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
