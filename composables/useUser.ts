import type { User } from '@/server/api/imap/auth.post'
import type { UserConfig } from '@/server/api/imap/config.post'

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

	return {
		user: readonly(user),
		setUser,
		userConfig: readonly(userConfig),
		setUserConfig,
	}
}
