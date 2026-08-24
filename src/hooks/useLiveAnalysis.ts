import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useProjectForBuild } from './useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { Diagnostic } from '../lib/CompilerLib/compiler/types';
import { SymbolSnapshotEntry } from '../lib/CompilerLib/symbols';
import { RootState } from '../store';

const DEBOUNCE_MS = 450;

export const useLiveAnalysis = (
  projectId: string
): { diagnostics: Diagnostic[]; symbols: SymbolSnapshotEntry[] } => {
  const buildProject = useProjectForBuild(projectId);
  // A full project transpile is expensive enough (~90ms on the main thread,
  // confirmed via a Chrome performance trace) that firing it every
  // DEBOUNCE_MS while the game preview iframe is running visibly stalls the
  // running game -- the preview shares the same single JS thread as the
  // rest of the app. Diagnostics/symbols only matter while editing, not
  // while the player is just watching the game run, so skip the compile
  // entirely during a Run session rather than paying its cost for nothing.
  const isRunning = useSelector((state: RootState) => state.session.isRunning);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [symbols, setSymbols] = useState<SymbolSnapshotEntry[]>([]);

  useEffect(() => {
    if (isRunning) return;
    const timer = setTimeout(() => {
      if (buildProject.dependencyError) {
        setDiagnostics([]);
        return; // symbols: leave as last-known-good
      }
      const result = Basic4WebGL.transpile(buildProject);
      setDiagnostics(result.diagnostics);
      if (result.diagnostics.length === 0 && result.symbols) {
        setSymbols(result.symbols); // only advance the snapshot on a clean compile
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [buildProject, isRunning]);

  return { diagnostics, symbols };
};
