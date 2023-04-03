<template>
	<div>
		<div class="max-w-sm mx-auto">
			<h1>Sign in (1/3)</h1>
			<p>Enter your IMAP details.</p>

			<LayoutUpdateImapAuth />
		</div>
	</div>
</template>

<script setup lang="ts">
	const { user } = useUser()

	definePageMeta({
		layout: 'auth',
	})

	watchEffect(() => {
		if (user.value) return navigateTo({ name: 'auth-imapMailboxes' })
	})
</script>
