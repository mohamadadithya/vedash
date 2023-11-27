import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import { tweened, type Tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import type { ItemObject } from './types.js';

const setStates = () => {
	const currentTime: Tweened<number> = tweened(0, {
			duration: 350,
			easing: cubicOut
		}),
		volume: Writable<number> = writable(1),
		totalDuration: Writable<number | undefined> = writable(),
		isPaused: Writable<boolean> = writable(true),
		isShowControls: Writable<boolean> = writable(true),
		isFullscreen: Writable<boolean> = writable(false),
		isSeeking: Writable<boolean> = writable(false),
		playbackSpeed: Writable<number> = writable(1),
		isMuted: Writable<boolean> = writable(false),
		isLoopMode: Writable<boolean> = writable(false),
		isLoaded: Writable<boolean> = writable(false),
		quality: Writable<number | null> = writable(null),
		isOnline: Writable<boolean> = writable(true),
		isBuffering: Writable<boolean> = writable(false),
		bufferedWidth: Tweened<number> = tweened(0),
		isOpenPlaybackSettings: Writable<boolean> = writable(false),
		qualities: Writable<ItemObject[]> = writable([]);

	setContext('currentTime', currentTime);
	setContext('volume', volume);
	setContext('totalDuration', totalDuration);
	setContext('isPaused', isPaused);
	setContext('isShowControls', isShowControls);
	setContext('isFullscreen', isFullscreen);
	setContext('isSeeking', isSeeking);
	setContext('playbackSpeed', playbackSpeed);
	setContext('isMuted', isMuted);
	setContext('isLoopMode', isLoopMode);
	setContext('isLoaded', isLoaded);
	setContext('quality', quality);
	setContext('isOnline', isOnline);
	setContext('isBuffering', isBuffering);
	setContext('bufferedWidth', bufferedWidth),
		setContext('isOpenPlaybackSettings', isOpenPlaybackSettings),
		setContext('qualities', qualities);
};

const getStates = () => {
	return {
		currentTime: getContext<Tweened<number>>('currentTime'),
		volume: getContext<Writable<number>>('volume'),
		totalDuration: getContext<Writable<number | undefined>>('totalDuration'),
		isPaused: getContext<Writable<boolean>>('isPaused'),
		isShowControls: getContext<Writable<boolean>>('isShowControls'),
		isFullscreen: getContext<Writable<boolean>>('isFullscreen'),
		isSeeking: getContext<Writable<boolean>>('isSeeking'),
		playbackSpeed: getContext<Writable<number>>('playbackSpeed'),
		isMuted: getContext<Writable<boolean>>('isMuted'),
		isLoopMode: getContext<Writable<boolean>>('isLoopMode'),
		isLoaded: getContext<Writable<boolean>>('isLoaded'),
		quality: getContext<Writable<number | null>>('quality'),
		isOnline: getContext<Writable<boolean>>('isOnline'),
		isBuffering: getContext<Writable<boolean>>('isBuffering'),
		bufferedWidth: getContext<Tweened<number>>('bufferedWidth'),
		isOpenPlaybackSettings: getContext<Writable<boolean>>('isOpenPlaybackSettings'),
		qualities: getContext<Writable<ItemObject[]>>('qualities')
	};
};

export { setStates, getStates };
