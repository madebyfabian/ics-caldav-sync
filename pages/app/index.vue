<template>
	<div>
		<div class="flex flex-wrap">
			<h1 class="m-0">New messages</h1>
			<button class="ml-auto mt-0" @click="() => refresh()">
				{{ pending ? 'Loading...' : 'Refresh' }}
			</button>
		</div>

		<p class="mt-8">Here are your messages with ICS attachments:</p>
		<section class="bg-gray-50 px-4 py-2 my-4 rounded-2xl -mx-4 md:-mx-0">
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

	definePageMeta({
		layout: 'app',
	})
</script>
