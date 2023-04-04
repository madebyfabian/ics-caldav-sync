<template>
	<div data-layout="app">
		<header class="mb-8 border-b h-24 md:h-16">
			<div class="container h-full flex justify-between items-center">
				<div class="flex flex-wrap items-baseline gap-y-1 gap-x-6">
					<Logo />
					<div>
						<NuxtLink :to="{ name: 'app' }">Home</NuxtLink>
						&nbsp;|&nbsp;
						<NuxtLink :to="{ name: 'app-settings' }">Settings</NuxtLink>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<p v-if="user" class="m-0 hidden md:block">
						{{ user ? `Hi, ${user.username}!` : 'Unauthenticated.' }}
					</p>
					<button v-if="user" class="m-0" @click="handleSignOut">
						Sign out
					</button>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-3xl">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
	// Init user
	const { user, userPending, setUser, setUserConfig, setDavUser } = useUser()

	watchEffect(() => {
		console.log(userPending.value)
		if (!userPending.value && !user.value) {
			return navigateTo({ name: 'auth' })
		}
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
