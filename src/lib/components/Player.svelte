<script lang="ts">
	import {
		CheckCircle2,
		FastForward,
		Fullscreen,
		Loader,
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
	import { fade, fly } from 'svelte/transition';
	import { beforeUpdate, createEventDispatcher, onDestroy, onMount } from 'svelte';
	import shaka, { Player } from 'shaka-player';
	import Slider from './Slider.svelte';

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
		isLoaded,
		quality,
		isOnline,
		isBuffering,
		bufferedWidth
	} = getStates();

	const dispatch = createEventDispatcher();

	export let src: string,
		preload = 'auto',
		disablepictureinpicture = false,
		controlslist = '',
		crossorigin: 'anonymous' | 'use-credentials' | '' = '';

	let playerEl: HTMLDivElement,
		className = '',
		idleTimer: ReturnType<typeof setTimeout>,
		idleState = false,
		time = 3000,
		videoEl: HTMLVideoElement;

	export { className as class };

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
	};

	const playbackSpeeds = [0.5, 1, 1.5, 2].map((rate) => {
		return {
			label: `${rate}x`,
			value: rate
		};
	});

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

		if (videoEl.buffered.length > 0 && $totalDuration) {
			const width = (100 * videoEl.buffered.end(0)) / $totalDuration;
			$bufferedWidth = width;
		}
	};

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

	const updateOnlineStatus = () => {
		if (window.navigator.onLine) {
			$isOnline = true;
		} else {
			$isOnline = false;
		}
	};

	const addNetworkListeners = () => updateOnlineStatus();
	const trackVariants: shaka.extern.Track[] = [];

	interface QualityObject {
		label: string;
		value: shaka.extern.Track | null;
	}

	let player: Player,
		selectedPlaybackRate = `${$playbackRate}x`,
		qualities: QualityObject[] = [];

	onMount(async () => {
		$isOnline = window.navigator.onLine;

		const initShaka = () => {
			shaka.polyfill.installAll();

			if (!shaka.Player.isBrowserSupported) {
				console.error('Browser is not supported!');
				return;
			}

			addNetworkListeners();
		};

		const initPlayer = async () => {
			player = new shaka.Player(videoEl);

			player.configure({
				abr: {
					defaultBandwidthEstimate: 10000000
				}
			});

			player.addEventListener('trackschanged', () => {
				player.getVariantTracks().forEach((track) => {
					trackVariants.push(track);
					qualities = trackVariants.map((track) => {
						return {
							label: `${track.height}p`,
							value: track
						};
					});

					qualities.unshift({
						label: 'Auto',
						value: null
					});
				});
			});

			player.addEventListener('error', console.error);
			player.addEventListener('buffering', (event: any) => ($isBuffering = event.buffering));

			try {
				await player.load(src);
				console.log('Player has loaded the video');
			} catch (error) {
				console.log(error);
			}
		};

		if ('serviceWorker' in navigator) {
			try {
				await navigator.serviceWorker.register('/src/lib/service-worker.ts');
				console.log('Service Worker registered successfully');
			} catch (error) {
				console.error(`Error registering service worker`);
			}
		} else {
			console.error(`Browser doesn't support service workers`);
		}

		initShaka();
		await initPlayer();
		$isLoaded = true;
	});

	onDestroy(() => {
		if (player) player.destroy();
	});

	const handleQuality = (event: CustomEvent) => {
		const selectedVariant = event.detail.data as shaka.extern.Track;

		if (selectedVariant) {
			const variant = trackVariants.find((track) => track.id === selectedVariant.id);
			const selectedQuality = qualities.find((quality) => quality.label === `${variant?.height}p`);

			if (selectedQuality) $quality = selectedQuality?.label as string;

			if (variant) {
				player.configure({ abr: { enabled: false } });
				player.selectVariantTrack(variant, true);
			} else {
				console.error(`Couldn't set quality`);
			}
		} else {
			$quality = 'Auto';
			player.configure({ abr: { enabled: true } });
		}
	};
</script>

<svelte:window
	on:keydown={setShortcuts}
	on:mousemove={handleIdle}
	on:online={updateOnlineStatus}
	on:offline={updateOnlineStatus}
/>

<div
	bind:this={playerEl}
	class="relative border border-gray-300 vedash overflow-hidden {className}"
	on:fullscreenchange={updateFullscreenState}
	on:contextmenu|preventDefault|stopPropagation
	role="presentation"
>
	{#if !$isOnline}
		<div
			transition:fly={{ duration: 300, y: 50 }}
			class="bg-white bg-opacity-90 absolute text-red-600 p-3 z-[1] rounded-br-md text-xs md:text-sm font-medium"
		>
			<p>Oops, you're offline.</p>
		</div>
	{/if}
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
	{#if $isSeeking || ($isShowControls && $isLoaded) || $isBuffering}
		<div
			transition:fade={{ duration: 200 }}
			class="absolute w-full h-full bg-black top-0 left-0 bg-opacity-40 pointer-events-none"
		/>
	{/if}
	{#if $isBuffering}
		<div class="absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 pointer-events-none">
			<Loader class="w-8 h-8 md:w-12 md:h-12 animate-spin text-white" />
		</div>
	{/if}
	{#if $isShowControls && $isLoaded}
		<div class="vedash__controls">
			{#if !$isBuffering}
				<div
					class="flex items-center justify-center gap-5 absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white"
				>
					<button
						on:click={() => dispatch('prev')}
						type="button"
						aria-label="Backward"
						title="Previous"><FastForward class="-scale-x-[1] w-8 h-8 md:w-12 md:h-12" /></button
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
					<button on:click={() => dispatch('next')} type="button" aria-label="Forward" title="Next"
						><FastForward class="w-8 h-8 md:w-12 md:h-12" /></button
					>
				</div>
			{/if}
			<div class="absolute bottom-0 w-full p-2.5 md:p-4 bg-gradient-to-t from-black to-transparent">
				<div class="flex items-center justify-between text-sm text-white">
					<p>{formatDuration($currentTime)}</p>
					<p>{formatDuration($totalDuration)}</p>
				</div>
				<div class="relative mb-1">
					<div
						style="width: {$bufferedWidth}%;"
						class="vedash__buffered bg-gray-400 h-[3px] absolute left-0 top-[62%] pointer-events-none rounded-[12px]"
					/>
					<Slider
						on:input={updateCurrentTime}
						on:change={seekedVideo}
						class="relative"
						label="Video duration slider"
						name="duration"
						id="duration"
						min={0}
						max={$totalDuration}
						step={0.001}
						bind:value={$currentTime}
					/>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						<button type="button" on:click={toggleMute} title="Mute" class="text-white">
							{#if $isMuted || $volume === 0}
								<VolumeX class="w-5 h-5 md:w-6 md:h-6" />
							{:else if $volume > 0.5}
								<Volume2 class="w-5 h-5 md:w-6 md:h-6" />
							{:else if $volume <= 0.5}
								<Volume1 class="w-5 h-5 md:w-6 md:h-6" />
							{/if}
						</button>
						<Slider
							--primaryColor="#FFFFFF"
							on:input={updateVolume}
							class="max-w-[5rem] rounded-xl bg-white"
							label="Volume slider"
							name="volume"
							id="volume"
							step={0.1}
							min={0}
							max={1}
							bind:value={$volume}
						/>
					</div>
					<div class="flex items-center gap-5 text-white">
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
							bind:value={selectedPlaybackRate}
							title="Playback Rate"
							items={playbackSpeeds}
							on:change={setPlaybackSpeed}
						>
							<span slot="trigger-button" class="font-semibold text-base md:text-lg">1x</span>
						</MenuPanel>
						{#if trackVariants.length > 0}
							<MenuPanel
								bind:value={$quality}
								on:change={handleQuality}
								title="Quality"
								items={qualities}
							>
								<div slot="trigger-button">
									<Settings class="w-5 h-5 md:w-6 md:h-6" />
								</div>
							</MenuPanel>
						{/if}
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
</style>
