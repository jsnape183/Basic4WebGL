import { describe, test, expect } from 'vitest';
import { extractTagsFromStmJson } from '../../../../src/components/TileMapEditor/stmTags';

describe('extractTagsFromStmJson', () => {
  test('returns the stored tags field as-is', () => {
    const raw = JSON.stringify({ tags: ['spawn', 'ally'], layers: {} });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn', 'ally']);
  });

  test('falls back to tags actually used by markers when there is no tags field', () => {
    const raw = JSON.stringify({
      layers: { spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'legacy' }] } },
    });
    expect(extractTagsFromStmJson(raw)).toEqual(['legacy']);
  });

  test('unions stored and used tags without duplicates', () => {
    const raw = JSON.stringify({
      tags: ['spawn'],
      layers: { spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }, { row: 0, col: 1, tag: 'exit' }] } },
    });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn', 'exit']);
  });

  test('malformed JSON returns an empty list, never throws', () => {
    expect(extractTagsFromStmJson('{not json')).toEqual([]);
  });

  test('a non-string entry in tags is dropped', () => {
    const raw = JSON.stringify({ tags: ['spawn', 42, null], layers: {} });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn']);
  });

  test('empty or missing raw text returns an empty list', () => {
    expect(extractTagsFromStmJson('')).toEqual([]);
  });
});
