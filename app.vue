<template>
	<div>
		<NuxtLayout>
			<main class="container">
				<NuxtPage />
			</main>
		</NuxtLayout>
	</div>
</template>

<script setup lang="ts">
	const { setUser, setUserPending, setUserConfig, setDavUser } = useUser()
	const {
		data: userData,
		error: userError,
		pending: userPending,
	} = useLazyFetch('/api/imap/user')

	// Only when fetch is done
	watch([userData, userError, userPending], () => {
		if (userPending.value) return
		setUserPending(false)
		if (!userData.value) return
		setUser(userData.value.user)
		setUserConfig(userData.value.userConfig)
		setDavUser(userData.value.davUser)
	})
</script>
