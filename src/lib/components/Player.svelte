<script lang="ts">
	import {
		CheckCircle2,
		FastForward,
		Fullscreen,
		Minimize,
		Pause,
		Play,
		Repeat2,
		Settings,
		Volume1,
		Volume2,
		VolumeX
	} from 'lucide-svelte';
	import { formatDuration } from '$lib/utils.js';
	import { setStates, getStates } from './context.js';
	import MenuPanel from './MenuPanel.svelte';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import shaka from 'shaka-player';

	setStates();
	const {
		currentTime,
		volume,
		totalDuration,
		isPaused,
		isShowControls,
		isFullscreen,
		isSeeking,
		playbackRate,
		isMuted,
		isLoopMode,
		isLoaded
	} = getStates();

	const dispatch = createEventDispatcher();

	export let src: string,
		preload = 'auto',
		disablepictureinpicture = false,
		controlslist = '',
		crossorigin: 'anonymous' | 'use-credentials' | '' = '';

	let playerEl: HTMLDivElement;

	const updateVolume = (event: Event) => {
		const inputEl = event.target as HTMLInputElement;
		const { value } = inputEl;

		$volume = +value;
		if ($volume > 0) $isMuted = false;
	};

	const updateCurrentTime = async (event: Event) => {
		const inputEl = event.target as HTMLInputElement;
		const { value } = inputEl;

		$isPaused = true;
		$isSeeking = true;
		$currentTime = +value;

		await videoEl.pause();
		videoEl.currentTime = $currentTime;
	};

	const toggleMute = () => {
		if ($isMuted) {
			$isMuted = false;
			$volume = 1;
		} else {
			if ($volume === 0) {
				$volume = 1;
			} else {
				$isMuted = true;
				$volume = 0;
			}
		}
	};

	let videoEl: HTMLVideoElement;

	const togglePlay = () => {
		if (videoEl.paused) {
			videoEl.play();
			$isPaused = false;
		} else {
			videoEl.pause();
			$isPaused = true;
			$isShowControls = true;
		}
	};

	const toggleFullscreen = () => {
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

	const seekedVideo = async () => {
		await togglePlay();

		$isSeeking = false;
		$volume = 1;
	};

	const playbackSpeeds = [0.5, 1, 1.5, 2].reverse();
	const qualities = [360, 480, 720, 1080];

	const setPlaybackSpeed = (event: CustomEvent) => {
		const speed = event.detail.data;
		$playbackRate = +speed!;
	};

	const handleSkipFrames = (activeEl: HTMLElement, status: 'forward' | 'backward') => {
		if (activeEl.id !== 'volume') {
			switch (status) {
				case 'forward':
					$currentTime += 10;
					break;
				case 'backward':
					$currentTime -= 10;
					break;
			}

			videoEl.currentTime = $currentTime;
		}
	};

	const setShortcuts = (event: KeyboardEvent) => {
		const activeElement = document.activeElement as HTMLElement;

		switch (event.code) {
			case 'Space':
				togglePlay();
				break;
			case 'KeyM':
				toggleMute();
				break;
			case 'KeyF':
				toggleFullscreen();
				break;
			case 'ArrowRight':
				handleSkipFrames(activeElement, 'forward');
				break;
			case 'ArrowLeft':
				handleSkipFrames(activeElement, 'backward');
				break;
		}
	};

	const setCurrentTime = (event: Event) => {
		const videoEl = event.target as HTMLVideoElement;
		$currentTime = videoEl.currentTime;
	};

	let idleTimer: ReturnType<typeof setTimeout>,
		idleState = false,
		time = 3000;

	const handleIdle = (event: Event) => {
		const targetEl = event.target as HTMLElement;
		const controlsEl = targetEl.closest('.vedash__controls');

		clearTimeout(idleTimer);

		if (idleState) $isShowControls = true;

		idleState = false;
		idleTimer = setTimeout(() => {
			if (!controlsEl && !$isPaused) {
				$isShowControls = false;
				idleState = true;
			}
		}, time);
	};

	const handleMouseEnter = () => ($isShowControls = true);

	const handleMouseLeave = () => {
		if ($isPaused) {
			$isShowControls = true;
		} else {
			document.addEventListener('mousemove', (event: Event) => {
				const targetEl = event.target as HTMLElement;
				const controlsEl = targetEl.closest('.vedash__controls');
				const videoEl = targetEl.closest('.vedash__video');

				if (!controlsEl && !videoEl && !$isPaused) $isShowControls = false;
			});
		}
	};

	const toggleLoop = () => {
		videoEl.loop = !videoEl.loop;
		$isLoopMode = videoEl.loop;
	};

	const handleEnded = () => {
		$isPaused = true;
		dispatch('ended');
	};

	onMount(async () => {
		const initPlayer = async () => {
			shaka.polyfill.installAll();

			if (!shaka.Player.isBrowserSupported) {
				console.error('Browser is not supported!');
				return;
			}

			const player = new shaka.Player(videoEl);
			player.addEventListener('error', console.error);

			try {
				await player.load(src);
				console.log('Player has loaded the video');
			} catch (error) {
				console.log(error);
			}
		};

		await initPlayer();
		$isLoaded = true;
	});
</script>

<svelte:window on:keydown={setShortcuts} on:mousemove={handleIdle} />

<div
	bind:this={playerEl}
	class="relative vedash"
	on:fullscreenchange={updateFullscreenState}
	on:contextmenu|preventDefault|stopPropagation
	role="presentation"
>
	<video
		{preload}
		{disablepictureinpicture}
		{controlslist}
		{crossorigin}
		class="w-full h-full vedash__video"
		bind:this={videoEl}
		on:timeupdate={setCurrentTime}
		on:click={togglePlay}
		bind:duration={$totalDuration}
		bind:playbackRate={$playbackRate}
		bind:volume={$volume}
		bind:muted={$isMuted}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		on:ended={handleEnded}
	>
		<track kind="captions" />
	</video>
	{#if $isSeeking || ($isShowControls && $isLoaded)}
		<div
			transition:fade={{ duration: 200 }}
			class="absolute w-full h-full bg-black top-0 left-0 bg-opacity-40 pointer-events-none"
		/>
	{/if}
	{#if $isShowControls && $isLoaded}
		<div transition:fade={{ duration: 200 }} class="vedash__controls">
			<div
				class="flex items-center justify-center gap-5 absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4"
			>
				<button type="button" aria-label="Backward" title="Previous"
					><FastForward class="-scale-x-[1] w-8 h-8 md:w-12 md:h-12" /></button
				>
				<button
					on:click={togglePlay}
					type="button"
					aria-label="Play/Pause"
					title={$isPaused ? 'Play' : 'Pause'}
				>
					{#if $isPaused}
						<Play class="w-8 h-8 md:w-12 md:h-12" />
					{:else}
						<Pause class="w-8 h-8 md:w-12 md:h-12" />
					{/if}
				</button>
				<button type="button" aria-label="Forward" title="Next"
					><FastForward class="w-8 h-8 md:w-12 md:h-12" /></button
				>
			</div>
			<div class="absolute bottom-0 w-full p-2.5 md:p-4 bg-gradient-to-t from-black to-transparent">
				<div class="flex items-center justify-between mb-1.5 text-sm">
					<p>{formatDuration($currentTime)}</p>
					<p>{formatDuration($totalDuration)}</p>
				</div>
				<input
					on:input={updateCurrentTime}
					on:change={seekedVideo}
					class="w-full rounded-xl h-1 mb-2"
					aria-label="Video duration slider"
					type="range"
					name="duration"
					id="duration"
					min={0}
					step={0.001}
					max={$totalDuration}
					bind:value={$currentTime}
				/>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						<button type="button" on:click={toggleMute} title="Mute">
							{#if $isMuted || $volume === 0}
								<VolumeX class="w-5 h-5 md:w-6 md:h-6" />
							{:else if $volume > 0.5}
								<Volume2 class="w-5 h-5 md:w-6 md:h-6" />
							{:else if $volume <= 0.5}
								<Volume1 class="w-5 h-5 md:w-6 md:h-6" />
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
						<button
							type="button"
							on:click={toggleLoop}
							aria-label="Loop"
							class="relative"
							title="Loop"
						>
							{#if $isLoopMode}
								<CheckCircle2
									class="w-3 h-3 md:w-4 md:h-4 fill-white stroke-black absolute -top-1 right-0"
								/>
							{/if}
							<Repeat2 class="w-5 h-5 md:w-6 md:h-6" />
						</button>
						<MenuPanel
							prefix="x"
							title="Playback Rate"
							items={playbackSpeeds}
							on:change={setPlaybackSpeed}
						>
							<span slot="trigger-button" class="font-semibold text-base md:text-lg">1x</span>
						</MenuPanel>
						<MenuPanel prefix="p" title="Quality" items={qualities}>
							<div slot="trigger-button">
								<Settings class="w-5 h-5 md:w-6 md:h-6" />
							</div>
						</MenuPanel>
						<button
							title="Fullscreen"
							type="button"
							on:click={toggleFullscreen}
							aria-label="Fullscreen"
						>
							{#if $isFullscreen}
								<Minimize class="w-5 h-5 md:w-6 md:h-6" />
							{:else}
								<Fullscreen class="w-5 h-5 md:w-6 md:h-6" />
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.vedash {
		color: var(--primaryColor);
	}

	input[type='range'] {
		color: var(--primaryColor);
		--thumb-height: 0.8em;
		--track-height: 0.15em;
		--track-color: hsla(0, 0%, 80%, 0.5);
		--brightness-hover: 180%;
		--brightness-down: 80%;
		--clip-edges: 0.125em;

		position: relative;
		background: #fff0;
		overflow: hidden;

		&:is(#duration) {
			width: 100%;
			cursor: pointer;
		}

		&:active {
			cursor: pointer;
		}

		&:disabled {
			filter: grayscale(1);
			opacity: 0.3;
			cursor: not-allowed;
		}

		&,
		&::-webkit-slider-runnable-track,
		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			height: var(--thumb-height);
			position: relative;
		}

		&:is(#duration):hover {
			--clip-edges: 0.125em;
			&::-webkit-slider-thumb {
				--box-fill: calc(-100vmax - var(--thumb-width, var(--thumb-height))) 0 0 100vmax
					currentColor;
				--clip-further: calc(100% + 1px);
				width: var(--thumb-width, var(--thumb-height));
				clip-path: polygon(
					100% -1px,
					var(--clip-edges) -1px,
					0 var(--clip-top),
					-100vmax var(--clip-top),
					-100vmax var(--clip-bottom),
					0 var(--clip-bottom),
					var(--clip-edges) 100%,
					var(--clip-further) var(--clip-further)
				);
			}

			&::-moz-range-thumb {
				width: var(--thumb-width, var(--thumb-height));
			}
		}

		&:is(#duration) {
			--clip-edges: 0;
			&::-webkit-slider-thumb {
				--box-fill: calc(-100vmax - var(--thumb-width, var(--thumb-height))) 0 0 105vmax
					currentColor;
				--clip-further: 0;

				width: 0;
				clip-path: polygon(
					0% 0px,
					var(--clip-edges) 0px,
					0 var(--clip-top),
					-100vmax var(--clip-top),
					-100vmax var(--clip-bottom),
					0 var(--clip-bottom),
					var(--clip-edges) 0%,
					var(--clip-further) var(--clip-further)
				);
			}

			&::-moz-range-thumb {
				width: 0;
			}
		}

		&::-webkit-slider-thumb {
			--thumb-radius: calc((var(--thumb-height) * 0.5) - 1px);
			--clip-top: calc((var(--thumb-height) - var(--track-height)) * 0.5 - 0.5px);
			--clip-bottom: calc(var(--thumb-height) - var(--clip-top));
			--clip-further: calc(100% + 1px);
			--box-fill: calc(-100vmax - var(--thumb-width, var(--thumb-height))) 0 0 100.028vmax
				currentColor;

			width: var(--thumb-width, var(--thumb-height));
			background: linear-gradient(currentColor 0 0) scroll no-repeat left center / 50%
				calc(var(--track-height) + 1px);
			background-color: currentColor;
			box-shadow: var(--box-fill);
			border-radius: var(--thumb-width, var(--thumb-height));

			filter: brightness(100%);
			clip-path: polygon(
				100% -1px,
				var(--clip-edges) -1px,
				0 var(--clip-top),
				-100vmax var(--clip-top),
				-100vmax var(--clip-bottom),
				0 var(--clip-bottom),
				var(--clip-edges) 100%,
				var(--clip-further) var(--clip-further)
			);
		}

		&:hover::-webkit-slider-thumb {
			filter: brightness(var(--brightness-hover));
			cursor: pointer;
		}

		&:active::-webkit-slider-thumb {
			filter: brightness(var(--brightness-down));
			cursor: pointer;
		}

		&::-webkit-slider-runnable-track {
			background: linear-gradient(var(--track-color) 0 0) scroll no-repeat center / 100%
				calc(var(--track-height) + 1px);
		}

		&:disabled::-webkit-slider-thumb {
			cursor: not-allowed;
		}

		&,
		&::-moz-range-track,
		&::-moz-range-thumb {
			appearance: none;
			height: var(--thumb-height);
		}

		&::-moz-range-track,
		&::-moz-range-thumb,
		&::-moz-range-progress {
			background: #fff0;
		}

		&::-moz-range-thumb {
			background: currentColor;
			border: 0;
			width: var(--thumb-width, var(--thumb-height));
			border-radius: var(--thumb-width, var(--thumb-height));
			cursor: pointer;
		}

		&:active::-moz-range-thumb {
			cursor: pointer;
		}

		&::-moz-range-track {
			width: 100%;
			background: var(--track-color);
		}

		&::-moz-range-progress {
			appearance: none;
			background: currentColor;
			transition-delay: 30ms;
		}

		&::-moz-range-track,
		&::-moz-range-progress {
			height: calc(var(--track-height) + 1px);
			border-radius: var(--track-height);
		}

		&::-moz-range-thumb,
		&::-moz-range-progress {
			filter: brightness(100%);
		}

		&:hover::-moz-range-thumb,
		&:hover::-moz-range-progress {
			filter: brightness(var(--brightness-hover));
		}

		&:active::-moz-range-thumb,
		&:active::-moz-range-progress {
			filter: brightness(var(--brightness-down));
		}

		&:disabled::-moz-range-thumb {
			cursor: not-allowed;
		}
	}
</style>
