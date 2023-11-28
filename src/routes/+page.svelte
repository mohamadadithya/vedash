<script>
	import Player from '$lib/components/Player.svelte';
</script>

<div class="grid place-items-center min-h-screen">
	<Player
		--primaryColor="red"
		src="https://dash.akamaized.net/digitalprimates/fraunhofer/480p_video/heaac_2_0_with_video/Sintel/sintel_480p_heaac2_0.mpd"
		disablepictureinpicture={true}
		crossorigin="anonymous"
		class="w-full max-w-4xl mx-auto"
	/>
</div>
