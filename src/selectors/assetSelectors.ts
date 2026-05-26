import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { IAsset } from '../features/assets/assetsSlice';

export const makeSelectAssetsByProject = (projectId: string) =>
  createSelector(
    (state: RootState) => state.assets.byId,
    (byId) => Object.values(byId).filter((a) => a.projectId === projectId) as IAsset[]
  );
