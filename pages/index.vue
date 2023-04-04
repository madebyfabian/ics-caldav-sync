<template>
	<div>
		<div class="flex justify-center">
			<Logo />
		</div>

		<div class="mt-24 md:w-6/12 mx-auto text-center">
			<h1>Add your .ics attachments to your WebDAV calendar!</h1>
			<p>
				ICS to CalDAV is a simple service that allows you to connect to your
				email account, get all messages with .ics attachments and add them to
				your WebDAV calendar.
			</p>

			<button v-if="!user" @click="navigateTo({ name: 'auth' })">
				Get started
			</button>
			<button v-else @click="navigateTo({ name: 'app' })">Go to app</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	const { user } = useUser()
</script>
