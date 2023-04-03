import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
	theme: {
		container: {
			center: true,
			padding: '1.25rem',
		},
		screens: {
			md: '768px',
			lg: '960px',
		},
	},
}
