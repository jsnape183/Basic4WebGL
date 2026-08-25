import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useAllFilesForProject } from './useAllFilesForProject';
import { sortByDependencies } from '../lib/Basic4WebGL/sortByDependencies';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
  dependencyError?: string;
};

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];

export const useProjectForBuild = (projectId: string): BuildProject => {
  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? DEFAULT_PACKAGE_IDS;
  });

  const packagesById = useSelector((state: RootState) => state.packages.byId);

  const files = useAllFilesForProject(projectId);

  const packageIdsKey = packageIds.join(',');
  const filesKey = files.map((f) => `${f.id}:${f.name}:${f.source}`).join(' ');

  return useMemo(() => {
    const lib: ProjectFile[] = packageIds.flatMap((pkgId) => {
      const pkg = packagesById[pkgId];
      if (!pkg) return [];
      return pkg.moduleNames
        .map((name) => ({ name, source: packageModules[name] ?? '' }))
        .filter((m) => m.source !== '');
    });

    // Map IFile → ProjectFile. Use plain name (not fullName) so the lexer
    // derives the correct class name — filenames are unique across the project
    // regardless of folder, so there is no ambiguity in error reporting.
    const projectFiles: ProjectFile[] = files.map((f) => ({
      name: f.name,
      source: f.source,
    }));

    const { files: sortedFiles, error: dependencyError } = sortByDependencies(projectFiles);

    return { lib, files: sortedFiles, dependencyError };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageIdsKey, filesKey, packagesById]);
};
