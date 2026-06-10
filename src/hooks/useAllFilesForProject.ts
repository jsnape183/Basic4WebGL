// src/hooks/useAllFilesForProject.ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

/**
 * Returns ALL files for a project across all folder levels, sorted by fileOrder
 * within each folder bucket so drag-and-drop index computations stay consistent
 * with the persisted order.
 */
export const useAllFilesForProject = (projectId: string): IFile[] => {
  const filesById = useSelector((state: RootState) => state.files.byId);
  const fileOrder = useSelector((state: RootState) => state.files.fileOrder);
  return useMemo(() => {
    const allFiles = Object.values(filesById).filter((f) => f.projectId === projectId) as IFile[];
    return allFiles.sort((a, b) => {
      const aKey = `${projectId}:${a.folderId ?? 'root'}`;
      const bKey = `${projectId}:${b.folderId ?? 'root'}`;
      if (aKey !== bKey) return 0;
      const order = fileOrder[aKey] ?? [];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  }, [filesById, fileOrder, projectId]);
};
