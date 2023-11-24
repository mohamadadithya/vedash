<script lang="ts">
	import { clickoutside } from '@svelte-put/clickoutside';
	import { offset, flip, shift } from 'svelte-floating-ui/dom';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { createEventDispatcher } from 'svelte';

	interface ItemObject {
		label: string;
		value: unknown;
	}

	export let items: ItemObject[],
		title: string,
		value = '';

	let isShow = false;

	$: selectedLabel = value;

	const dispatch = createEventDispatcher();
	const changeEvent = (item: ItemObject) => {
		value = item.label;
		dispatch('change', { data: item.value });
	};

	const [floatingRef, floatingContent] = createFloatingActions({
		strategy: 'absolute',
		placement: 'top',
		middleware: [offset(6), flip(), shift()]
	});
</script>

<div class="flex flex-col justify-center" use:clickoutside on:clickoutside={() => (isShow = false)}>
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
							class="w-full {item.label.includes(selectedLabel)
								? 'bg-gray-300'
								: ''} hover:bg-gray-200 px-5 py-2 text-sm">{item.label}</button
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
