import { useEffect, useState } from 'react';
import { useProjectForBuild } from './useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { Diagnostic } from '../lib/CompilerLib/compiler/types';
import { SymbolSnapshotEntry } from '../lib/CompilerLib/symbols';

const DEBOUNCE_MS = 450;

export const useLiveAnalysis = (
  projectId: string
): { diagnostics: Diagnostic[]; symbols: SymbolSnapshotEntry[] } => {
  const buildProject = useProjectForBuild(projectId);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [symbols, setSymbols] = useState<SymbolSnapshotEntry[]>([]);

  useEffect(() => {
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
  }, [buildProject]);

  return { diagnostics, symbols };
};
