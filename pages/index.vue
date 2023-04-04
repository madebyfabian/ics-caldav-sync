<template>
	<div>
		<h1>New messages</h1>

		<p class="mt-8">Here are your messages with ICS attachments:</p>
		<section class="bg-gray-50 p-4 my-4 rounded-2xl -mx-4 md:-mx-0">
			<div v-if="!pending">
				<div v-if="data?.messages?.length">
					<Message
						v-for="message in data.messages"
						:key="message.uid"
						:message="(message as any)"
						@executedAction="refresh"
					/>
				</div>
				<div v-else>No messages with ICS attachments left 🎉</div>
			</div>
			<div v-else>Loading...</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	const { data, pending, refresh } = useLazyFetch('/api/imap/listMessages')
</script>
