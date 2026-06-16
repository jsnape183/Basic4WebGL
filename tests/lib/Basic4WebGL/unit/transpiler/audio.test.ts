import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const audioSource = readFileSync('src/lib/Basic4WebGL/defs/audio.bas', 'utf-8');

const transpileWithAudio = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'audio.bas', source: audioSource },
      { name: 'Main.bas', source },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('audio — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio(
      'function test()\n  dim s as audio("shoot.wav")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.createSound(', () => {
    const result = transpileWithAudio(
      'function test()\n  dim s as audio("shoot.wav")\nendfunction'
    );
    expect(result.code).toContain('_sb.createSound(');
  });
});

// ─── play ─────────────────────────────────────────────────────────────────────

describe('audio — play()', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("shoot.wav")',
      '  s.play()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.soundPlay(', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("shoot.wav")',
      '  s.play()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.soundPlay(');
  });
});

// ─── playLoop ─────────────────────────────────────────────────────────────────

describe('audio — playLoop()', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.playLoop()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.soundPlayLoop(', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.playLoop()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.soundPlayLoop(');
  });
});

// ─── stop ─────────────────────────────────────────────────────────────────────

describe('audio — stop()', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.stop()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.soundStop(', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.stop()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.soundStop(');
  });
});

// ─── setVolume ────────────────────────────────────────────────────────────────

describe('audio — setVolume()', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.setVolume(0.5)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.soundSetVolume(', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  s.setVolume(0.5)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.soundSetVolume(');
  });
});

// ─── isPlaying ────────────────────────────────────────────────────────────────

describe('audio — isPlaying()', () => {
  test('compiles without error', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  dim playing',
      '  playing = s.isPlaying()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.soundIsPlaying(', () => {
    const result = transpileWithAudio([
      'function test()',
      '  dim s as audio("music.mp3")',
      '  dim playing',
      '  playing = s.isPlaying()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.soundIsPlaying(');
  });
});
