import { ImapFlow } from 'imapflow'
import type { User } from '@/server/api/imap/auth.post'

export const imapFlowClient = ({ user }: { user: User }) => {
	return new ImapFlow({
		host: user.host,
		port: user.port,
		secure: user.secure ?? true,
		auth: {
			user: user.username,
			pass: user.password,
		},
	})
}
