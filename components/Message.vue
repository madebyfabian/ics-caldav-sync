<template>
	<div class="flex items-start gap-4 group/listItem">
		<span
			class="h-8 w-8 mt-4 text-xl rounded-full flex items-center justify-center"
			:class="[
				isMessageSeen({ flags: message.flags })
					? 'bg-blue-500'
					: 'bg-transparent',
			]"
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

		<button @click="handleInsertIcs">🔄</button>
	</div>
</template>

<script setup lang="ts">
	import type { DavActionBody } from '@/server/api/dav/action.post'
	import type { MessageResObj } from '@/server/utils'

	const props = defineProps<{
		message: MessageResObj
	}>()

	const isMessageSeen = ({ flags }: { flags: string[] }) => {
		const foundIndex = flags.findIndex(flag =>
			flag.toUpperCase().includes('SEEN')
		)
		return foundIndex !== -1
	}

	const handleInsertIcs = () => {
		const body: DavActionBody = {
			imapMessage: {
				uid: props.message.uid,
				mailboxPath: props.message.mailboxPath,
				attachmentChildNodes: props.message.attachmentChildNodes,
			},
		}

		fetch('/api/dav/action', {
			method: 'POST',
			body: JSON.stringify(body),
		})
	}
</script>
