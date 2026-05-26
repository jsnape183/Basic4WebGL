// src/features/assets/assetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reorder } from '../../utils/reorder';

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
  assetOrder: Record<string, string[]>;  // key: "${projectId}:${folderId ?? 'root'}"
}

const initialState: IAssetsState = {
  byId: {},
  assetOrder: {},
};

function orderKey(projectId: string, folderId: string | null): string {
  return `${projectId}:${folderId ?? 'root'}`;
}

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
      const key = orderKey(asset.projectId, asset.folderId ?? null);
      if (!state.assetOrder[key]) {
        state.assetOrder[key] = [];
      }
      state.assetOrder[key].push(asset.id);
    },
    updateAsset: (state, action: PayloadAction<IAsset>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      const asset = state.byId[action.payload];
      if (asset) {
        const key = orderKey(asset.projectId, asset.folderId ?? null);
        const order = state.assetOrder[key];
        if (order) {
          state.assetOrder[key] = order.filter((id) => id !== action.payload);
        }
      }
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
    reorderAssets: (
      state,
      action: PayloadAction<{ orderKey: string; fromIndex: number; toIndex: number }>
    ) => {
      const { orderKey: key, fromIndex, toIndex } = action.payload;
      const order = state.assetOrder[key];
      if (!order) return;
      state.assetOrder[key] = reorder(order, fromIndex, toIndex);
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
  reorderAssets,
} = assetsSlice.actions;
export default assetsSlice.reducer;
