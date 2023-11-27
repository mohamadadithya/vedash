// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface ScreenOrientation {
		lock: (orientation: 'landscape' | 'portrait') => void;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
