<template>
	<div>
		<div v-if="mailboxesPending">Loading...</div>

		<div v-else-if="mailboxes">
			<ul class="list-none">
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

			<button class="w-full mt-8" @click="handleSaveMailboxesConfig">
				Save
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { UserConfig } from '@/server/api/imap/config.post'
	const { userConfig, setUserConfig } = useUser()
	const { data: mailboxes, pending: mailboxesPending } = useFetch(
		'/api/imap/listMailboxes'
	)

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
		} catch (error) {
			console.error(error)
		}
	}
</script>
