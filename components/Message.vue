<template>
	<div class="flex items-start gap-3 group/listItem">
		<span
			class="h-8 w-8 flex-shrink-0 mt-6 text-xl rounded-full flex items-center justify-center"
			:class="[
				!isMessageSeen({ flags: message.flags })
					? 'bg-blue-500'
					: 'bg-transparent',
			]"
		>
			✉️
		</span>

		<div
			class="flex gap-2 flex-col md:flex-row flex-1 items-start border-b group-last/listItem:border-none py-6"
		>
			<div class="flex-1">
				<div class="font-semibold mb-1 leading-snug">
					{{ message.envelope.subject }}
				</div>
				<div class="text-sm">
					{{ message.envelope.from[0].name }}
					{{ message.envelope.from[0].name ? '|' : '' }}
					<span>{{ message.envelope.from[0].address }}</span>
				</div>
				<div
					v-if="davActionError"
					class="text-red-500 mt-1 text-sm font-semibold"
				>
					{{ davActionError }}
				</div>
			</div>

			<button @click="handleDavAction" class="m-0 w-full md:w-auto">
				{{ davActionPending ? 'Syncing...' : '🔄 Sync' }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DavActionBody } from '@/server/api/dav/action.post'
	import type { MessageResObj } from '@/server/utils'

	const props = defineProps<{
		message: MessageResObj
	}>()

	const emit = defineEmits<{
		(e: 'executedAction'): void
	}>()

	const isMessageSeen = ({ flags }: { flags: string[] }) => {
		const foundIndex = flags.findIndex(flag =>
			flag.toUpperCase().includes('SEEN')
		)
		return foundIndex !== -1
	}

	const davActionPending = ref(false)
	const davActionError = ref<boolean | string>(false)

	const handleDavAction = async () => {
		try {
			davActionPending.value = true
			davActionError.value = false

			const body: DavActionBody = {
				imapMessage: {
					uid: props.message.uid,
					mailboxPath: props.message.mailboxPath,
					attachmentChildNodes: props.message.attachmentChildNodes,
				},
			}

			const actionRes = await $fetch('/api/dav/action', {
				method: 'POST',
				body: JSON.stringify(body),
			})
			if (!actionRes?.executedAction) {
				throw new Error('No executed action')
			}

			emit('executedAction')
		} catch (error) {
			davActionError.value = 'Error while syncing'
		} finally {
			davActionPending.value = false
		}
	}
</script>
