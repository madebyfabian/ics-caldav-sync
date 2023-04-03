import type { User } from '@/server/api/imap/auth.post'
import type { UserConfig } from '@/server/api/imap/config.post'
import type { DavUser } from '@/server/api/dav/auth.post'

export const useUser = () => {
	type UserState = User | null
	const user = useState<UserState>('user', () => null)
	const setUser = (newUser: UserState) => {
		user.value = newUser
	}

	type UserConfigState = UserConfig | null
	const userConfig = useState<UserConfigState>('userConfig', () => null)
	const setUserConfig = (newConfig: UserConfigState) => {
		userConfig.value = newConfig
	}

	type DavUserState = DavUser | null
	const davUser = useState<DavUserState>('davUser', () => null)
	const setDavUser = (newDavUser: DavUserState) => {
		davUser.value = newDavUser
	}

	return {
		user: readonly(user),
		setUser,
		userConfig: readonly(userConfig),
		setUserConfig,
		davUser: readonly(davUser),
		setDavUser,
	}
}
