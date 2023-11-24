<script>
	import Player from '$lib/components/Player.svelte';
</script>

<div class="min-h-screen grid place-items-center w-full max-w-4xl mx-auto">
	<Player
		--primaryColor="#FFFFFF"
		src="https://bitmovin-a.akamaihd.net
		/content/MI201109210084_1/mpds
		/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd"
		disablepictureinpicture={true}
		crossorigin="anonymous"
	/>
</div>
