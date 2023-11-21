<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import {
		FastForward,
		Fullscreen,
		Minimize,
		Pause,
		Play,
		Settings,
		Volume1,
		Volume2,
		VolumeX
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { formatDuration } from '$lib/utils.js';

	const duration: Writable<number> = writable(0);
	const volume: Writable<number> = writable(1);
	const totalDuration: Writable<number> = writable(0);
	const isPaused: Writable<boolean> = writable(true);
	const isShowControls: Writable<boolean> = writable(true);
	const isFullscreen: Writable<boolean> = writable(false);

	let videoEl: HTMLVideoElement, playerEl: HTMLDivElement;

	onMount(() => {
		if (videoEl) $totalDuration = videoEl.duration;
	});

	const toggleVideo = () => {
		if (videoEl.paused) {
			$isPaused = false;
			videoEl.play();
		} else {
			$isPaused = true;
			videoEl.pause();
		}
	};

	const updateDuration = (event: Event) => {
		const videoEl = event.target as HTMLVideoElement;
		$duration = videoEl.currentTime;
	};

	const updateVolume = (event: Event) => {
		const inputEl = event.target as HTMLInputElement;
		const { value } = inputEl;

		$volume = +value;
		if ($volume > 0) videoEl.muted = false;

		videoEl.volume = $volume;
	};

	const updateCurrentTime = (event: Event) => {
		const inputEl = event.target as HTMLInputElement;
		const { value } = inputEl;
		$duration = +value;

		videoEl.currentTime = $duration;
	};

	const toggleMute = () => {
		if (videoEl.muted) {
			videoEl.muted = false;
			$volume = 1;
			videoEl.volume = $volume;
		} else {
			if ($volume === 0) {
				$volume = 1;
				videoEl.volume = $volume;
			} else {
				videoEl.muted = true;
				$volume = 0;
				videoEl.volume = $volume;
			}
		}
	};

	const openFullscreen = () => {
		if (!document.fullscreenElement) {
			playerEl.requestFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	};

	const updateFullscreenState = () => {
		if (document.fullscreenElement) {
			$isFullscreen = true;
		} else {
			$isFullscreen = false;
		}
	};
</script>

<div bind:this={playerEl} class="relative text-white" on:fullscreenchange={updateFullscreenState}>
	<video
		bind:this={videoEl}
		preload="auto"
		disablepictureinpicture={true}
		class="w-full h-full"
		src="/videos/example.mp4"
		controlslist="nodownload"
		crossorigin="anonymous"
		on:click={toggleVideo}
		on:timeupdate={updateDuration}
	>
		<track kind="captions" />
	</video>
	{#if $isShowControls}
		<div
			class="flex items-center justify-center gap-5 absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4"
		>
			<button type="button" aria-label="Backward"
				><FastForward class="-scale-x-[1] w-7 h-7 md:w-10 md:h-10" /></button
			>
			<button on:click={toggleVideo} type="button" aria-label="Play/Pause">
				{#if $isPaused}
					<Play class="w-7 h-7 md:w-10 md:h-10" />
				{:else}
					<Pause class="w-7 h-7 md:w-10 md:h-10" />
				{/if}
			</button>
			<button type="button" aria-label="Forward"
				><FastForward class="w-7 h-7 md:w-10 md:h-10" /></button
			>
		</div>
		<div class="absolute bottom-0 w-full p-2.5 md:p-4 bg-gradient-to-t from-black to-transparent">
			<div class="flex items-center justify-between mb-1.5 text-sm md:text-base">
				<p>{formatDuration($duration)}</p>
				<p>{formatDuration($totalDuration)}</p>
			</div>
			<input
				on:input={updateCurrentTime}
				class="w-full rounded-xl h-1 mb-2"
				aria-label="Video duration slider"
				type="range"
				name="duration"
				id="duration"
				min={0}
				step={0.001}
				max={$totalDuration}
				bind:value={$duration}
			/>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<button type="button" on:click={toggleMute}>
						{#if videoEl}
							{#if videoEl.muted || videoEl.volume === 0}
								<VolumeX class="w-5 h-5 md:w-6 md:h-6" />
							{:else if videoEl.volume > 0.5}
								<Volume2 class="w-5 h-5 md:w-6 md:h-6" />
							{:else if videoEl.volume <= 0.5}
								<Volume1 class="w-5 h-5 md:w-6 md:h-6" />
							{/if}
						{/if}
					</button>
					<input
						on:input={updateVolume}
						class="w-full max-w-[6rem] h-0.5 rounded-xl bg-white"
						aria-label="Volume slider"
						type="range"
						name="volume"
						id="volume"
						step={0.1}
						min={0}
						max={1}
						bind:value={$volume}
					/>
				</div>
				<div class="flex items-center gap-5">
					<button type="button" class="font-semibold">1x</button>
					<button type="button"> <Settings class="w-5 h-5 md:w-6 md:h-6" /> </button>
					<button type="button" on:click={openFullscreen}>
						{#if $isFullscreen}
							<Minimize class="w-5 h-5 md:w-6 md:h-6" />
						{:else}
							<Fullscreen class="w-5 h-5 md:w-6 md:h-6" />
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	$trackHeight: 0.25rem;
	$accentColor: lime;
	$primaryColor: green;

	input[type='range'] {
		appearance: none;
		background: transparent;
		cursor: pointer;

		&:focus {
			outline: none;

			&::-webkit-slider-thumb {
				border: 1px solid $accentColor;
				outline: 2px solid $accentColor;
				outline-offset: 0.125rem;
			}

			&::-moz-range-thumb {
				border: 1px solid $accentColor;
				outline: 2px solid $accentColor;
				outline-offset: 0.125rem;
			}
		}

		&::-webkit-slider-runnable-track {
			background: white;
			height: $trackHeight;
			border-radius: 5rem;
		}

		&::-moz-range-track {
			background: white;
			height: $trackHeight;
			border-radius: 5rem;
		}

		&::-webkit-slider-thumb {
			appearance: none;
			margin-top: -12px;
			background-color: $primaryColor;
			width: 0.85rem;
			height: 0.85rem;
			border-radius: 50%;
			border: none;
		}

		&::-moz-range-thumb {
			appearance: none;
			margin-top: -12px;
			background-color: $primaryColor;
			width: 0.85rem;
			height: 0.85rem;
			border-radius: 50%;
			border: none;
		}
	}
</style>
