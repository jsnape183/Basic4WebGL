// src/hooks/useFilesForProject.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useFilesForProject = (projectId: string, folderId: string | null = null): IFile[] => {
  return useSelector((state: RootState) => {
    const scopedKey = `${projectId}:${folderId ?? 'root'}`;
    const legacyKey = projectId; // pre-migration persisted state

    let order = state.files.fileOrder[scopedKey];

    if (!order || order.length === 0) {
      if (folderId === null) {
        // Only apply legacy fallback at root — the pre-migration key had all files at root
        order = state.files.fileOrder[legacyKey];
      }
    }

    if (!order || order.length === 0) {
      // Final fallback: unordered enumeration (very old persisted state)
      return Object.values(state.files.byId).filter(
        (file) => file.projectId === projectId && (file.folderId ?? null) === folderId
      ) as IFile[];
    }

    return order
      .map((id) => state.files.byId[id])
      .filter((file): file is IFile => Boolean(file));
  });
};
