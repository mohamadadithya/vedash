<script>
	import Player from '$lib/components/Player.svelte';
</script>

<div class="grid place-items-center min-h-screen">
	<Player
		--primaryColor="red"
		src="https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest_1080p_ClearKey.mpd"
		disablepictureinpicture={true}
		crossorigin="anonymous"
		class="w-full max-w-4xl mx-auto"
		configuration={{
			abr: { defaultBandwidthEstimate: 10000000 },
			drm: {
				clearKeys: {
					nrQFDeRLSAKTLifXUIPiZg: 'FmY0xnWCPCNaSpRG-tUuTQ'
				}
			}
		}}
	/>
</div>
