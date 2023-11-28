<script>
	import Player from '$lib/components/Player.svelte';
</script>

<div class="grid place-items-center min-h-screen">
	<Player
		--primaryColor="red"
		src="/videos/somebody-to-love-hls/somebody-to-love.m3u8"
		disablepictureinpicture={true}
		crossorigin="anonymous"
		class="w-full max-w-4xl mx-auto"
	/>
</div>
