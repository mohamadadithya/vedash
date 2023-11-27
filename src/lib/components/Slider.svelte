<script lang="ts">
	import { beforeUpdate } from 'svelte';

	export let value = 0,
		max = 0,
		min = 0,
		step = 1,
		name = '',
		id = '',
		label = '';

	let className = '',
		sliderEl: HTMLInputElement;
	export { className as class };

	beforeUpdate(() => {
		if (sliderEl) {
			const progress = (+value / +max) * 100;
			sliderEl.style.background = `linear-gradient(to right, var(--primaryColor) ${progress}%, hsla(0, 0%, 80%, 0.4) ${progress}%)`;
		}
	});
</script>

<input
	bind:this={sliderEl}
	type="range"
	class="w-full rounded-xl relative {className}"
	aria-label={label}
	tabindex={0}
	bind:value
	on:change
	on:input
	{id}
	{name}
	{min}
	{max}
	{step}
/>

<style lang="scss">
	@mixin range-thumb {
		appearance: none;
		height: 0.75rem;
		width: 0.75rem;
		background-color: var(--primaryColor);
		border-radius: 50%;
		border: none;
		transition: 0.2s ease-in-out;
	}

	input[type='range'] {
		appearance: none;
		width: 100%;
		cursor: pointer;
		border-radius: 0.75rem;
		height: 3px;
		background: hsla(0, 0%, 80%, 0.4);

		&::-webkit-slider-thumb {
			@include range-thumb();
		}

		&::-moz-range-thumb {
			@include range-thumb();
		}
	}
</style>
