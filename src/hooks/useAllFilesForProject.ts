// src/hooks/useAllFilesForProject.ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

/**
 * Returns ALL files for a project across all folder levels.
 * Used by FileTree for operations that need the full file list
 * (descendant counting, delete handling, keyboard navigation).
 */
export const useAllFilesForProject = (projectId: string): IFile[] => {
  const filesById = useSelector((state: RootState) => state.files.byId);
  return useMemo(
    () => Object.values(filesById).filter((f) => f.projectId === projectId) as IFile[],
    [filesById, projectId]
  );
};
