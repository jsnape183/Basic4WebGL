import { AppDispatch, RootState } from '../../store';
import { Project } from './projectsSlice';
import { IFile } from '../files/filesSlice';
import { IAsset } from '../assets/assetsSlice';
import { IFolder } from '../folders/foldersSlice';

export interface ProjectExportJson {
  version: 1;
  project: { name: string };
  folders: Array<{ id: string; name: string; parentId: string | null; section: 'files' | 'assets' }>;
  files: Array<{ id: string; name: string; source: string; folderId: string | null; fullName: string }>;
  assets: Array<{ id: string; name: string; content: string; folderId: string | null; fullName: string }>;
  fileOrder: Record<string, string[]>;
  assetOrder: Record<string, string[]>;
}

type ExportableState = {
  projects: { items: Project[] };
  folders: { items: IFolder[] };
  files: { byId: Record<string, IFile>; fileOrder: Record<string, string[]> };
  assets: { byId: Record<string, IAsset>; assetOrder: Record<string, string[]> };
};

export function buildExportJson(projectId: string, state: ExportableState): ProjectExportJson {
  const project = state.projects.items.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const folders = state.folders.items
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, parentId, section }) => ({ id, name, parentId, section }));

  const files = Object.values(state.files.byId)
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, source, folderId, fullName }) => ({ id, name, source, folderId, fullName }));

  const assets = Object.values(state.assets.byId)
    .filter((a) => a.projectId === projectId)
    .map(({ id, name, content, folderId, fullName }) => ({ id, name, content, folderId, fullName }));

  const fileOrder: Record<string, string[]> = {};
  Object.entries(state.files.fileOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) {
      fileOrder[key.slice(projectId.length)] = ids;
    }
  });

  const assetOrder: Record<string, string[]> = {};
  Object.entries(state.assets.assetOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) {
      assetOrder[key.slice(projectId.length)] = ids;
    }
  });

  return { version: 1, project: { name: project.name }, folders, files, assets, fileOrder, assetOrder };
}

export function triggerDownload(json: ProjectExportJson, filename: string): void {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportProject =
  (projectId: string) => (_dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const project = state.projects.items.find((p) => p.id === projectId);
    if (!project) return;
    const json = buildExportJson(projectId, state);
    triggerDownload(json, `${project.name}.b4wgl.json`);
  };
