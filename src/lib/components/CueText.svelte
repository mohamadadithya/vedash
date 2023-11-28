<script lang="ts">
	import { fade } from 'svelte/transition';

	export let activeCueText = '',
		isShowControls = false;
</script>

<div
	transition:fade={{ duration: 100 }}
	class="vedash__captions-wrapper absolute text-white {isShowControls
		? 'bottom-10 lg:bottom-20'
		: 'bottom-6'} left-2/4 -translate-x-2/4 z-[1] duration-100 pointer-events-none"
>
	<p class="text-center text-sm md:text-base">
		{activeCueText}
	</p>
</div>

<style lang="scss">
	.vedash__captions-wrapper {
		p {
			text-shadow: 2px 2px #000;
		}
	}
</style>
