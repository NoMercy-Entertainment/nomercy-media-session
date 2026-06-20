// noinspection JSUnusedGlobalSymbols

interface ChapterOptions {
	title: string;
	startTime: number;
	artwork?: MediaImage[] | string;
}

interface MetadataOptions extends Omit<MediaMetadataInit, 'artwork'> {
	artwork: MediaMetadataInit['artwork'] | string | undefined;
	chapters?: ChapterOptions[];
}

type ActionHandlerName =
	| 'play'
	| 'pause'
	| 'stop'
	| 'previoustrack'
	| 'nexttrack'
	| 'seekbackward'
	| 'seekforward'
	| 'seekto'
	| 'skipad';

const SIZES = [96, 128, 192, 256, 384, 512] as const;

function buildArtworkList(artwork: MediaImage[] | string | undefined): MediaImage[] {
	if (typeof artwork === 'undefined') return [];

	if (Array.isArray(artwork)) return artwork;

	if (typeof artwork !== 'string' || !artwork) return [];

	return SIZES.map(w => ({
		src: encodeURI(`${artwork}?width=${w}&type=png&aspect_ratio=1`),
		sizes: `${w}x${w}`,
		type: 'image/png',
	}));
}

const noop: MediaSessionActionHandler = () => {};

export default class MediaSession {

	setActionHandler({
		play, pause, stop,
		previous, next, seek,
		getPosition, skipAd,
	}: {
		play?: MediaSessionActionHandler;
		pause?: MediaSessionActionHandler;
		stop?: MediaSessionActionHandler;
		previous?: MediaSessionActionHandler;
		next?: MediaSessionActionHandler;
		seek?: (number: number) => void;
		getPosition?: () => number;
		skipAd?: MediaSessionActionHandler;
	}) {
		if (!('mediaSession' in navigator)) return;

		navigator.mediaSession.setActionHandler(
			'previoustrack',
			previous ?? noop
		);

		navigator.mediaSession.setActionHandler(
			'nexttrack',
			next ?? noop
		);

		if (
			typeof seek === 'function' &&
			typeof getPosition === 'function'
		) {
			navigator.mediaSession.setActionHandler(
				'seekbackward',
				(details) => seek(getPosition() - (details.seekTime ?? 30))
			);

			navigator.mediaSession.setActionHandler(
				'seekforward',
				(details) => seek(getPosition() + (details.seekTime ?? 30))
			);

			navigator.mediaSession.setActionHandler(
				'seekto',
				(details) => seek(details.seekTime as number)
			);
		}

		navigator.mediaSession.setActionHandler('play', play ?? noop);

		navigator.mediaSession.setActionHandler('stop', stop ?? noop);

		navigator.mediaSession.setActionHandler(
			'pause',
			pause ?? noop
		);

		if (typeof skipAd === 'function') {
			navigator.mediaSession.setActionHandler(
				'skipad' as MediaSessionAction,
				skipAd
			);
		}
	}

	clearActionHandler(actions?: ActionHandlerName | ActionHandlerName[]) {
		if (!('mediaSession' in navigator)) return;

		const allActions: ActionHandlerName[] = [
			'play', 'pause', 'stop',
			'previoustrack', 'nexttrack',
			'seekbackward', 'seekforward', 'seekto',
			'skipad',
		];

		const targets = actions === undefined
			? allActions
			: Array.isArray(actions)
				? actions
				: [actions];

		for (const action of targets) {
			navigator.mediaSession.setActionHandler(
				action as MediaSessionAction,
				null
			);
		}
	}

	setPlaybackState(playbackState: MediaSessionPlaybackState) {
		if (!('mediaSession' in navigator)) return;

		navigator.mediaSession.playbackState = playbackState;
	}

	setMetadata({ title, artist, album, artwork, chapters }: MetadataOptions) {
		if (!('mediaSession' in navigator)) return;

		const artworkList = buildArtworkList(artwork);

		const chapterList = (chapters ?? []).map(chapter => ({
			title: chapter.title,
			startTime: chapter.startTime,
			artwork: buildArtworkList(chapter.artwork),
		}));

		navigator.mediaSession.metadata = null;
		navigator.mediaSession.metadata = new MediaMetadata({
			title,
			artist,
			album,
			artwork: artworkList,
			chapterInfo: chapterList,
		} as MediaMetadataInit);
	}

	setPositionState(state: {
		duration: number;
		playbackRate: number;
		position: number;
	}) {
		if (!('mediaSession' in navigator)) return;

		navigator.mediaSession.setPositionState(state);
	}
}
