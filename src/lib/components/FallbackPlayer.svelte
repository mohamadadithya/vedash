<script lang="ts">
	import { onMount } from 'svelte';

	let videoEl: HTMLVideoElement, containerEl: HTMLDivElement;

	const manifestUri = `https://bitmovin-a.akamaihd.net/content
/MI201109210084_1
/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd`;

	onMount(async () => {
		const { default: shaka } = await import('shaka-player/dist/shaka-player.ui');

		const initShakaInstance = async () => {
			const player = new shaka.Player(videoEl);
			const ui = new shaka.ui.Overlay(player, containerEl, videoEl);
			const controls = ui.getControls();

			player.addEventListener('error', console.error);
			controls.addEventListener('error', console.error);

			try {
				await player.load(manifestUri);
			} catch (e) {
				console.error(e);
			}
		};

		document.addEventListener('shaka-ui-loaded', initShakaInstance);
	});
</script>

<section class="grid place-items-center min-h-screen">
	<!-- svelte-ignore a11y-media-has-caption -->
	<div bind:this={containerEl} class="w-full max-w-3xl mx-auto">
		<video class="w-full" bind:this={videoEl}></video>
	</div>
</section>

<style>
	@import 'node_modules/shaka-player/dist/controls.css';
</style>
