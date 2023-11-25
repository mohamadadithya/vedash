<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ItemObject } from '$lib/types.js';

	export let items: ItemObject[] = [],
		id = '',
		name = '',
		value: unknown,
		label = '';

	const dispatch = createEventDispatcher();
	const changeEvent = (event: Event) => {
		const targetEl = event.target as HTMLSelectElement;
		const value = targetEl.value;

		dispatch('change', { data: value });
	};
</script>

<div class="vedash__form-control">
	<label for={id}>{label}</label>
	<select on:change={changeEvent} {name} {id} bind:value>
		{#each items as item}
			<option value={item.value}>{item.label}</option>
		{/each}
	</select>
</div>

<style lang="scss">
	.vedash__form-control {
		label {
			@apply text-xs block mb-2 font-medium;
		}

		select {
			@apply w-full appearance-none bg-transparent border border-gray-300 p-2.5 text-sm rounded-md;
		}
	}
</style>
