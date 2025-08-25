// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IAsset {
  id: string;
  name: string;
  content: string;
  projectId: string;
}

export interface IAssetsState {
  byId: Record<string, IAsset>;
}

const initialState: IAssetsState = {
  byId: {},
};

const assetsSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    addAsset: (state: IAssetsState, action: PayloadAction<IAsset>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateAsset: (state: IAssetsState, action: PayloadAction<IAsset>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeAsset: (state: IAssetsState, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
  },
});

export const { addAsset, updateAsset, removeAsset } = assetsSlice.actions;
export default assetsSlice.reducer;
