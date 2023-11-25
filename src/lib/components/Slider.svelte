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
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		cursor: pointer;
		outline: none;
		border-radius: 12px;
		height: 3px;
		background: hsla(0, 0%, 80%, 0.4);

		/* Thumb: webkit */
		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			height: 12px;
			width: 12px;
			background-color: var(--primaryColor);
			border-radius: 50%;
			border: none;
			transition: 0.2s ease-in-out;
		}

		/* Thumb: Firefox */
		&::-moz-range-thumb {
			height: 12px;
			width: 12px;
			background-color: var(--primaryColor);
			border-radius: 50%;
			border: none;
			transition: 0.2s ease-in-out;
		}
	}
</style>
