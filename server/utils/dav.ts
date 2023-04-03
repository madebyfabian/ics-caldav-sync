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
