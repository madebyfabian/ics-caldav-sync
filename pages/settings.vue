<template>
	<div>
		<h1>Settings</h1>

		<div class="grid grid-cols-12 gap-4 py-16 -mt-12 border-b">
			<div class="col-span-full md:col-span-4">
				<h2>IMAP Auth</h2>
			</div>

			<div class="col-span-full md:col-span-8">
				<LayoutUpdateImapAuth />
			</div>
		</div>

		<div class="grid grid-cols-12 gap-4 py-16 border-b">
			<div class="col-span-full md:col-span-4">
				<h2>IMAP Mailboxes</h2>
			</div>

			<div class="col-span-full md:col-span-8">
				<LayoutUpdateImapMailboxes />
			</div>
		</div>

		<div class="grid grid-cols-12 gap-4 py-16 border-b">
			<div class="col-span-full md:col-span-4">
				<h2>DAV Auth</h2>
			</div>

			<div class="col-span-full md:col-span-8">
				<LayoutUpdateDavAuth />
			</div>
		</div>
	</div>
</template>
