import MediaSession from './index';

type MockMediaSession = {
	setActionHandler: jest.Mock;
	setPositionState: jest.Mock;
	metadata: any;
	playbackState: MediaSessionPlaybackState | '';
};

const SIZES = [96, 128, 192, 256, 384, 512] as const;

let MediaMetadataMock: any;

function installMediaMetadata() {
	MediaMetadataMock = class {
		constructor(init: any) {
			Object.assign(this, init);
		}
	};
	// @ts-ignore
	// noinspection JSConstantReassignment
	global.MediaMetadata = MediaMetadataMock;
}

function installNavigator(): MockMediaSession {
	const ms: MockMediaSession = {
		setActionHandler: jest.fn(),
		setPositionState: jest.fn(),
		metadata: null,
		playbackState: '',
	};

	// @ts-ignore
	// noinspection JSConstantReassignment
	global.navigator = {} as Navigator;

	// @ts-ignore
	// noinspection JSConstantReassignment
	global.navigator.mediaSession = ms;

	return ms;
}

function handlerFor(ms: MockMediaSession, name: string): any {
	const call = [...ms.setActionHandler.mock.calls]
		.reverse()
		.find(entry => entry[0] === name);

	return call ? call[1] : undefined;
}

function registeredNames(ms: MockMediaSession): string[] {
	return ms.setActionHandler.mock.calls.map(entry => entry[0] as string);
}

describe('MediaSession (extended)', () => {
	let ms: MockMediaSession;
	let mediaSession: MediaSession;

	beforeAll(() => {
		installMediaMetadata();
	});

	beforeEach(() => {
		ms = installNavigator();
		mediaSession = new MediaSession();
	});

	describe('buildArtworkList (via setMetadata)', () => {
		test('a string artwork expands to the 6 SIZES with png type and encoded src', () => {
			mediaSession.setMetadata({
				title: '',
				artist: '',
				album: '',
				artwork: 'https://example.com/img.jpg',
			});

			const artwork = ms.metadata.artwork as MediaImage[];

			expect(artwork).toHaveLength(SIZES.length);

			SIZES.forEach((size, index) => {
				expect(artwork[index]).toEqual({
					src: `https://example.com/img.jpg?width=${size}&type=png&aspect_ratio=1`,
					sizes: `${size}x${size}`,
					type: 'image/png',
				});
			});
		});

		test('a string artwork src is URI-encoded (space becomes %20)', () => {
			mediaSession.setMetadata({
				title: '',
				artist: '',
				album: '',
				artwork: 'https://example.com/my image.jpg',
			});

			const artwork = ms.metadata.artwork as MediaImage[];

			expect(artwork[0].src).toBe(
				'https://example.com/my%20image.jpg?width=96&type=png&aspect_ratio=1'
			);
		});

		test('an empty string artwork yields an empty list', () => {
			mediaSession.setMetadata({
				title: '',
				artist: '',
				album: '',
				artwork: '',
			});

			expect(ms.metadata.artwork).toEqual([]);
		});

		test('an array artwork passes through unchanged (same reference)', () => {
			const artwork: MediaImage[] = [
				{ src: 'x', sizes: '1x1', type: 'image/jpeg' },
			];

			mediaSession.setMetadata({
				title: '',
				artist: '',
				album: '',
				artwork,
			});

			expect(ms.metadata.artwork).toBe(artwork);
		});

		test('an undefined artwork yields an empty list', () => {
			mediaSession.setMetadata({
				title: '',
				artist: '',
				album: '',
				artwork: undefined,
			});

			expect(ms.metadata.artwork).toEqual([]);
		});
	});

	describe('setActionHandler', () => {
		test('always registers play/pause/stop/previoustrack/nexttrack and skips seek/skipad without deps', () => {
			mediaSession.setActionHandler({});

			const names = registeredNames(ms);

			expect(names).toEqual(
				expect.arrayContaining([
					'play',
					'pause',
					'stop',
					'previoustrack',
					'nexttrack',
				])
			);
			expect(names).not.toContain('seekbackward');
			expect(names).not.toContain('seekforward');
			expect(names).not.toContain('seekto');
			expect(names).not.toContain('skipad');
		});

		test('omitted callbacks fall back to a callable no-op handler', () => {
			mediaSession.setActionHandler({});

			const playHandler = handlerFor(ms, 'play');

			expect(typeof playHandler).toBe('function');
			expect(() => playHandler({ action: 'play' })).not.toThrow();
			expect(playHandler({ action: 'play' })).toBeUndefined();
		});

		test('previoustrack/nexttrack use the provided callbacks', () => {
			const previous = jest.fn();
			const next = jest.fn();

			mediaSession.setActionHandler({ previous, next });

			expect(ms.setActionHandler).toHaveBeenCalledWith('previoustrack', previous);
			expect(ms.setActionHandler).toHaveBeenCalledWith('nexttrack', next);
		});

		test('seek actions are NOT registered when only seek is provided', () => {
			mediaSession.setActionHandler({ seek: jest.fn() });

			const names = registeredNames(ms);

			expect(names).not.toContain('seekbackward');
			expect(names).not.toContain('seekforward');
			expect(names).not.toContain('seekto');
		});

		test('seek actions are NOT registered when only getPosition is provided', () => {
			mediaSession.setActionHandler({ getPosition: jest.fn().mockReturnValue(0) });

			const names = registeredNames(ms);

			expect(names).not.toContain('seekbackward');
			expect(names).not.toContain('seekforward');
			expect(names).not.toContain('seekto');
		});

		test('seek actions ARE registered when both seek and getPosition are functions', () => {
			mediaSession.setActionHandler({
				seek: jest.fn(),
				getPosition: jest.fn().mockReturnValue(0),
			});

			const names = registeredNames(ms);

			expect(names).toContain('seekbackward');
			expect(names).toContain('seekforward');
			expect(names).toContain('seekto');
		});

		test('seekbackward uses a 30s default delta and details.seekTime when present', () => {
			const seek = jest.fn();
			const getPosition = jest.fn().mockReturnValue(100);

			mediaSession.setActionHandler({ seek, getPosition });

			const back = handlerFor(ms, 'seekbackward');

			back({});
			expect(seek).toHaveBeenLastCalledWith(70);

			back({ seekTime: 10 });
			expect(seek).toHaveBeenLastCalledWith(90);
		});

		test('seekforward uses a 30s default delta and details.seekTime when present', () => {
			const seek = jest.fn();
			const getPosition = jest.fn().mockReturnValue(100);

			mediaSession.setActionHandler({ seek, getPosition });

			const forward = handlerFor(ms, 'seekforward');

			forward({});
			expect(seek).toHaveBeenLastCalledWith(130);

			forward({ seekTime: 5 });
			expect(seek).toHaveBeenLastCalledWith(105);
		});

		test('seekto forwards details.seekTime directly to seek', () => {
			const seek = jest.fn();
			const getPosition = jest.fn().mockReturnValue(100);

			mediaSession.setActionHandler({ seek, getPosition });

			const seekTo = handlerFor(ms, 'seekto');

			seekTo({ seekTime: 42 });
			expect(seek).toHaveBeenLastCalledWith(42);
		});

		test('skipad is registered with the exact skipAd callback when provided', () => {
			const skipAd = jest.fn();

			mediaSession.setActionHandler({ skipAd });

			expect(ms.setActionHandler).toHaveBeenCalledWith('skipad', skipAd);
			expect(handlerFor(ms, 'skipad')).toBe(skipAd);
		});

		test('skipad is NOT registered when skipAd is absent', () => {
			mediaSession.setActionHandler({});

			expect(registeredNames(ms)).not.toContain('skipad');
		});
	});

	describe('clearActionHandler', () => {
		const allActions = [
			'play',
			'pause',
			'stop',
			'previoustrack',
			'nexttrack',
			'seekbackward',
			'seekforward',
			'seekto',
			'skipad',
		];

		test('with no argument clears all 9 actions to null', () => {
			mediaSession.clearActionHandler();

			expect(ms.setActionHandler.mock.calls).toHaveLength(9);
			allActions.forEach((action) => {
				expect(ms.setActionHandler).toHaveBeenCalledWith(action, null);
			});
		});

		test('with a single action name clears only that action', () => {
			mediaSession.clearActionHandler('play');

			expect(ms.setActionHandler.mock.calls).toEqual([['play', null]]);
		});

		test('with an array clears exactly those actions', () => {
			mediaSession.clearActionHandler(['pause', 'stop']);

			expect(ms.setActionHandler.mock.calls).toEqual([
				['pause', null],
				['stop', null],
			]);
		});
	});

	describe('setPlaybackState', () => {
		test('assigns the given state to navigator.mediaSession.playbackState', () => {
			mediaSession.setPlaybackState('paused');
			expect(ms.playbackState).toBe('paused');

			mediaSession.setPlaybackState('none');
			expect(ms.playbackState).toBe('none');
		});
	});

	describe('setMetadata', () => {
		test('resets metadata to null before assigning the new MediaMetadata', () => {
			const assigned: any[] = [];
			let current: any = { stale: true };

			Object.defineProperty(ms, 'metadata', {
				configurable: true,
				get: () => current,
				set: (value) => {
					assigned.push(value);
					current = value;
				},
			});

			mediaSession.setMetadata({
				title: 'T',
				artist: 'A',
				album: 'Al',
				artwork: undefined,
			});

			expect(assigned).toHaveLength(2);
			expect(assigned[0]).toBeNull();
			expect(assigned[1]).toBeInstanceOf(MediaMetadataMock);
			expect(current).toBeInstanceOf(MediaMetadataMock);
		});

		test('assigns a MediaMetadata carrying title/artist/album/artwork', () => {
			mediaSession.setMetadata({
				title: 'T',
				artist: 'A',
				album: 'Al',
				artwork: 'https://example.com/a.jpg',
			});

			expect(ms.metadata).toBeInstanceOf(MediaMetadataMock);
			expect(ms.metadata).toEqual(
				expect.objectContaining({ title: 'T', artist: 'A', album: 'Al' })
			);
			expect(ms.metadata.artwork).toHaveLength(SIZES.length);
		});

		test('maps chapters into chapterInfo with title/startTime/artwork', () => {
			mediaSession.setMetadata({
				title: 'T',
				artist: 'A',
				album: 'Al',
				artwork: undefined,
				chapters: [
					{ title: 'Intro', startTime: 0, artwork: 'https://example.com/c.jpg' },
					{ title: 'Part 2', startTime: 60 },
				],
			});

			const chapterInfo = ms.metadata.chapterInfo;

			expect(chapterInfo).toHaveLength(2);

			expect(chapterInfo[0]).toEqual({
				title: 'Intro',
				startTime: 0,
				artwork: expect.any(Array),
			});
			expect(chapterInfo[0].artwork).toHaveLength(SIZES.length);

			expect(chapterInfo[1]).toEqual({
				title: 'Part 2',
				startTime: 60,
				artwork: [],
			});
		});

		test('defaults chapters to an empty chapterInfo when omitted', () => {
			mediaSession.setMetadata({
				title: 'T',
				artist: 'A',
				album: 'Al',
				artwork: undefined,
			});

			expect(ms.metadata.chapterInfo).toEqual([]);
		});
	});

	describe('setPositionState', () => {
		test('forwards the state object to navigator.mediaSession.setPositionState', () => {
			const state = {
				duration: 300,
				playbackRate: 1.5,
				position: 120,
			};

			mediaSession.setPositionState(state);

			expect(ms.setPositionState).toHaveBeenCalledTimes(1);
			expect(ms.setPositionState).toHaveBeenCalledWith(state);
		});
	});
});

describe('MediaSession when mediaSession is not supported', () => {
	let savedNavigator: any;
	let mediaSession: MediaSession;

	beforeEach(() => {
		savedNavigator = global.navigator;

		// @ts-ignore
		// noinspection JSConstantReassignment
		global.navigator = {} as Navigator;

		mediaSession = new MediaSession();
	});

	afterEach(() => {
		// @ts-ignore
		// noinspection JSConstantReassignment
		global.navigator = savedNavigator;
	});

	test('every method is a no-op that throws nothing and sets nothing', () => {
		expect(() => mediaSession.setActionHandler({ play: jest.fn() })).not.toThrow();
		expect(() => mediaSession.clearActionHandler()).not.toThrow();
		expect(() => mediaSession.clearActionHandler('play')).not.toThrow();
		expect(() => mediaSession.setPlaybackState('playing')).not.toThrow();
		expect(() =>
			mediaSession.setMetadata({
				title: 'T',
				artist: 'A',
				album: 'Al',
				artwork: 'https://example.com/a.jpg',
			})
		).not.toThrow();
		expect(() =>
			mediaSession.setPositionState({ duration: 1, playbackRate: 1, position: 0 })
		).not.toThrow();

		expect('mediaSession' in global.navigator).toBe(false);
		expect((global.navigator as any).playbackState).toBeUndefined();
		expect((global.navigator as any).metadata).toBeUndefined();
	});
});
