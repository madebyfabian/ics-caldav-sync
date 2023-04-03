<template>
	<div>
		<h1>Auth</h1>
		<input
			type="email"
			v-model="authInput.user.username"
			placeholder="E-Mail"
		/>
		<br /><br />
		<input
			type="password"
			v-model="authInput.user.password"
			placeholder="Password"
		/>
		<br />
		<br />
		<pre>{{ authInput.user }}</pre>
		<br /><br />
		<button @click="handleAuth">
			{{ authPending ? 'Loading...' : 'Auth now' }}
		</button>

		<div v-if="authError">
			<pre>{{ authError }}</pre>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { ImapAuthBody } from '@/server/api/imap/auth.post'

	const { user, setUser } = useUser()

	watchEffect(() => {
		if (user.value) return navigateTo({ name: 'index' })
	})

	const authPending = ref(false)
	const authError = ref<unknown | null>(null)
	const authInput = reactive<ImapAuthBody>({
		user: {
			host: 'imap.mail.de',
			port: 993,
			secure: true,
			username: '',
			password: '',
		},
	})

	const handleAuth = async () => {
		authPending.value = true
		try {
			const data = await $fetch('/api/imap/auth', {
				method: 'POST',
				body: JSON.stringify(authInput),
			})
			setUser(data.user)
		} catch (error) {
			authError.value = 'Error while authenticating'
			console.error(error)
		}
		authPending.value = false
	}
</script>
