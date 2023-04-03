<template>
	<div>
		<input
			class="block w-full"
			type="text"
			v-model="authInput.user.host"
			placeholder="Host (e.g. imap.mail.de)"
		/>
		<input
			class="block w-full"
			type="number"
			v-model.number="authInput.user.port"
			placeholder="Port (e.g. 993)"
		/>
		<input
			class="block w-full"
			type="email"
			v-model="authInput.user.username"
			placeholder="E-Mail"
		/>
		<input
			class="block w-full"
			type="password"
			v-model="authInput.user.password"
			placeholder="Password"
		/>

		<label>
			<input type="checkbox" v-model="authInput.user.secure" />
			Secure?
		</label>

		<button class="w-full mt-8" @click="handleAuth">
			{{ authPending ? 'Loading...' : 'Auth now' }}
		</button>

		<div v-if="authError">
			<pre>{{ authError }}</pre>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { ImapAuthBody } from '@/server/api/imap/auth.post'

	const runtimeConfig = useRuntimeConfig()
	const { setUser } = useUser()

	const authPending = ref(false)
	const authError = ref<unknown | null>(null)
	const authInput = reactive<ImapAuthBody>({
		user: {
			host: 'imap.mail.de',
			port: 993,
			secure: true,
			username: runtimeConfig.public.debugPrefillImapUsername || '',
			password: runtimeConfig.public.debugPrefillImapPassword || '',
		},
	})

	const handleAuth = async () => {
		authPending.value = true
		authError.value = null
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
