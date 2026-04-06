# MediaSession for Web

[![NPM Version](https://img.shields.io/npm/v/@nomercy-entertainment/media-session?style=flat&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@nomercy-entertainment/media-session)
[![NPM Downloads](https://img.shields.io/npm/dm/@nomercy-entertainment/media-session?style=flat&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@nomercy-entertainment/media-session)
[![License](https://img.shields.io/github/license/NoMercy-Entertainment/nomercy-media-session?style=flat&color=green)](./LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Framework Agnostic](https://img.shields.io/badge/Framework-Agnostic-orange?style=flat)](https://github.com/NoMercy-Entertainment/nomercy-media-session)
[![GitHub Stars](https://img.shields.io/github/stars/NoMercy-Entertainment/nomercy-media-session?style=flat&logo=github&logoColor=white&color=yellow)](https://github.com/NoMercy-Entertainment/nomercy-media-session/stargazers)


---

## About

A lightweight wrapper around the browser [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API). Provides unified media controls, metadata, and playback state management for audio/video apps with zero dependencies.

Empowers media experiences in [NoMercyTV](https://nomercy.tv/) and other NoMercy projects.

---

## Features

- **Zero Dependencies:** No external packages required
- **Media Metadata:** Set title, artist, album, and artwork with automatic multi-size image generation
- **Playback State:** Control and reflect play, pause, stop, etc.
- **Position State:** Sync duration, position, and playback rate
- **Action Handlers:** Respond to play, pause, seek, next/previous, and more
- **Chapter Support:** Attach chapter markers to metadata for enhanced media navigation
- **Skip Ad:** Register a skip-ad action handler for ad-supported content
- **Handler Cleanup:** Unregister action handlers individually or all at once
- **TypeScript Support:** Full typings for safe integration
- **Framework Agnostic:** Use with any frontend framework
- **Graceful Fallback:** Silently no-ops when Media Session API is unavailable

---

## Quick Start

### Installation

```sh
npm install @nomercy-entertainment/media-session
```

### Basic Usage

```typescript
import MediaSession from '@nomercy-entertainment/media-session';

const mediaSession = new MediaSession();

// Set metadata with chapters
mediaSession.setMetadata({
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  artwork: 'https://example.com/artwork.jpg',
  chapters: [
    { title: 'Intro', startTime: 0 },
    { title: 'Verse 1', startTime: 30 },
    { title: 'Chorus', startTime: 90, artwork: 'https://example.com/chorus.jpg' },
  ],
});

// Set playback state
mediaSession.setPlaybackState('playing');

const audioElement = document.createElement('audio');

// Set position state
mediaSession.setPositionState({
  duration: audioElement.duration,
  playbackRate: audioElement.playbackRate,
  position: audioElement.currentTime
});

// Set action handlers
mediaSession.setActionHandler({
  play: () => audioElement.play(),
  pause: () => audioElement.pause(),
  stop: () => {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.removeAttribute('src');
  },
  previous: () => {},
  next: () => {},
  seek: (time) => audioElement.currentTime = time,
  getPosition: () => audioElement.currentTime,
  skipAd: () => skipToContent(),
});
```

---

## Advanced Features

### Media Session Integration

- Native OS media controls (lock screen, notification, hardware buttons)
- Customizable action handlers for all major media events
- Automatic artwork resizing for platform compatibility

### Artwork Handling

When passing a string URL as artwork, the library automatically generates multiple image sizes (96x96 through 512x512) for optimal display across different platforms and devices.

You can also pass a `MediaImage[]` array directly for full control over artwork variants.

### Chapters

Pass a `chapters` array in `setMetadata` to attach chapter markers to the current track. Each chapter object has:

- `title` (string) — display name for the chapter
- `startTime` (number) — start offset in seconds
- `artwork` (optional) — a string URL or `MediaImage[]` array; receives the same automatic multi-size generation as main artwork

Chapters are forwarded to the browser's MediaSession API as `chapterInfo` where supported.

```typescript
mediaSession.setMetadata({
  title: 'My Video',
  chapters: [
    { title: 'Introduction', startTime: 0 },
    { title: 'Main Content', startTime: 120 },
    { title: 'Credits', startTime: 3540, artwork: 'https://example.com/credits.jpg' },
  ],
});
```

### Handler Cleanup

Use `clearActionHandler` to unregister handlers when a component unmounts or media changes.

```typescript
// Clear a specific handler
mediaSession.clearActionHandler('play');

// Clear multiple handlers
mediaSession.clearActionHandler(['play', 'pause', 'seekto']);

// Clear all handlers
mediaSession.clearActionHandler();
```

---

## Browser Support

| Feature           | Chrome | Firefox | Safari | Edge |
|-------------------|:------:|:-------:|:------:|:----:|
| Media Session API |   73+  |   82+   |  15+   | 79+  |

When the Media Session API is not available, all methods silently no-op.

---

## Migration from v1.0.x

v1.1.0 is fully backwards compatible. No changes are required for existing code.

**What's new:**

- `setMetadata` now accepts an optional `chapters` array (see [Chapters](#chapters))
- `setActionHandler` now accepts an optional `skipAd` callback
- New `clearActionHandler()` method for cleanup (see [Handler Cleanup](#handler-cleanup))
- Fixed `image/jpg` MIME type typo — all generated artwork sizes now correctly use `image/jpeg`

---

## Migration from v0.x

v1.0.0 removes the Capacitor dependency. If you were relying on the Capacitor fallback for native mobile apps, you will need to handle that separately. For browser-only usage, the API is unchanged.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/NoMercy-Entertainment/nomercy-media-session/blob/master/CONTRIBUTING.md) for details.

### Development Setup

```sh
# Clone the repository
git clone https://github.com/NoMercy-Entertainment/nomercy-media-session.git
cd nomercy-media-session

# Install dependencies
npm install

# Build and test
npm run build
npm run test
```

---

## License

This project is licensed under the [Apache 2.0 License](./LICENSE) - see the LICENSE file for details.

---

## About NoMercy Entertainment

NoMercy Entertainment builds open-source media tools that give developers full control over their audio and video.

### Our Ecosystem

- [NoMercy MediaServer](https://github.com/NoMercy-Entertainment/nomercy-media-server)
- [NoMercy VideoPlayer](https://github.com/NoMercy-Entertainment/nomercy-video-player)
- [NoMercy MusicPlayer](https://github.com/NoMercy-Entertainment/nomercy-music-player)
- [NoMercy FFmpeg](https://github.com/NoMercy-Entertainment/nomercy-ffmpeg)

### Links

- Website: [nomercy.tv](https://nomercy.tv/)
- Contact: [support@nomercy.tv](mailto:support@nomercy.tv)
- GitHub: [@NoMercy-Entertainment](https://github.com/NoMercy-Entertainment)

---

<div align="center">

**Built with care by the NoMercy Engineering Team**

</div>
