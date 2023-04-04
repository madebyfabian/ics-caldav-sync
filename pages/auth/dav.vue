<template>
	<div>
		<div class="max-w-sm mx-auto">
			<h1>Sign in (3/3)</h1>
			<p>Enter your DAV details.</p>

			<LayoutUpdateDavAuth />
		</div>
	</div>
</template>

<script setup lang="ts">
	const { davUser } = useUser()

	definePageMeta({
		layout: 'auth',
	})

	watchEffect(() => {
		if (davUser.value) return navigateTo({ name: 'app' })
	})
</script>
