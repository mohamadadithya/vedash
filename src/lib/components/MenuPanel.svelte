<script lang="ts">
	import { offset, flip, shift } from 'svelte-floating-ui/dom';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/actions/click-outside.js';
	import type { ItemObject } from '@types';

	export let items: ItemObject[], title: string, value: unknown;

	let isShow = false;

	const dispatch = createEventDispatcher();
	const changeEvent = (item: ItemObject) => {
		dispatch('change', { data: item.value });
	};

	const [floatingRef, floatingContent] = createFloatingActions({
		strategy: 'absolute',
		placement: 'top',
		middleware: [offset(6), flip(), shift()]
	});
</script>

<div class="flex flex-col justify-center" use:clickOutside={() => (isShow = false)}>
	<button
		use:floatingRef
		on:click={() => (isShow = !isShow)}
		type="button"
		class="font-semibold md:text-lg"
		{title}
	>
		<slot name="trigger-button" />
	</button>
	{#if isShow}
		<div
			class="absolute z-[1] bg-white text-black rounded-md font-medium shadow-lg bg-base-100 border border-gray-300"
			use:floatingContent
		>
			<p class="text-sm text-center bg-gray-200 py-1.5 px-2.5 border-b border-gray-300">{title}</p>
			<ul class="max-h-32 overflow-y-auto">
				{#each items as item}
					<li>
						<button
							on:click={() => changeEvent(item)}
							type="button"
							class="w-full {item.value == value
								? 'bg-gray-300'
								: ''} hover:bg-gray-200 px-5 py-2 text-sm">{item.label}</button
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
