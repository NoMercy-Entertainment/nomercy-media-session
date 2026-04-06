// noinspection JSUnusedGlobalSymbols

// ChapterInformation is not yet in TypeScript's DOM lib — declare it locally.
interface ChapterInformationInit {
	title: string;
	startTime: number;
	artwork?: MediaImage[];
}

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

function buildArtworkList(artwork: MediaImage[] | string | undefined): MediaImage[] {
	if (typeof artwork === 'undefined') return [];

	if (Array.isArray(artwork)) return artwork;

	if (typeof artwork !== 'string' || !artwork) return [];

	const isPng = artwork.endsWith('.png') || artwork.includes('type=png');
	const mime = isPng ? 'image/png' : 'image/jpeg';

	return [
		{ src: encodeURI(`${artwork}?width=96&type=png&aspect_ratio=1`),  sizes: '96x96',   type: mime },
		{ src: encodeURI(`${artwork}?width=128&type=png&aspect_ratio=1`), sizes: '128x128', type: mime },
		{ src: encodeURI(`${artwork}?width=192&type=png&aspect_ratio=1`), sizes: '192x192', type: mime },
		{ src: encodeURI(`${artwork}?width=256&type=png&aspect_ratio=1`), sizes: '256x256', type: mime },
		{ src: encodeURI(`${artwork}?width=384&type=png&aspect_ratio=1`), sizes: '384x384', type: mime },
		{ src: encodeURI(`${artwork}?width=512&type=png&aspect_ratio=1`), sizes: '512x512', type: mime },
	];
}

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
			previous ?? (() => {})
		);

		navigator.mediaSession.setActionHandler(
			'nexttrack',
			next ?? (() => {})
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

		navigator.mediaSession.setActionHandler('play', play ?? (() => {}));

		navigator.mediaSession.setActionHandler('stop', stop ?? (() => {}));

		navigator.mediaSession.setActionHandler(
			'pause',
			pause ?? (() => {})
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

		let chapterInfo: ChapterInformationInit[] | undefined;

		if (chapters && chapters.length > 0) {
			const ChapterCtor = (globalThis as any).ChapterInformation;

			chapterInfo = chapters.map((chapter) => {
				const init: ChapterInformationInit = {
					title: chapter.title,
					startTime: chapter.startTime,
					artwork: buildArtworkList(chapter.artwork),
				};
				return ChapterCtor ? new ChapterCtor(init) : init;
			});
		}

		navigator.mediaSession.metadata = null;
		navigator.mediaSession.metadata = new MediaMetadata({
			title,
			artist,
			album,
			artwork: artworkList,
			...(chapterInfo ? { chapterInfo } : {}),
		} as MediaMetadataInit);
	}

	setPositionState({
		duration,
		playbackRate,
		position,
	}: {
		duration: number;
		playbackRate: number;
		position: number;
	}) {
		if (!('mediaSession' in navigator)) return;

		navigator.mediaSession.setPositionState({
			duration,
			playbackRate,
			position,
		});
	}
}
