# MediaSession for Web

[![NPM Version](https://img.shields.io/npm/v/@nomercy-entertainment/media-session?style=flat&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@nomercy-entertainment/media-session)
[![NPM Downloads](https://img.shields.io/npm/dm/@nomercy-entertainment/media-session?style=flat&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@nomercy-entertainment/media-session)
[![License](https://img.shields.io/github/license/NoMercy-Entertainment/nomercy-media-session?style=flat&color=green)](./LICENSE)

A wrapper around the browser Media Session API for media controls, metadata, and playback state management. Its package manifest declares no runtime dependencies.

## About

This library wraps `navigator.mediaSession`. It registers action handlers, creates artwork entries with size labels from a URL, and sets playback and position states.

## Features

- **Media Metadata**: Set title, artist, album, and artwork. A string artwork URL becomes six `MediaImage` entries labeled 96 through 512 pixels wide. Their URLs receive width, type, and aspect-ratio query parameters; the library does not resize image files.
- **Playback State**: Set the browser's playback state to `none`, `paused`, or `playing`. Stop is an action handler, not a playback state.
- **Position State**: Sync duration, position, and playback rate.
- **Action Handlers**: Respond to play, pause, stop, previous, next, seek, and skip-ad actions.
- **Chapter Support**: Attach chapter markers to metadata for enhanced media navigation.
- **Handler Cleanup**: Unregister action handlers individually or all at once.
- **TypeScript Support**: The package includes TypeScript declarations.
- **Framework Agnostic**: The source has no frontend framework imports.
- **No Runtime Dependencies**: The package declares no production dependencies; building and testing it uses development dependencies.

## Quick Start

### Installation

Run `npm install @nomercy-entertainment/media-session` in your browser application. The package exports the `MediaSession` class as its default export and includes TypeScript declarations.

To verify this repository locally, run these commands from the repository root:

```shell
npm ci --ignore-scripts
```
This installs the necessary dependencies without triggering lifecycle scripts.

```shell
npm test -- --runInBand
```
This runs the test suite in a single process. A successful run is confirmed by `Tests: 31 passed, 31 total`.

### Basic Usage

```typescript
import MediaSession from '@nomercy-entertainment/media-session';

const session = new MediaSession();

// Example values assume a paused 300-second track at 100 seconds.

// Set action handlers
session.setActionHandler({
  play: () => console.log('Playing'),
  pause: () => console.log('Paused'),
  seek: (time) => console.log(`Seeking to ${time}`),
  getPosition: () => 100,
});

// Set metadata
session.setMetadata({
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  artwork: undefined,
  chapters: [
    { title: 'Chapter 1', startTime: 0 },
    { title: 'Chapter 2', startTime: 60 }
  ]
});

session.setPlaybackState('paused');

// Set position state
session.setPositionState({
  duration: 300,
  playbackRate: 1,
  position: 100
});
```

In a browser with the Media Session API, these calls register handlers and set browser metadata, playback state, and position state. The `play` callback logs `Playing` when the browser requests playback. Replace the logging callbacks and example time values with your media element's controls and state. In browsers without that API, the methods return without changing browser state.

## Advanced Features

### Media Session Integration

`setActionHandler` registers browser actions for play, pause, stop, previous track, and next track. You can also supply `skipAd` for the browser's `skipad` action. Playback state uses `none`, `paused`, or `playing`; `stop` is an action handler rather than a playback state.

To register `seekbackward`, `seekforward`, and `seekto`, supply both `seek` and `getPosition`. If either callback is missing, the seek handlers are not registered. The browser action details provide a seek interval when available; the implementation defaults to 30 seconds for backward and forward seeks.

### Artwork Handling

A string artwork URL becomes six `MediaImage` entries labeled 96, 128, 192, 256, 384, and 512 pixels square. The library appends `width`, `type=png`, and `aspect_ratio=1` query parameters to each URL and labels each entry `image/png`. It does not resize image files; the image server must handle those parameters if resized files are needed. A supplied `MediaImage[]` is passed through unchanged.

### Chapters

Pass a `chapters` array to `setMetadata`. Each chapter needs a `title` and `startTime` in seconds and can have an optional string artwork URL or `MediaImage[]`. The library maps these entries to `chapterInfo` when constructing `MediaMetadata` and applies the same artwork URL mapping to chapter artwork.

### Handler Cleanup

Call `clearActionHandler` with one action name, an array of names, or no argument to clear all registered actions. For example, use `clearActionHandler('play')` when a component stops owning the play action; `clearActionHandler(['play', 'pause'])` clears both.

## Browser Support

The library provides a graceful fallback: it silently performs no-ops when the `MediaSession` API is unavailable in the `navigator` object.

## Migration from v1.0.x

The current API registers actions with `setActionHandler` and removes them with `clearActionHandler`. It accepts chapter metadata and an optional `skipAd` callback. Review calls to these methods against the current signatures when upgrading.

## Migration from v0.x

The current package has no Capacitor runtime dependency. Browser code creates a default `MediaSession` class instance, registers actions with `setActionHandler`, and sets metadata with `setMetadata`. Native mobile integrations need their own bridge where browser Media Session APIs are unavailable.

## Contributing

### Development Setup

From a checkout of this repository, run the installation and test commands under [Quick Start](#quick-start). The package build uses TypeScript (`npm run build`). Review changes against the source and run the tests before submitting a pull request.

## License

This project uses the [Apache 2.0 License](./LICENSE).

## About NoMercy Entertainment

Visit [NoMercy Entertainment](https://nomercy.tv).

### Our Ecosystem

- [NoMercy MediaServer](https://github.com/NoMercy-Entertainment/nomercy-media-server)
- [NoMercy VideoPlayer](https://github.com/NoMercy-Entertainment/nomercy-video-player)
- [NoMercy MusicPlayer](https://github.com/NoMercy-Entertainment/nomercy-music-player)
- [NoMercy FFmpeg](https://github.com/NoMercy-Entertainment/nomercy-ffmpeg)

### Links

- Website: [nomercy.tv](https://nomercy.tv/)
- Contact: [support@nomercy.tv](mailto:support@nomercy.tv)
- GitHub: [@NoMercy-Entertainment](https://github.com/NoMercy-Entertainment)
