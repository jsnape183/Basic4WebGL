import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reorder } from '../../utils/reorder';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
  fileOrder: Record<string, string[]>;
}

const initialState: IFilesState = {
  byId: {},
  dirtyFileIds: [],
  fileOrder: {},
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      const { projectId, id } = action.payload;
      if (!state.fileOrder[projectId]) {
        state.fileOrder[projectId] = [];
      }
      state.fileOrder[projectId].push(id);
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
      const file = state.byId[action.payload];
      if (file) {
        const order = state.fileOrder[file.projectId];
        if (order) {
          state.fileOrder[file.projectId] = order.filter((id) => id !== action.payload);
        }
      }
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
    reorderFiles: (
      state,
      action: PayloadAction<{ projectId: string; fromIndex: number; toIndex: number }>
    ) => {
      const { projectId, fromIndex, toIndex } = action.payload;
      const order = state.fileOrder[projectId];
      if (!order) return;
      state.fileOrder[projectId] = reorder(order, fromIndex, toIndex);
    },
  },
});

export const { addFile, updateFile, removeFile, clearAllDirty, reorderFiles } = filesSlice.actions;
export default filesSlice.reducer;
