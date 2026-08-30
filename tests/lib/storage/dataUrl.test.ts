// @vitest-environment jsdom
import { describe, test, expect } from 'vitest';
import { dataUrlToBlob, blobToDataUrl } from '../../../src/lib/storage/dataUrl';

describe('dataUrlToBlob', () => {
  test('decodes MIME type and bytes from a base64 data URL', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,aGk=');
    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('hi');
  });
  test('handles an empty payload', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,');
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(0);
  });
  test('falls back to application/octet-stream when MIME is absent', () => {
    const blob = dataUrlToBlob('data:;base64,aGk=');
    expect(blob.type).toBe('application/octet-stream');
  });
});

describe('blobToDataUrl', () => {
  test('produces a base64 data URL that round-trips through dataUrlToBlob', async () => {
    const original = new Blob([new Uint8Array([0, 1, 2, 253, 254, 255])], { type: 'image/png' });
    const url = await blobToDataUrl(original);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const back = dataUrlToBlob(url);
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 253, 254, 255]));
    expect(back.type).toBe('image/png');
  });
  test('round-trips non-ASCII text content', async () => {
    const original = new Blob(['grüße 日本語 😀'], { type: 'text/plain' });
    const back = dataUrlToBlob(await blobToDataUrl(original));
    expect(await back.text()).toBe('grüße 日本語 😀');
  });
});
