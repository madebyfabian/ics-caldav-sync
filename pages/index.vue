<template>
	<div>
		<h1>Hi, {{ user?.username }}!</h1>

		<p>The following inboxes are being checked:</p>

		<ul
			v-if="Array.isArray(userConfig?.mailboxesPaths)"
			class="bg-gray-100 p-4 rounded-2xl"
		>
			<li v-for="mailboxPath of userConfig?.mailboxesPaths" :key="mailboxPath">
				{{ mailboxPath }}
			</li>
		</ul>
		<div v-else>None.</div>

		<p>Check your mailboxes for any emails with .ics</p>

		<div class="bg-gray-100 p-4 my-4 rounded-2xl">
			<ul v-if="checkRes?.messages?.length" class="list-none">
				<li
					v-for="message in checkRes.messages"
					class="flex items-start gap-4 group/listItem"
				>
					<span
						class="h-8 w-8 mt-4 bg-white rounded-full flex items-center justify-center"
						>✉️</span
					>
					<div class="py-4 border-b group-last/listItem:border-none flex-1">
						<div class="font-semibold mb-1">
							{{ message.envelope.subject }}
						</div>
						<div class="text-sm">
							{{ message.envelope.from[0].name }}
							{{ message.envelope.from[0].name ? '|' : '' }}
							<span>{{ message.envelope.from[0].address }}</span>
						</div>
					</div>
				</li>
			</ul>
			<div v-else>Nothing here.</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	const { user, userConfig } = useUser()

	const fetchCheckMailboxesRes = await $fetch('/api/imap/checkMailboxes')
	type Res = Awaited<typeof fetchCheckMailboxesRes>

	const checkRes = ref<Res | null>(fetchCheckMailboxesRes)
</script>
