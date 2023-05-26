import aes from 'crypto-js/aes.js'
import utf8 from 'crypto-js/enc-utf8.js'
import type { FetchMessageObject, MessageStructureObject } from 'imapflow'
import type { CalendarComponent } from 'ical'
import { H3Event, setCookie } from 'h3'
import type { User } from '@/server/api/imap/auth.post'
import type { UserConfig } from '@/server/api/imap/config.post'
import type { DavUser } from '@/server/api/dav/auth.post'

export type AttachmentResObj = {
	content: string
	calMeta: CalendarComponent
}

export type MessageResObj = {
	uid: FetchMessageObject['uid']
	envelope: FetchMessageObject['envelope']
	flags: string[]
	mailboxPath: string
	attachmentChildNodes: MessageStructureObject[]
}

export const cookieNames = {
	imapData: 'imap-user-data',
	imapConfig: 'imap-user-config',
	imapProcessedMessages: 'imap-processed-messages',
	davData: 'dav-user-data',
}

export const defaultCookieParameters: Parameters<typeof setCookie>[3] = {
	httpOnly: true,
	secure: true,
	sameSite: true,
	maxAge: 60 * 60 * 24 * 365, // 1 year
}

const safeParse = <T = unknown>(json: string) => {
	try {
		if (json) return JSON.parse(json) as T
	} catch (error) {
		console.error(error)
		return null
	}

	return null
}

export const getUserFromCookie = ({ event }: { event: H3Event }) => {
	const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
	if (!passwordSalt) {
		throw createError({
			statusCode: 500,
			statusMessage: 'No password salt set',
		})
	}

	// Try to get user data cookie
	const cookieName = cookieNames.imapData
	const userDataCookieRaw = getCookie(event, cookieName)
	if (!userDataCookieRaw)
		throw createError({ statusCode: 401, statusMessage: 'No cookie set' })

	const decryptedUserDataRaw = aes
		.decrypt(userDataCookieRaw, passwordSalt)
		.toString(utf8)
	if (!decryptedUserDataRaw)
		throw createError({
			statusCode: 401,
			statusMessage: `Failed to decrypt cookie "${cookieName}"`,
		})

	let user = safeParse<User>(decryptedUserDataRaw)
	if (!user)
		throw createError({ statusCode: 401, statusMessage: 'No user set' })

	return user
}

export const getSafeUserConfigFromCookie = ({ event }: { event: H3Event }) => {
	const userConfigCookieRaw = getCookie(event, cookieNames.imapConfig)
	const baseConfig: UserConfig = {
		mailboxesPaths: null,
	}

	if (!userConfigCookieRaw) return baseConfig

	let parsedConfig = safeParse<UserConfig>(userConfigCookieRaw)

	return {
		...baseConfig,
		...parsedConfig,
	}
}

export const getSafeDavUserFromCookie = ({ event }: { event: H3Event }) => {
	try {
		const passwordSalt = useRuntimeConfig()?.imapPasswordSalt
		if (!passwordSalt) {
			throw createError({
				statusCode: 500,
				statusMessage: 'No password salt set',
			})
		}

		// Try to get user data cookie
		const cookieName = cookieNames.davData
		const davUserDataCookieRaw = getCookie(event, cookieName)
		if (!davUserDataCookieRaw)
			throw createError({ statusCode: 401, statusMessage: 'No cookie set' })

		const decryptedUserDataRaw = aes
			.decrypt(davUserDataCookieRaw, passwordSalt)
			.toString(utf8)
		if (!decryptedUserDataRaw)
			throw createError({
				statusCode: 401,
				statusMessage: `Failed to decrypt cookie "${cookieName}"`,
			})

		let davUser = safeParse<DavUser>(decryptedUserDataRaw)
		if (!davUser)
			throw createError({ statusCode: 401, statusMessage: 'No davUser set' })

		return davUser
	} catch (error) {
		console.error(error)
		return null
	}
}

type MessageUid = number
type MailboxPath = string
type ProcessedMessagesList = { [key: MailboxPath]: MessageUid[] }

export const getSafeImapProcessedMessagesFromCookie = ({
	event,
}: {
	event: H3Event
}) => {
	const processedMessages: ProcessedMessagesList = {}
	const processedImapMessagesCookieRaw = getCookie(
		event,
		cookieNames.imapProcessedMessages
	)
	if (!processedImapMessagesCookieRaw) return processedMessages

	let parsedProcessedMessages = safeParse<ProcessedMessagesList>(
		processedImapMessagesCookieRaw
	)
	if (!parsedProcessedMessages) return processedMessages

	return parsedProcessedMessages
}

/**
 * Check if a message (by uid & mailbox) is already processed.
 */
export const getSafeImapProcessedMessageFromCookie = ({
	event,
	mailboxPath,
	messageUid,
}: {
	event: H3Event
	mailboxPath: MailboxPath
	messageUid: MessageUid
}) => {
	const processedMessages = getSafeImapProcessedMessagesFromCookie({
		event,
	})
	const mailboxMessagesSet = new Set(processedMessages[mailboxPath] || [])
	return mailboxMessagesSet.has(messageUid)
}

/**
 * Updates the cookie with the new processed messages uid inside a mailbox.
 */
export const upsertSafeImapProcessedMessages = ({
	event,
	mailboxPath,
	messageUid,
}: {
	event: H3Event
	mailboxPath: MailboxPath
	messageUid: MessageUid
}) => {
	try {
		const parsedProcessedMessages = getSafeImapProcessedMessagesFromCookie({
			event,
		})

		const mailboxMessagesSet = new Set(
			parsedProcessedMessages[mailboxPath] || []
		)
		mailboxMessagesSet.add(messageUid)
		parsedProcessedMessages[mailboxPath] = [...mailboxMessagesSet]

		// Set cookie
		setCookie(
			event,
			cookieNames.imapProcessedMessages,
			JSON.stringify(parsedProcessedMessages),
			{
				...defaultCookieParameters,
			}
		)

		return parsedProcessedMessages
	} catch (error) {
		return null
	}
}
