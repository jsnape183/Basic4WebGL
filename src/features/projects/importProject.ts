import { v4 as uuidv4 } from 'uuid';
import { AppDispatch } from '../../store';
import { addProject } from './projectsSlice';
import { addFolder } from '../folders/foldersSlice';
import { addFile } from '../files/filesSlice';
import { addAsset } from '../assets/assetsSlice';
import { ProjectExportJson } from './exportProject';

export const importProject =
  (json: ProjectExportJson, options?: { tags?: string[] }) =>
  (dispatch: AppDispatch): string => {
    const newProjectId = uuidv4();

    const folderIdMap: Record<string, string> = {};
    json.folders.forEach((f) => { folderIdMap[f.id] = uuidv4(); });

    const fileIdMap: Record<string, string> = {};
    json.files.forEach((f) => { fileIdMap[f.id] = uuidv4(); });

    const assetIdMap: Record<string, string> = {};
    json.assets.forEach((a) => { assetIdMap[a.id] = uuidv4(); });

    dispatch(addProject({
      id: newProjectId,
      name: json.project.name,
      tags: options?.tags,
      packageIds: ['softcore', 'softgfx'],
    }));

    json.folders.forEach((f) => {
      dispatch(addFolder({
        id: folderIdMap[f.id],
        name: f.name,
        projectId: newProjectId,
        parentId: f.parentId ? (folderIdMap[f.parentId] ?? null) : null,
        section: f.section,
      }));
    });

    // Dispatch files in fileOrder order so bucket order is preserved
    const dispatchedFileIds = new Set<string>();
    Object.values(json.fileOrder).forEach((orderedIds) => {
      orderedIds.forEach((oldId) => {
        const file = json.files.find((f) => f.id === oldId);
        if (!file) return;
        dispatch(addFile({
          id: fileIdMap[oldId],
          name: file.name,
          source: file.source,
          projectId: newProjectId,
          folderId: file.folderId ? (folderIdMap[file.folderId] ?? null) : null,
          fullName: file.fullName,
        }));
        dispatchedFileIds.add(oldId);
      });
    });
    // Catch any files absent from fileOrder (defensive)
    json.files.forEach((file) => {
      if (dispatchedFileIds.has(file.id)) return;
      dispatch(addFile({
        id: fileIdMap[file.id],
        name: file.name,
        source: file.source,
        projectId: newProjectId,
        folderId: file.folderId ? (folderIdMap[file.folderId] ?? null) : null,
        fullName: file.fullName,
      }));
    });

    // Dispatch assets in assetOrder order
    const dispatchedAssetIds = new Set<string>();
    Object.values(json.assetOrder).forEach((orderedIds) => {
      orderedIds.forEach((oldId) => {
        const asset = json.assets.find((a) => a.id === oldId);
        if (!asset) return;
        dispatch(addAsset({
          id: assetIdMap[oldId],
          name: asset.name,
          content: asset.content,
          projectId: newProjectId,
          folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
          fullName: asset.fullName,
        }));
        dispatchedAssetIds.add(oldId);
      });
    });
    json.assets.forEach((asset) => {
      if (dispatchedAssetIds.has(asset.id)) return;
      dispatch(addAsset({
        id: assetIdMap[asset.id],
        name: asset.name,
        content: asset.content,
        projectId: newProjectId,
        folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
        fullName: asset.fullName,
      }));
    });

    return newProjectId;
  };
