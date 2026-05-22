import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
}

const initialState: IFilesState = {
  byId: {},
  dirtyFileIds: [],
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      // Always replace the array so React sees a new reference and re-triggers useEffect
      state.dirtyFileIds = [
        ...state.dirtyFileIds.filter((id) => id !== action.payload.id),
        action.payload.id,
      ];
    },
    removeFile: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
  },
});

export const { addFile, updateFile, removeFile, clearAllDirty } = filesSlice.actions;
export default filesSlice.reducer;
