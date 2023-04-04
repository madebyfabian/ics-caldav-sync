import { createDAVClient } from 'tsdav'
import type { DavUser } from '@/server/api/dav/auth.post'

export const davClient = async ({ davUser }: { davUser: DavUser }) => {
	return await createDAVClient({
		serverUrl: davUser.serverUrl,
		credentials: {
			username: davUser.username,
			password: davUser.password,
		},
		authMethod: 'Basic',
		defaultAccountType: 'caldav',
	})
}

/**
 * Transforms a DAV UID into a filename
 * e.g. 12345@blah.com -> 12345@blahcom.ics
 */
export const transformUidToFileName = ({ uid }: { uid: string }) => {
	return `${uid.replace('.', '')}.ics`
}
