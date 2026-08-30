import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/audio.js is a plain script declaring a bare `const _sbAudio` IIFE,
// concatenated into the sandboxed iframe rather than imported. Evaluate it in
// a Function context with a PIXI stub, the same technique assets.test.ts uses.

type FakeSound = { url: string };

function fakePixi(created: FakeSound[]) {
  return {
    sound: {
      Sound: {
        from({ url, loaded }: { url: string; loaded?: () => void; error?: () => void }) {
          const sound: FakeSound = { url };
          created.push(sound);
          // Resolve the load synchronously so preloadAudioManifest settles.
          loaded?.();
          return sound;
        },
      },
    },
  };
}

function loadAudio(pixi: ReturnType<typeof fakePixi>) {
  const src = readFileSync('src/components/Runner/engine/audio.js', 'utf-8');
  const factory = new Function('PIXI', `${src}\n return _sbAudio;`);
  return factory(pixi);
}

describe('preloadAudioManifest', () => {
  test('loads each manifest entry and caches it by name for createSound', async () => {
    const created: FakeSound[] = [];
    const audio = loadAudio(fakePixi(created));

    await audio.preloadAudioManifest([
      { name: 'boom.mp3', src: 'data:audio/mpeg;base64,AAAA' },
    ]);

    expect(created).toHaveLength(1);
    expect(created[0].url).toBe('data:audio/mpeg;base64,AAAA');
    expect(audio.createSound('boom.mp3')).toBe(created[0]);
  });

  test('tolerates an empty / missing manifest', async () => {
    const audio = loadAudio(fakePixi([]));
    await expect(audio.preloadAudioManifest([])).resolves.toBeUndefined();
    await expect(audio.preloadAudioManifest(undefined)).resolves.toBeUndefined();
  });
});
