// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: false,
	modules: ['@nuxtjs/tailwindcss'],
	app: {
		head: {
			title: 'ICS to CalDAV',
			link: [
				{
					rel: 'icon',
					type: 'image/svg+xml',
					href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📬</text></svg>',
				},
			],
		},
	},
	runtimeConfig: {
		imapPasswordSalt: '',
		public: {
			debugPrefillImapUsername: '',
			debugPrefillImapPassword: '',
			debugPrefillDavServerUrl: '',
		},
	},
})
