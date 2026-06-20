import MediaSession from './index';

describe('MediaSession', () => {
	let mediaSession: MediaSession;

	beforeAll(() => {
		// Mock global.navigator
		// @ts-ignore
		// noinspection JSConstantReassignment
		global.navigator = {} as Navigator;
		
		// Mocking MediaMetadata
		// @ts-ignore
		global.MediaMetadata = class {
			constructor(metadata: any) {
				Object.assign(this, metadata);
			}
		};

		// Mocking navigator.mediaSession
		// @ts-ignore
		// noinspection JSConstantReassignment
		global.navigator.mediaSession = {
			setActionHandler: jest.fn(),
			setPositionState: jest.fn(),
			metadata: null,
			playbackState: '',
		};
	});

	beforeEach(() => {
		mediaSession = new MediaSession();
	});

	test('should set metadata correctly', () => {
		const metadata = {
			title: 'Test Song',
			artist: 'Test Artist',
			album: 'Test Album',
			artwork: 'https://example.com/test-artwork.jpg',
		};

		mediaSession.setMetadata(metadata);

		expect((navigator as any).mediaSession.metadata).toEqual(
			expect.objectContaining({
				title: 'Test Song',
				artist: 'Test Artist',
				album: 'Test Album',
				artwork: expect.any(Array),
			})
		);
	});

	test('should set playback state correctly', () => {
		mediaSession.setPlaybackState('playing');

		expect((navigator as any).mediaSession.playbackState).toBe('playing');
	});

	test('should set position state correctly', () => {
		const positionState = {
			duration: 200,
			playbackRate: 1,
			position: 50,
		};

		mediaSession.setPositionState(positionState);

		expect((navigator as any).mediaSession.setPositionState).toHaveBeenCalledWith(
			positionState
		);
	});

	test('buildArtworkList output snapshot', () => {
		mediaSession.setMetadata({
			title: '',
			artist: '',
			album: '',
			artwork: 'https://example.com/img.jpg',
		});

		expect((navigator as any).mediaSession.metadata.artwork).toMatchSnapshot();
	});

	test('should set action handlers correctly', () => {
		const playHandler = jest.fn();
		const pauseHandler = jest.fn();
		const seekHandler = jest.fn();
		const getPositionMock = jest.fn().mockReturnValue(30);

		mediaSession.setActionHandler({
			play: playHandler,
			pause: pauseHandler,
			seek: seekHandler,
			getPosition: getPositionMock,
		});

		expect((navigator as any).mediaSession.setActionHandler).toHaveBeenCalledWith(
			'play',
			playHandler
		);

		expect((navigator as any).mediaSession.setActionHandler).toHaveBeenCalledWith(
			'pause',
			pauseHandler
		);

		expect((navigator as any).mediaSession.setActionHandler).toHaveBeenCalledWith(
			'seekto',
			expect.any(Function)
		);
	});
});