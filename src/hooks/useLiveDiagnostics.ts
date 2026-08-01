import { useEffect, useState } from 'react';
import { useProjectForBuild } from './useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { Diagnostic } from '../lib/CompilerLib/compiler/types';

const DEBOUNCE_MS = 450;

export const useLiveDiagnostics = (projectId: string): Diagnostic[] => {
  const buildProject = useProjectForBuild(projectId);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buildProject.dependencyError) {
        setDiagnostics([]);
        return;
      }
      const result = Basic4WebGL.transpile(buildProject);
      setDiagnostics(result.diagnostics);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [buildProject]);

  return diagnostics;
};
