<template>
	<div>
		<h1>Settings</h1>

		<div class="grid grid-cols-12 py-12 border-b">
			<div class="col-span-3">
				<h2>IMAP Auth</h2>
			</div>

			<div class="col-span-9">
				<LayoutUpdateImapAuth />
			</div>
		</div>

		<div class="grid grid-cols-12 py-12 border-b">
			<div class="col-span-3">
				<h2>IMAP Mailboxes</h2>
			</div>

			<div class="col-span-9">
				<LayoutUpdateImapMailboxes />
			</div>
		</div>

		<div class="grid grid-cols-12 py-12 border-b">
			<div class="col-span-3">
				<h2>DAV Auth</h2>
			</div>

			<div class="col-span-9">
				<LayoutUpdateDavAuth />
			</div>
		</div>
	</div>
</template>
