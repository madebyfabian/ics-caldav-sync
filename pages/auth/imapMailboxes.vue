<template>
	<div>
		<div class="max-w-sm mx-auto">
			<h1>Sign in (2/3)</h1>
			<p>Select your IMAP mailboxes.</p>

			<LayoutUpdateImapMailboxes />
		</div>
	</div>
</template>

<script setup lang="ts">
	const { userConfig } = useUser()

	definePageMeta({
		layout: 'auth',
	})

	watchEffect(() => {
		if (userConfig.value) return navigateTo({ name: 'auth-dav' })
	})
</script>
