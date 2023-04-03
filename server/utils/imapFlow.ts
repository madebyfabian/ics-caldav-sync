import { ImapFlow } from 'imapflow'
import type { User } from '@/server/api/imap/auth.post'

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
			warn: (...params) => {
				console.warn(params)
			},
			error: (...params) => {
				console.error(params)
			},
		},
		disableAutoIdle: true,
	})
}
