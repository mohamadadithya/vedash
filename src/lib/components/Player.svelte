<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import shaka, { type Player } from 'shaka-player';
	import MediaQuery from 'svelte-media-queries';
	import { CueText, MenuPanel, Slider, Select, Toggle } from '@components';
	import {
		CheckCircle,
		Close,
		Play,
		Pause,
		Next,
		Fullscreen,
		Minimize,
		Loop,
		Loader,
		Settings,
		Volume1,
		Volume2,
		VolumeX,
		Captions,
		CaptionsFilled
	} from '@icons';
	import { formatDuration } from '@utils';
	import { setStates, getStates } from '@context';
	import type { Subtitle } from '@types';
	import type IdleJs from 'idle-js';

	setStates();
	const {
		currentTime,
		volume,
		totalDuration,
		isPaused,
		isShowControls,
		isFullscreen,
		isSeeking,
		playbackSpeed,
		isMuted,
		isLoopMode,
		quality,
		isOnline,
		isBuffering,
		isOpenPlaybackSettings,
		qualities,
		isCaptionsOn,
		activeCueText,
		isLandscape,
		selectedCaption,
		isLoaded
	} = getStates();

	const dispatch = createEventDispatcher();

	export let src: string,
		preload = 'auto',
		disablepictureinpicture = false,
		controlslist = '',
		crossorigin: 'anonymous' | 'use-credentials' | '' = '',
		subtitles: Subtitle[] = [],
		configuration: object;

	const captions = subtitles.map((caption) => {
		return {
			label: caption.label,
			value: caption.srclang
		};
	});

	captions.unshift({ label: 'Off', value: 'off' });

	$selectedCaption = captions[0].value;

	let playerEl: HTMLDivElement,
		playerInstance: Player,
		className = '',
		idleTimer: ReturnType<typeof setTimeout>,
		idleState = false,
		videoEl: HTMLVideoElement,
		idleInstance: IdleJs;

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

	const togglePlay = async () => {
		(await videoEl.paused) ? videoEl.play() : videoEl.pause();

		if (videoEl.paused) $isShowControls = true;
		$isPaused = videoEl.paused;
	};

	const toggleFullscreen = async () => {
		if (!document.fullscreenElement) {
			await playerEl
				.requestFullscreen()
				.then(() => screen.orientation.lock('landscape'))
				.catch((error) => {
					console.error(
						`Error attempting to enable fullscreen mode: ${error.message} (${error.name})`
					);
				});
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	};

	const updateFullscreenState = () => ($isFullscreen = !!document.fullscreenElement);

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
		$playbackSpeed = +speed;
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

	const toggleLoop = () => {
		videoEl.loop = !videoEl.loop;
		$isLoopMode = videoEl.loop;
	};

	const handleEnded = () => {
		$isPaused = true;
		$activeCueText = '';

		dispatch('ended');
	};

	const updateOnlineStatus = () => ($isOnline = window.navigator.onLine);
	const addNetworkListeners = () => updateOnlineStatus();

	const trackVariants: shaka.extern.Track[] = [];

	const runCaptions = (caption: TextTrack) => {
		caption.mode = 'hidden';
		caption.addEventListener('cuechange', (event: Event) => {
			const cues = (event.target as TextTrack).activeCues;

			if (cues && cues.length > 0) {
				const cue = cues[0] as VTTCue;
				$activeCueText = cue.text;
			} else {
				$activeCueText = '';
			}
		});
	};

	const initShaka = () => {
		shaka.polyfill.installAll();

		if (!shaka.Player.isBrowserSupported) {
			console.error('Browser is not supported!');
			return;
		}

		addNetworkListeners();
	};

	const initShakaInstance = async () => {
		playerInstance = new shaka.Player(videoEl);
		playerInstance.configure(configuration);

		playerInstance.getNetworkingEngine()?.registerRequestFilter((type, request) => {
			dispatch('requestHeader', { type, request, shaka });
		});

		playerInstance.addEventListener('trackschanged', () => {
			playerInstance.getVariantTracks().forEach((track) => {
				trackVariants.push(track);
				$qualities = trackVariants.map((track) => {
					return {
						label: `${track.height}p`,
						value: track.id
					};
				});

				$qualities.unshift({ label: 'Auto', value: null });
			});
		});

		playerInstance.addEventListener('error', console.error);
		playerInstance.addEventListener('buffering', (event: any) => ($isBuffering = event.buffering));

		try {
			await playerInstance.load(src);
		} catch (error) {
			console.log(error);
		}
	};

	const handleQuality = (event: CustomEvent) => {
		const selectedVariantId =
			!event.detail.data && typeof event.detail.data !== 'number' ? null : +event.detail.data;
		const selectedVariant = trackVariants.find(
			(track) => track.id === selectedVariantId
		) as shaka.extern.Track;

		if (selectedVariant) {
			const variant = trackVariants.find((track) => track.id === selectedVariant.id);

			if (variant) {
				const selectedQuality = $qualities.find((quality) => quality.value === variant.id);
				if (selectedQuality) $quality = selectedQuality.value as number;

				playerInstance.configure({ abr: { enabled: false } });
				playerInstance.selectVariantTrack(variant, true);
			} else {
				console.error(`Couldn't set quality`);
			}
		} else {
			$quality = null;
			playerInstance.configure({ abr: { enabled: true } });
		}
	};

	const handleVideoClicked = () => {
		const query = window.matchMedia('(min-width: 1025px)');

		if (query.matches && !$isLandscape) {
			togglePlay();
		} else {
			$isShowControls = !$isShowControls;
		}
	};

	const initPlayer = async () => {
		initShaka();
		await initShakaInstance();
		$isLoaded = true;
	};

	const handleOrientation = () => ($isLandscape = screen.orientation.type.startsWith('landscape'));
	const handleCaptions = (event: CustomEvent) => {
		const value = event.detail.data;
		$selectedCaption = value;

		const textTracks = videoEl.textTracks;
		const caption = Array.from(textTracks).find((track) => track.language === $selectedCaption);

		if (caption) {
			runCaptions(caption);
			$isCaptionsOn = true;
		} else {
			$isCaptionsOn = false;
		}
	};

	onMount(async () => {
		const { default: IdleJs } = await import('idle-js');

		$isOnline = window.navigator.onLine;

		idleInstance = new IdleJs({
			idle: 3000,
			events: ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchend', 'click'],
			onIdle: () => {
				if ($isPaused || $isOpenPlaybackSettings) {
					idleInstance.reset().stop();
				} else {
					$isShowControls = false;
				}
			},
			onActive: () => {
				const query = window.matchMedia('(min-width: 1025px)');
				if (query.matches) $isShowControls = true;
			}
		});

		idleInstance.start();
		initPlayer();
	});

	onDestroy(() => {
		if (playerInstance) playerInstance.destroy();
		if (idleInstance) idleInstance.reset().stop();
	});

	const handleMouseEnter = () => {
		const query = window.matchMedia('(min-width: 1025px)');

		if (query.matches) $isShowControls = true;
	};

	const handleMouseLeave = () => {
		const query = window.matchMedia('(min-width: 1025px)');

		if (query.matches) $isShowControls = false;
	};
</script>

<svelte:window
	on:keydown={setShortcuts}
	on:online={updateOnlineStatus}
	on:offline={updateOnlineStatus}
	on:orientationchange={handleOrientation}
/>

<div
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	bind:this={playerEl}
	class="vedash relative overflow-hidden {className}"
	on:fullscreenchange={updateFullscreenState}
	on:contextmenu|preventDefault|stopPropagation
	role="presentation"
>
	{#if !$isOnline}
		<div
			transition:fly={{ duration: 300, y: -50 }}
			class="bg-white bg-opacity-90 absolute text-red-600 p-3 z-[1] rounded-br-md text-xs md:text-sm font-medium"
		>
			<p>Oops, you're offline.</p>
		</div>
	{/if}
	<!-- svelte-ignore a11y-media-has-caption -->
	<video
		{preload}
		{disablepictureinpicture}
		{controlslist}
		{crossorigin}
		class="w-full h-full vedash__video"
		bind:this={videoEl}
		on:timeupdate={setCurrentTime}
		on:click={handleVideoClicked}
		bind:duration={$totalDuration}
		bind:playbackRate={$playbackSpeed}
		bind:volume={$volume}
		bind:muted={$isMuted}
		on:ended={handleEnded}
	>
		{#each subtitles as subtitle}
			<track
				label={subtitle.label}
				kind={subtitle.kind ?? 'captions'}
				srclang={subtitle.srclang}
				src={subtitle.src}
			/>
		{/each}
	</video>
	{#if $activeCueText && $isCaptionsOn}
		<CueText bind:activeCueText={$activeCueText} bind:isShowControls={$isShowControls} />
	{/if}
	{#if $isSeeking || ($isShowControls && $isLoaded) || $isBuffering}
		<div
			transition:fade={{ duration: 150 }}
			class="absolute w-full h-full bg-black top-0 left-0 bg-opacity-30 pointer-events-none"
		/>
	{/if}
	{#if $isBuffering}
		<div class="absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 pointer-events-none">
			<Loader class="w-12 h-12 md:w-14 md:h-14 text-white" />
		</div>
	{/if}
	{#if $isShowControls && $isLoaded}
		<div transition:fade={{ duration: 150 }} class="vedash__controls text-white">
			<MediaQuery query="(max-width: 1024px)" let:matches>
				{#if matches || $isLandscape}
					<button
						on:click={() => ($isOpenPlaybackSettings = true)}
						type="button"
						class="absolute top-5 right-5"
					>
						<Settings class="w-5 h-5 md:w-6 md:h-6" />
					</button>
					{#if $isOpenPlaybackSettings}
						<div
							transition:fade={{ duration: 150 }}
							role="dialog"
							aria-labelledby="Playback settings"
							aria-describedby="Custom dialog element for playback settings"
							aria-modal={$isOpenPlaybackSettings}
							class="w-full h-full fixed top-0 left-0 bg-black bg-opacity-40 z-[1] grid place-items-center text-black"
						>
							<div class="bg-white p-5 w-full max-w-xs rounded-xl shadow-xl relative">
								<p class="text-sm uppercase font-semibold mb-4">Playback Settings</p>
								<button
									on:click={() => {
										$isOpenPlaybackSettings = false;
										idleInstance.start();
									}}
									type="button"
									class="absolute top-5 right-5"
								>
									<Close class="w-6 h-6" />
								</button>
								<div class="grid gap-4">
									<Select
										on:change={handleQuality}
										label="Quality"
										id="quality"
										name="quality"
										items={$qualities}
										bind:value={$quality}
									/>
									<Select
										on:change={setPlaybackSpeed}
										label="Speed"
										id="speed"
										name="speed"
										items={playbackSpeeds}
										bind:value={$playbackSpeed}
									/>
									{#if subtitles.length > 0}
										<Select
											on:change={handleCaptions}
											label="Captions"
											id="captions"
											name="captions"
											items={captions}
											bind:value={$selectedCaption}
										/>
									{/if}
									<Toggle
										id="loop-mode"
										name="loop_mode"
										label="Loop Mode"
										on:change={toggleLoop}
										bind:checked={$isLoopMode}
									/>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</MediaQuery>
			{#if !$isBuffering}
				<div
					class="flex items-center justify-center gap-5 absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4"
				>
					<button
						on:click={() => dispatch('prev')}
						type="button"
						aria-label="Backward"
						title="Previous"
						><Next class="-scale-x-[1] w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14" /></button
					>
					<button
						on:click={togglePlay}
						type="button"
						aria-label="Play/Pause"
						title={$isPaused ? 'Play' : 'Pause'}
					>
						{#if $isPaused}
							<Play class="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14" />
						{:else}
							<Pause class="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14" />
						{/if}
					</button>
					<button on:click={() => dispatch('next')} type="button" aria-label="Forward" title="Next"
						><Next class="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14" /></button
					>
				</div>
			{/if}
			<div
				class="absolute bottom-0 w-full p-2.5 md:p-4 bg-gradient-to-t from-black to-transparent text-white"
			>
				<MediaQuery query="(max-width: 1024px)" let:matches>
					{#if matches || $isLandscape}
						<div class="flex items-center justify-between">
							<p class="text-sm">
								{formatDuration($currentTime)} / {formatDuration($totalDuration)}
							</p>
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
					{/if}
				</MediaQuery>
				<div class="relative">
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
				<MediaQuery query="(min-width: 1025px)" let:matches>
					{#if matches && !$isLandscape}
						<div class="flex items-center justify-between text-white mt-2">
							<div class="flex items-center">
								<div class="flex items-center mr-3">
									<button class="mr-2.5" type="button" on:click={toggleMute} title="Mute">
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
								<p class="text-sm">
									{formatDuration($currentTime)} / {formatDuration($totalDuration)}
								</p>
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
										<CheckCircle
											class="w-3 h-3 md:w-4 md:h-4 fill-white stroke-black absolute -top-1 right-0"
										/>
									{/if}
									<Loop class="w-5 h-5 md:w-6 md:h-6" />
								</button>
								<MenuPanel
									bind:value={$playbackSpeed}
									title="Speed"
									items={playbackSpeeds}
									on:change={setPlaybackSpeed}
								>
									<span slot="trigger-button" class="font-semibold text-base md:text-lg">1x</span>
								</MenuPanel>
								{#if subtitles.length > 0}
									<MenuPanel
										bind:value={$selectedCaption}
										on:change={handleCaptions}
										title="Captions"
										items={captions}
									>
										<div slot="trigger-button">
											{#if $isCaptionsOn}
												<CaptionsFilled class="w-5 h-5 md:w-6 md:h-6" />
											{:else}
												<Captions class="w-5 h-5 md:w-6 md:h-6" />
											{/if}
										</div>
									</MenuPanel>
								{/if}
								<MenuPanel
									bind:value={$quality}
									on:change={handleQuality}
									title="Quality"
									items={$qualities}
								>
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
					{/if}
				</MediaQuery>
			</div>
		</div>
	{/if}
</div>
