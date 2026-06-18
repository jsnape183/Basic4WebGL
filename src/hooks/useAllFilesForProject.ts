// src/hooks/useAllFilesForProject.ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useAllFilesForProject = (projectId: string): IFile[] => {
  const filesById = useSelector((state: RootState) => state.files.byId);
  return useMemo(() => {
    const allFiles = Object.values(filesById).filter((f) => f.projectId === projectId) as IFile[];
    return allFiles.sort((a, b) => a.name.localeCompare(b.name));
  }, [filesById, projectId]);
};
