import { describe, test, expect } from 'vitest';
import { toMarkers } from '../../src/monacoHelpers/diagnostics';
import type { Diagnostic } from '../../src/lib/CompilerLib/compiler/types';

const fakeModel = { getLineMaxColumn: (line: number) => (line === 5 ? 40 : 1) };

describe('toMarkers', () => {
  test('maps a single diagnostic in the active file to one marker', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 5, col: 8, filename: 'Main' } },
    ];
    const markers = toMarkers(diagnostics, fakeModel as any, 'Main');
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      message: 'Undefined variable',
      startLineNumber: 5,
      startColumn: 8,
      endLineNumber: 5,
      endColumn: 40,
    });
  });

  test('returns no markers when the diagnostic has no loc', () => {
    const diagnostics: Diagnostic[] = [{ message: 'Something broke', severity: 'error' }];
    expect(toMarkers(diagnostics, fakeModel as any, 'Main')).toHaveLength(0);
  });

  test('returns no markers when the diagnostic belongs to a different file', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 5, col: 8, filename: 'Other' } },
    ];
    expect(toMarkers(diagnostics, fakeModel as any, 'Main')).toHaveLength(0);
  });

  test('returns no markers for an empty diagnostics array', () => {
    expect(toMarkers([], fakeModel as any, 'Main')).toHaveLength(0);
  });
});
