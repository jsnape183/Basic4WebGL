// src/features/assets/assetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IAsset {
  id: string;
  name: string;
  content: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
}

export interface IAssetsState {
  byId: Record<string, IAsset>;
}

const initialState: IAssetsState = {
  byId: {},
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addAsset: (
      state,
      action: PayloadAction<Omit<IAsset, 'folderId' | 'fullName'> & Partial<Pick<IAsset, 'folderId' | 'fullName'>>>
    ) => {
      const asset: IAsset = {
        folderId: null,
        fullName: action.payload.name,
        ...action.payload,
      };
      state.byId[asset.id] = asset;
    },
    updateAsset: (state, action: PayloadAction<IAsset>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
    setAssetFolder: (
      state,
      action: PayloadAction<{ assetId: string; folderId: string | null; fullName: string }>
    ) => {
      const asset = state.byId[action.payload.assetId];
      if (!asset) return;
      asset.folderId = action.payload.folderId;
      asset.fullName = action.payload.fullName;
    },
    batchSetAssetFolder: (
      state,
      action: PayloadAction<{ id: string; folderId: string | null; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, folderId, fullName }) => {
        const asset = state.byId[id];
        if (!asset) return;
        asset.folderId = folderId;
        asset.fullName = fullName;
      });
    },
    batchSetAssetFullNames: (
      state,
      action: PayloadAction<{ id: string; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, fullName }) => {
        const asset = state.byId[id];
        if (!asset) return;
        asset.fullName = fullName;
      });
    },
  },
});

export const {
  addAsset,
  updateAsset,
  removeAsset,
  setAssetFolder,
  batchSetAssetFolder,
  batchSetAssetFullNames,
} = assetsSlice.actions;
export default assetsSlice.reducer;
