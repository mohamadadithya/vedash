import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			runtime: 'edge',
			regions: ['sin1']
		}),
		version: {
			pollInterval: 5000
		},
		alias: {
			'@components': 'src/lib/components/index.ts',
			'@icons': 'src/lib/components/icons/index.ts',
			'@types': 'src/lib/types.ts',
			'@utils': 'src/lib/utils.ts',
			'@context': 'src/lib/context.ts'
		}
	}
};

export default config;
