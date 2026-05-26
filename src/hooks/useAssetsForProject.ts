// src/hooks/useAssetsForProject.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IAsset } from '../features/assets/assetsSlice';

export const useAssetsForProject = (projectId: string, folderId: string | null = null): IAsset[] => {
  return useSelector((state: RootState) => {
    const key = `${projectId}:${folderId ?? 'root'}`;
    const order = state.assets.assetOrder?.[key];

    if (!order || order.length === 0) {
      // Fallback: unordered enumeration (legacy persisted state)
      return Object.values(state.assets.byId).filter(
        (a) => a.projectId === projectId && (a.folderId ?? null) === folderId
      ) as IAsset[];
    }

    return order
      .map((id) => state.assets.byId[id])
      .filter((a): a is IAsset => Boolean(a));
  });
};
