<template>
	<div>
		<div v-if="userPending">Loading...</div>
		<template v-else>
			<header>
				<p>{{ user ? `Hi, ${user.username}!` : 'Unauthenticated.' }}</p>
				<button v-if="user" @click="handleSignOut">Sign out</button>
				&nbsp;
				<NuxtLink :to="{ name: 'index' }">Home</NuxtLink>
				&nbsp;
				<NuxtLink :to="{ name: 'settings' }">Settings</NuxtLink>
			</header>
			<NuxtPage />
		</template>
	</div>
</template>

<script lang="ts" setup>
	// Init user
	const { user, setUser, userConfig, setUserConfig } = useUser()
	const {
		data: userData,
		error: userError,
		pending: userPending,
	} = await useLazyFetch('/api/imap/user', {
		server: false,
	})

	const route = useRoute()

	watchEffect(() => {
		if (userError.value) {
			return navigateTo({ name: 'auth' })
		}

		// If no `mailboxesPaths` are set, force redirect to settings page.
		if (
			userConfig.value &&
			!Array.isArray(userConfig.value?.mailboxesPaths) &&
			route.name !== 'settings'
		) {
			return navigateTo({ name: 'settings' })
		}
	})

	// Only when fetch is done
	watch([userData], () => {
		if (!userData.value) return
		setUser(userData.value.user)
		setUserConfig(userData.value.userConfig)
	})

	const handleSignOut = async () => {
		// Delete cookie.
		await $fetch('/api/imap/signOut', {
			method: 'POST',
		})

		// Clear local store.
		setUser(null)
		setUserConfig(null)

		if (process.client) {
			window.location.reload()
		}
	}
</script>

<style lang="postcss">
	body {
		margin: 0;
		padding: 0;
		font-family: -apple-system, system-ui, sans-serif;
		max-width: 960px;
		padding: 0 20px;
		margin: 0 auto;
	}

	pre {
		background-color: #f7f7f8;
		padding: 1rem;
	}
</style>
