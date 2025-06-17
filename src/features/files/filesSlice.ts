// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface File {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface FilesState {
  byId: Record<string, File>;
  selectedFileId: string;
}

const initialState: FilesState = {
  byId: {},
  selectedFileId: "",
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    addFile: (state: FilesState, action: PayloadAction<File>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateFile: (state: FilesState, action: PayloadAction<File>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeFile: (state: FilesState, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
  },
});

export const { addFile, updateFile, removeFile } = filesSlice.actions;
export default filesSlice.reducer;
