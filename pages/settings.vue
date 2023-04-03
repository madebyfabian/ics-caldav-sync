<template>
	<div>
		<h1>Settings</h1>
		<h2>List of your inboxes:</h2>

		<div v-if="mailboxesPending">Loading...</div>

		<div v-else-if="mailboxes">
			<button @click="handleSaveMailboxesConfig">Save</button>
			<ul>
				<li v-for="mailbox of mailboxes.mailboxes" :key="mailbox.path">
					<label>
						<input
							type="checkbox"
							:value="mailbox.path"
							:checked="userConfig?.mailboxesPaths?.includes(mailbox.path)"
							v-model="mailboxesPaths"
						/>
						{{ mailbox.name }}
					</label>
				</li>
			</ul>
		</div>

		<hr />

		<pre>userConfig: {{ userConfig }}</pre>
	</div>
</template>

<script setup lang="ts">
	import type { UserConfig } from '@/server/api/imap/config.post'
	const { userConfig, setUserConfig } = useUser()
	const {
		data: mailboxes,
		pending: mailboxesPending,
		refresh: mailboxesRefresh,
	} = useFetch('/api/imap/mailboxes', { server: false })

	const mailboxesPaths = ref<UserConfig['mailboxesPaths']>([])
	watchEffect(() => {
		const userConfigMailboxPaths = userConfig.value?.mailboxesPaths
		mailboxesPaths.value = Array.isArray(userConfigMailboxPaths)
			? userConfigMailboxPaths
			: []
	})

	const handleSaveMailboxesConfig = async () => {
		try {
			const configRes = await $fetch('/api/imap/config', {
				method: 'POST',
				body: JSON.stringify({
					config: {
						mailboxesPaths: mailboxesPaths.value,
					},
				}),
			})
			if (!configRes?.userConfig) throw new Error('No userConfig in response')

			setUserConfig(configRes.userConfig)

			mailboxesRefresh()
		} catch (error) {
			console.error(error)
		}
	}
</script>
