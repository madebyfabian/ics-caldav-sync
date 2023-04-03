<template>
	<div>
		<input
			class="block w-full"
			type="url"
			v-model="authInput.dav.serverUrl"
			placeholder="Full Server URL (e.g. https://dav.example/dav)"
		/>
		<input
			class="block w-full"
			type="email"
			v-model="authInput.dav.username"
			placeholder="E-Mail"
		/>
		<input
			class="block w-full"
			type="password"
			v-model="authInput.dav.password"
			placeholder="Password"
		/>

		<button class="w-full mt-8" @click="handleAuth">
			{{ authPending ? 'Loading...' : 'Auth now' }}
		</button>

		<div v-if="authError">
			<pre>{{ authError }}</pre>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DavAuthBody } from '@/server/api/dav/auth.post'

	const runtimeConfig = useRuntimeConfig()
	const { setDavUser } = useUser()

	const authPending = ref(false)
	const authError = ref<unknown | null>(null)
	const authInput = reactive<DavAuthBody>({
		dav: {
			serverUrl: runtimeConfig.public.debugPrefillDavServerUrl || '',
			username: runtimeConfig.public.debugPrefillImapUsername || '',
			password: runtimeConfig.public.debugPrefillImapPassword || '',
		},
	})

	const handleAuth = async () => {
		authPending.value = true
		authError.value = null
		try {
			const data = await $fetch('/api/dav/auth', {
				method: 'POST',
				body: JSON.stringify(authInput),
			})
			setDavUser(data.dav)
		} catch (error) {
			authError.value = 'Error while authenticating'
			console.error(error)
		}
		authPending.value = false
	}
</script>
