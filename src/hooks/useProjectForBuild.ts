import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useFilesForProject } from './useFilesForProject';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<IFile>;
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

  return { lib, files };
};
