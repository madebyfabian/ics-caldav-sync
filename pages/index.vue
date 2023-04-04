<template>
	<div v-if="!pending">
		<h1>Hi, {{ user?.username }}!</h1>

		<p>The following inboxes are being checked:</p>
		<div class="bg-gray-100 p-4 my-4 rounded-2xl">
			<ul
				v-if="
					Array.isArray(userConfig?.mailboxesPaths) &&
					userConfig?.mailboxesPaths.length
				"
			>
				<li
					v-for="mailboxPath of userConfig?.mailboxesPaths"
					:key="mailboxPath"
				>
					{{ mailboxPath }}
				</li>
			</ul>
			<div v-else>None.</div>
		</div>

		<p class="mt-8">Check your mailboxes for any emails with .ics</p>
		<div class="bg-gray-100 p-4 my-4 rounded-2xl">
			<section v-if="data?.messages?.length">
				<Message
					v-for="message in data.messages"
					:key="message.uid"
					:message="(message as any)"
				/>
			</section>
			<div v-else>Nothing here.</div>
		</div>
		<pre>{{ data }}</pre>
	</div>
	<div v-else>Loading...</div>
</template>

<script setup lang="ts">
	const { user, userConfig } = useUser()
	const { data, pending } = useLazyFetch('/api/imap/listMessages')
</script>
