// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  selectedFileId: string;
}

const initialState: IFilesState = {
  byId: {},
  selectedFileId: "",
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    addFile: (state: IFilesState, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateFile: (state: IFilesState, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeFile: (state: IFilesState, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
  },
});

export const { addFile, updateFile, removeFile } = filesSlice.actions;
export default filesSlice.reducer;
