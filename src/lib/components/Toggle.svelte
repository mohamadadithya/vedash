<script lang="ts">
	export let checked = false,
		id = '',
		name = '',
		label = '';
</script>

<div class="vedash__form-control">
	<label class="relative inline-flex items-center cursor-pointer">
		<input type="checkbox" class="sr-only peer" {id} {name} on:change bind:checked />
		<div
			class="w-11 h-6 bg-gray-400 peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 rounded-full"
		></div>
		<span class="ms-3 text-xs font-medium text-gray-900">{label}</span>
	</label>
</div>
