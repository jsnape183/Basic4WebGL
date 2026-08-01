// src/monacoHelpers/diagnostics.ts
import type { Monaco } from '@monaco-editor/react';
import type { Diagnostic } from '../lib/CompilerLib/compiler/types';

/** Minimal shape of a Monaco text model this module actually needs. */
type MarkerModel = {
  getLineMaxColumn(lineNumber: number): number;
};

/** Shape-compatible with monaco.editor.IMarkerData, without importing monaco-editor. */
export type SoftBasicMarker = {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

// monaco.MarkerSeverity.Error is 8 (confirmed against monaco-editor's
// editor.api.d.ts: Hint = 1, Info = 2, Warning = 4, Error = 8). Kept as a
// local fallback so this module — like completions.ts/hover.ts/signatures.ts —
// never has to import monaco-editor itself. A caller holding a live `monaco`
// instance (e.g. Editor/index.tsx) can pass it in to use the real enum value
// instead of relying on this constant.
const DEFAULT_ERROR_SEVERITY = 8;

/**
 * Maps compiler diagnostics belonging to the active file into Monaco marker
 * data. Diagnostics without a `loc`, or whose `loc.filename` doesn't match
 * `activeFilename`, are dropped. Since `SourceLocation` is a point rather
 * than a range, the marker's end is synthesized as the end of that line.
 */
export function toMarkers(
  diagnostics: Diagnostic[],
  model: MarkerModel,
  activeFilename: string,
  monaco?: Monaco
): SoftBasicMarker[] {
  const severity = monaco?.MarkerSeverity.Error ?? DEFAULT_ERROR_SEVERITY;

  return diagnostics
    .filter((d) => !!d.loc && d.loc.filename === activeFilename)
    .map((d) => {
      const loc = d.loc!;
      return {
        severity,
        message: d.message,
        startLineNumber: loc.line,
        startColumn: loc.col,
        endLineNumber: loc.line,
        endColumn: model.getLineMaxColumn(loc.line),
      };
    });
}
