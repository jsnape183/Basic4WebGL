# Audio Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `audio` built-in class to softBASIC so games can play sound effects and background music, using `@pixi/sound` as the engine.

**Architecture:** A new `audio.js` engine module owns all audio state. It preloads audio assets from localStorage at game startup (same mechanism as `assets.js`, filtered by audio extension). `@pixi/sound` is loaded via CDN `<script>` tag in `bootstrapper.html` immediately after the PIXI tag. The softBASIC API is a class called `audio` — users instantiate it directly with `dim shoot as audio("shoot.wav")`.

**Tech Stack:** `@pixi/sound` v6 (official PIXI audio extension, CDN), Web Audio API (via @pixi/sound), HTML5 `<audio>` element for IDE preview.

---

## softBASIC API

```bas
' Declare audio objects — one per sound file
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")

' Playback
shoot.play()         ' play once; concurrent calls overlap (good for SFX)
music.playLoop()     ' play looping; stops any existing loop first

' Control
music.stop()                ' stop all instances of this sound
music.setVolume(0.5)        ' 0.0 = silent, 1.0 = full volume
if music.isPlaying() then   ' returns true or false
  music.stop()
endif
```

Audio files must be uploaded to the project's asset panel (`.mp3`, `.wav`, or `.ogg`). They are preloaded automatically when the game starts — there is no explicit load call.

---

## Files Created / Modified

| File | Action |
|------|--------|
| `src/lib/Basic4WebGL/defs/audio.bas` | Create — Audio class def |
| `src/components/Runner/engine/audio.js` | Create — `_sbAudio` engine module |
| `src/components/Runner/softBasicEngine.js` | Modify — spread `..._sbAudio` |
| `src/components/Runner/bootstrapper.html` | Modify — CDN script + preload call |
| `src/constants/packageModules.ts` | Modify — import and register `audio` |
| `src/components/AssetPreview/getAssetType.ts` | Modify — add `'audio'` type |
| `src/components/AssetPreview/AudioPreview.tsx` | Create — HTML audio player component |
| `src/components/AssetPreview/index.tsx` | Modify — route audio assets to AudioPreview |
| `src/docs/api-reference/audio.md` | Create — API reference page |
| `src/docs/language-guide/datatypes.md` | Create — Language Guide datatypes page |
| `src/docs/manifest.ts` | Modify — register both new pages |

---

## Section 1: Audio class definition (`audio.bas`)

The class follows the exact `sprite.bas` pattern — a `_handle` field holds the underlying JS sound object, constructor calls `_sb.createSound`, and each method delegates to a `_sb.*` function passing `this._handle`.

```bas
Class
dim _handle

Constructor(soundPath)
  self._handle = call("_sb.createSound(constructor_soundPath)")
EndConstructor

function play()
  call("_sb.soundPlay(this._handle)")
endfunction

function playLoop()
  call("_sb.soundPlayLoop(this._handle)")
endfunction

function stop()
  call("_sb.soundStop(this._handle)")
endfunction

function setVolume(volume)
  call("_sb.soundSetVolume(this._handle, setvolume_volume)")
endfunction

function isPlaying()
  return call("_sb.soundIsPlaying(this._handle)")
endfunction

EndClass
```

---

## Section 2: Engine module (`audio.js`)

`_sbAudio` is an IIFE that owns a `_cache` map from filename → PIXI Sound instance. It preloads audio assets from localStorage (same pattern as `_sbAssets.preloadFromLocalStorage`), filtered to `.mp3`, `.wav`, `.ogg` by file extension.

```js
const _sbAudio = (() => {
  const _cache = new Map();
  const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg']);

  function _isAudio(name) {
    const dot = name.lastIndexOf('.');
    return dot !== -1 && AUDIO_EXTS.has(name.slice(dot).toLowerCase());
  }

  return {
    async preloadFromLocalStorage(projectId) {
      const raw = window.localStorage.getItem('persist:softBASIC');
      if (!raw) return;
      let assetsById = {};
      try {
        const persisted = JSON.parse(raw);
        assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};
      } catch (_) { return; }

      const audioAssets = Object.values(assetsById).filter(
        (a) => a.projectId === projectId && _isAudio(a.name)
      );

      await Promise.all(audioAssets.map((a) => new Promise((resolve) => {
        const sound = PIXI.sound.Sound.from({
          url: a.content,
          preload: true,
          loaded: () => resolve(),
        });
        _cache.set(a.fullName ?? a.name, sound);
      })));
    },

    createSound(name) {
      if (!_cache.has(name)) {
        throw new Error(
          `Audio "${name}" not found. Make sure the filename is correct and included in your assets.`
        );
      }
      return _cache.get(name);
    },

    soundPlay(handle) {
      handle.play();
    },

    soundPlayLoop(handle) {
      handle.stop();
      handle.play({ loop: true });
    },

    soundStop(handle) {
      handle.stop();
    },

    soundSetVolume(handle, volume) {
      handle.volume = volume;
    },

    soundIsPlaying(handle) {
      return handle.isPlaying;
    },
  };
})();
```

**`play()` behaviour:** Does not stop before replaying — concurrent calls stack, which is the correct behaviour for SFX (e.g. rapid laser fire). If the user wants only one instance at a time they should call `stop()` first.

**`playLoop()` behaviour:** Stops any existing playback first so calling it twice does not stack two looping instances.

**Shared handle:** Multiple `dim x as audio("same.wav")` declarations share the same Sound object from `_cache`. `stop()` on any of them stops all instances of that sound. This is acceptable for BETA.

---

## Section 3: Bootstrapper changes

Two changes to `bootstrapper.html`:

**1. CDN script tag** — add immediately after the PIXI script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@pixi/sound@6/dist/pixi-sound.js"></script>
```

**2. Preload call** — add `await _sbAudio.preloadFromLocalStorage(_sbProjectId)` immediately after the existing `await _sb.preloadFromLocalStorage(_sbProjectId)` call.

**Version note:** `@pixi/sound` v6 targets PIXI v7. During implementation, verify compatibility with the PIXI v8 build in use (`pixi.js@8.x`). If v6 does not work, try `@pixi/sound@7` or the `pixi-sound` package. The CDN URL must be confirmed during implementation — do not hardcode it in tests.

---

## Section 4: Registration

**`softBasicEngine.js`** — add `..._sbAudio` to the `_sb` spread:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
};
```

**`packageModules.ts`** — add:

```ts
import audio from '../lib/Basic4WebGL/defs/audio.bas?raw';

export const packageModules: Record<string, string> = {
  // ... existing entries ...
  audio,
};
```

---

## Section 5: Asset panel changes

### `getAssetType.ts`

Extend the return type and add audio extensions:

```ts
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg']);

export function getAssetType(name: string): 'image' | 'audio' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  return 'text';
}
```

### `AudioPreview.tsx`

Simple component that renders an HTML `<audio controls>` element so the user can preview the sound in the IDE:

```tsx
import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';

type Props = { asset: IAsset };

const AudioPreview: React.FC<Props> = ({ asset }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
    <p className="text-ds-text-muted text-sm">{asset.name}</p>
    <audio controls src={asset.content} className="w-full max-w-sm" />
  </div>
);

export default AudioPreview;
```

### `AssetPreview/index.tsx`

Add the audio branch:

```tsx
const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const type = getAssetType(asset.name);
  if (type === 'image') return <ImagePreview asset={asset} />;
  if (type === 'audio') return <AudioPreview asset={asset} />;
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};
```

### File upload `accept` attribute

`src/components/TreePanel/AssetTree/index.tsx:532` — the `<input type="file">` has no `accept` attribute. Add one covering all image and audio types:

```tsx
accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.mp3,.wav,.ogg"
```

No changes to `processFiles` are needed — it accepts any file type and stores it as a data URL.

---

## Section 6: Documentation

### `src/docs/api-reference/audio.md`

```markdown
# audio

The `audio` class plays sound effects and background music. Include the **softGfx** package to use it.

Audio files must be uploaded to your project's Assets panel (`.mp3`, `.wav`, or `.ogg`). They load automatically when the game starts.

## Constructor

Declare one `audio` variable per sound file you want to use. Typically done at the top of your `Main` file, outside any function.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| soundPath | string | Filename of the audio asset, e.g. `"shoot.wav"` |

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")
```

## play()

Plays the sound once. If called multiple times rapidly, each call plays a new overlapping instance — useful for SFX like laser fire or explosions.

```bas
shoot.play()
```

## playLoop()

Plays the sound on a continuous loop. If the sound is already looping, it restarts from the beginning.

```bas
music.playLoop()
```

## stop()

Stops playback immediately.

```bas
music.stop()
```

## setVolume(volume)

Sets the playback volume.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| volume    | number | `0.0` = silent, `1.0` = full volume |

```bas
music.setVolume(0.3)
shoot.setVolume(0.8)
```

## isPlaying()

Returns `true` if the sound is currently playing, `false` if not.

**Returns:** `true` or `false`

```bas
if not music.isPlaying() then
  music.playLoop()
endif
```

## Example

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")

function onenter()
  music.setVolume(0.4)
  music.playLoop()
endfunction

function onupdate(delta)
  if input.getKeyDown(32) then
    shoot.play()
  endif
endfunction
```
```

### `src/docs/language-guide/datatypes.md`

```markdown
# Data Types

softBASIC works with four kinds of values.

## Numbers

All numeric values — integers and decimals — are the same type.

```bas
dim score
score = 0

dim speed
speed = 2.5

dim total
total = score + speed
```

## Strings

Text values use double quotes.

```bas
dim name
name = "Player One"
print "Hello, " + name
```

Use `string.str(number)` to convert a number to a string when building messages:

```bas
print "Score: " + string.str(score)
```

## true and false

Some functions return `true` or `false` to indicate yes/no results — for example, whether a key is held down or two sprites are overlapping. You can use these directly in `if` conditions:

```bas
if input.getKeyDown(32) then
  shoot.play()
endif

if gfx.boxCollide(player, enemy) then
  gameOver()
endif
```

You can also store them in variables and compare explicitly:

```bas
dim colliding
colliding = gfx.boxCollide(player, enemy)

if colliding = true then
  gameOver()
endif
```

When passing `true` or `false` as a parameter, write the word directly:

```bas
self.setFlip(true, false)
self.addAnim("walk", 0, 7, 12, true)
```

## Objects

Variables that hold class instances (sprites, audio, text, etc.) are objects. See [The new Keyword](new-keyword) and [Classes](classes) for how to create and use them.

## Related Topics

- [Operators](operators)
- [Control Flow](control-flow)
- [The new Keyword](new-keyword)
```

### `manifest.ts` changes

Add `audio` to the softGfx API Reference group:

```ts
{ slug: 'audio', title: 'audio', file: 'api-reference/audio.md' },
```

Add `datatypes` to the Language Guide topics (after `operators`):

```ts
{ slug: 'datatypes', title: 'Data Types', file: 'language-guide/datatypes.md' },
```

---

## Testing

Audio playback is runtime behaviour that cannot be tested via the transpiler test suite. Verification is done manually:

1. Upload a `.mp3` and a `.wav` to a project's assets
2. Write a game that calls `play()`, `playLoop()`, `stop()`, `setVolume()`, and `isPlaying()`
3. Run the project and confirm sounds play correctly
4. Confirm audio assets show the `<audio controls>` preview in the IDE asset panel
5. Confirm unknown audio filename produces a bottom-panel ERR message

Transpiler tests ARE needed for the `dim x as audio("file.wav")` syntax — this exercises the existing typed-collections / `new`-keyword machinery. Write at least two tests confirming the constructor call transpiles correctly.
