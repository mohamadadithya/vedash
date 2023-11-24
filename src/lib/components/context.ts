import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const setStates = () => {
	const currentTime: Writable<number> = writable(0),
		volume: Writable<number> = writable(1),
		totalDuration: Writable<number | undefined> = writable(),
		isPaused: Writable<boolean> = writable(true),
		isShowControls: Writable<boolean> = writable(true),
		isFullscreen: Writable<boolean> = writable(false),
		isSeeking: Writable<boolean> = writable(false),
		playbackRate: Writable<number> = writable(1),
		isMuted: Writable<boolean> = writable(false),
		isLoopMode: Writable<boolean> = writable(false),
		isLoaded: Writable<boolean> = writable(false),
		quality: Writable<string> = writable('Auto'),
		isOnline: Writable<boolean> = writable(true),
		isBuffering: Writable<boolean> = writable(false);

	setContext('currentTime', currentTime);
	setContext('volume', volume);
	setContext('totalDuration', totalDuration);
	setContext('isPaused', isPaused);
	setContext('isShowControls', isShowControls);
	setContext('isFullscreen', isFullscreen);
	setContext('isSeeking', isSeeking);
	setContext('playbackRate', playbackRate);
	setContext('isMuted', isMuted);
	setContext('isLoopMode', isLoopMode);
	setContext('isLoaded', isLoaded);
	setContext('quality', quality);
	setContext('isOnline', isOnline);
	setContext('isBuffering', isBuffering);
};

const getStates = () => {
	return {
		currentTime: getContext<Writable<number>>('currentTime'),
		volume: getContext<Writable<number>>('volume'),
		totalDuration: getContext<Writable<number | undefined>>('totalDuration'),
		isPaused: getContext<Writable<boolean>>('isPaused'),
		isShowControls: getContext<Writable<boolean>>('isShowControls'),
		isFullscreen: getContext<Writable<boolean>>('isFullscreen'),
		isSeeking: getContext<Writable<boolean>>('isSeeking'),
		playbackRate: getContext<Writable<number>>('playbackRate'),
		isMuted: getContext<Writable<boolean>>('isMuted'),
		isLoopMode: getContext<Writable<boolean>>('isLoopMode'),
		isLoaded: getContext<Writable<boolean>>('isLoaded'),
		quality: getContext<Writable<string>>('quality'),
		isOnline: getContext<Writable<boolean>>('isOnline'),
		isBuffering: getContext<Writable<boolean>>('isBuffering')
	};
};

export { setStates, getStates };
