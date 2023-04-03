<template>
	<div>
		<div v-if="userPending">Loading...</div>
		<template v-else>
			<header class="mb-8 border-b py-4">
				<div class="container flex justify-between items-center">
					<div>
						<p v-if="user">
							{{ user ? `Hi, ${user.username}!` : 'Unauthenticated.' }}
						</p>

						<NuxtLink :to="{ name: 'index' }">Home</NuxtLink>
						&nbsp;|&nbsp;
						<NuxtLink :to="{ name: 'settings' }">Settings</NuxtLink>
					</div>

					<button v-if="user" @click="handleSignOut">Sign out</button>
				</div>
			</header>
			<main class="container">
				<NuxtPage />
			</main>
		</template>
	</div>
</template>

<script lang="ts" setup>
	// Init user
	const { user, setUser, setUserConfig, setDavUser } = useUser()
	const {
		data: userData,
		error: userError,
		pending: userPending,
	} = await useLazyFetch('/api/imap/user', {
		server: false,
	})

	watchEffect(() => {
		if (userError.value) {
			return navigateTo({ name: 'auth' })
		}
	})

	// Only when fetch is done
	watch([userData], () => {
		if (!userData.value) return
		setUser(userData.value.user)
		setUserConfig(userData.value.userConfig)
		setDavUser(userData.value.davUser)
	})

	const handleSignOut = async () => {
		// Delete cookie.
		await $fetch('/api/imap/signOut', {
			method: 'POST',
		})

		// Clear local store.
		setUser(null)
		setUserConfig(null)
		setDavUser(null)

		if (process.client) {
			window.location.reload()
		}
	}
</script>
