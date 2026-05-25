// src/features/folders/folderThunks.ts
import { getFullName } from '../../selectors/getFullName';
import { renameFolder, moveFolder, removeFolder, IFolder } from './foldersSlice';
import { IFile, batchSetFileFolder, batchSetFileFullNames } from '../files/filesSlice';
import { IAsset, batchSetAssetFolder, batchSetAssetFullNames } from '../assets/assetsSlice';

interface ThunkState {
  folders: { items: IFolder[] };
  files: { byId: Record<string, IFile> };
  assets: { byId: Record<string, IAsset> };
}

type ThunkDispatch = (action: unknown) => void;

/** Returns the IDs of all folders in the subtree rooted at rootId (not including rootId itself). */
function getSubtreeFolderIds(rootId: string, folders: IFolder[]): string[] {
  const result: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = folders.filter((f) => f.parentId === current);
    children.forEach((c) => { result.push(c.id); queue.push(c.id); });
  }
  return result;
}

export const renameFolderWithCascade =
  ({ folderId, name }: { folderId: string; name: string }) =>
  (dispatch: ThunkDispatch, getState: () => ThunkState) => {
    dispatch(renameFolder({ folderId, name }));
    // getState() now has the updated folder name
    const { folders, files, assets } = getState();
    const allFolders = folders.items;
    const subtreeIds = getSubtreeFolderIds(folderId, allFolders);
    const affectedFolderIds = new Set([folderId, ...subtreeIds]);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId !== null && affectedFolderIds.has(f.folderId!))
      .map((f) => ({ id: f.id, fullName: getFullName(f.name, f.folderId, allFolders) }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId !== null && affectedFolderIds.has(a.folderId!))
      .map((a) => ({ id: a.id, fullName: getFullName(a.name, a.folderId, allFolders) }));

    if (fileUpdates.length) dispatch(batchSetFileFullNames(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFullNames(assetUpdates));
  };

export const moveFolderWithCascade =
  ({ folderId, parentId }: { folderId: string; parentId: string | null }) =>
  (dispatch: ThunkDispatch, getState: () => ThunkState) => {
    dispatch(moveFolder({ folderId, parentId }));
    const { folders, files, assets } = getState();
    const allFolders = folders.items;
    const subtreeIds = getSubtreeFolderIds(folderId, allFolders);
    const affectedFolderIds = new Set([folderId, ...subtreeIds]);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId !== null && affectedFolderIds.has(f.folderId!))
      .map((f) => ({ id: f.id, fullName: getFullName(f.name, f.folderId, allFolders) }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId !== null && affectedFolderIds.has(a.folderId!))
      .map((a) => ({ id: a.id, fullName: getFullName(a.name, a.folderId, allFolders) }));

    if (fileUpdates.length) dispatch(batchSetFileFullNames(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFullNames(assetUpdates));
  };

export const removeFolderWithCascade =
  ({ folderId }: { folderId: string }) =>
  (dispatch: ThunkDispatch, getState: () => ThunkState) => {
    const { folders, files, assets } = getState();
    const folder = folders.items.find((f) => f.id === folderId);
    if (!folder) return;

    const newFolderId = folder.parentId; // null = root
    const allFoldersAfterRemove = folders.items.filter((f) => f.id !== folderId);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId === folderId)
      .map((f) => ({
        id: f.id,
        folderId: newFolderId,
        fullName: getFullName(f.name, newFolderId, allFoldersAfterRemove),
      }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId === folderId)
      .map((a) => ({
        id: a.id,
        folderId: newFolderId,
        fullName: getFullName(a.name, newFolderId, allFoldersAfterRemove),
      }));

    // removeFolder (in foldersSlice) re-parents child folders automatically
    dispatch(removeFolder(folderId));
    if (fileUpdates.length) dispatch(batchSetFileFolder(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFolder(assetUpdates));
  };
