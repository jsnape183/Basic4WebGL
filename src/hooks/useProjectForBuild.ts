import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useFilesForProject } from './useFilesForProject';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];

export const useProjectForBuild = (projectId: string): BuildProject => {
  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? DEFAULT_PACKAGE_IDS;
  });

  const packagesById = useSelector((state: RootState) => state.packages.byId);

  const files = useFilesForProject(projectId);

  const lib: ProjectFile[] = packageIds.flatMap((pkgId) => {
    const pkg = packagesById[pkgId];
    if (!pkg) return [];
    return pkg.moduleNames
      .map((name) => ({ name, source: packageModules[name] ?? '' }))
      .filter((m) => m.source !== '');
  });

  // Map IFile → ProjectFile, using fullName (folder path) as the filename for
  // error reporting (e.g. "ui/Menu.bas:5:3"). Falls back to name for legacy
  // persisted files that predate the fullName field.
  const projectFiles: ProjectFile[] = files.map((f) => ({
    name: f.fullName ?? f.name,
    source: f.source,
  }));

  return { lib, files: projectFiles };
};
