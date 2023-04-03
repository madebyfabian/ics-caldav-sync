<template>
	<div data-layout="default">
		<header class="mb-8 border-b h-16">
			<div class="container h-full flex justify-between items-center">
				<div>
					<NuxtLink :to="{ name: 'index' }">Home</NuxtLink>
					&nbsp;|&nbsp;
					<NuxtLink :to="{ name: 'settings' }">Settings</NuxtLink>
				</div>

				<div class="flex items-center gap-4">
					<p v-if="user" class="m-0">
						{{ user ? `Hi, ${user.username}!` : 'Unauthenticated.' }}
					</p>
					<button v-if="user" class="m-0" @click="handleSignOut">
						Sign out
					</button>
				</div>
			</div>
		</header>

		<slot />
	</div>
</template>

<script setup lang="ts">
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
