<template>
	<div>
		<h1>Hi, {{ user?.username }}!</h1>
		<p>You're logged in.</p>
		<pre>{{ { user, userConfig } }}</pre>
	</div>
</template>

<script setup lang="ts">
	const { user, userConfig } = useUser()
</script>
