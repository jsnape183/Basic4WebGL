import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useFilesForProject = (projectId: string): IFile[] => {
  return useSelector((state: RootState) => {
    const order = state.files.fileOrder[projectId];
    if (!order || order.length === 0) {
      // Fallback for persisted state that predates fileOrder
      return Object.values(state.files.byId).filter(
        (file) => file.projectId === projectId
      ) as IFile[];
    }
    return order
      .map((id) => state.files.byId[id])
      .filter((file): file is IFile => Boolean(file));
  });
};
