<script lang="ts">
	import Player from '$lib/components/Player.svelte';
</script>

<div class="grid place-items-center min-h-screen">
	<Player
		--primaryColor="red"
		src="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
		disablepictureinpicture={true}
		crossorigin="anonymous"
		class="w-full max-w-4xl mx-auto"
		configuration={{
			abr: { defaultBandwidthEstimate: 10000000 }
		}}
		subtitles={[
			{
				label: 'English',
				src: 'https://dl.dropboxusercontent.com/scl/fi/2yso1urlol8b95pz8c8i3/TOS-en.vtt?rlkey=02haff5d7dl7bxq7tcgvd895i&dl=0',
				srclang: 'en',
				kind: 'subtitles'
			}
		]}
	/>
</div>
