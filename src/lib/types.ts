interface ItemObject {
	label: string;
	value: unknown;
}

interface Subtitle {
	kind?: 'subtitles' | 'captions';
	src: string;
	srclang: string;
	label: string;
}

export type { ItemObject, Subtitle };
