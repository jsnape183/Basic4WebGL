// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
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

function orderKey(projectId: string, folderId: string | null): string {
  return `${projectId}:${folderId ?? 'root'}`;
}

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<Omit<IFile, 'folderId' | 'fullName'> & Partial<Pick<IFile, 'folderId' | 'fullName'>>>) => {
      const file: IFile = {
        folderId: null,
        fullName: action.payload.name,
        ...action.payload,
      };
      state.byId[file.id] = file;
      const key = orderKey(file.projectId, file.folderId ?? null);
      if (!state.fileOrder[key]) {
        state.fileOrder[key] = [];
      }
      state.fileOrder[key].push(file.id);
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
        const key = orderKey(file.projectId, file.folderId ?? null);
        const order = state.fileOrder[key];
        if (order) {
          state.fileOrder[key] = order.filter((id) => id !== action.payload);
        }
      }
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
    setFileFolder: (
      state,
      action: PayloadAction<{ fileId: string; folderId: string | null; fullName: string }>
    ) => {
      const { fileId, folderId, fullName } = action.payload;
      const file = state.byId[fileId];
      if (!file) return;
      // Remove from old order bucket
      const oldKey = orderKey(file.projectId, file.folderId ?? null);
      if (state.fileOrder[oldKey]) {
        state.fileOrder[oldKey] = state.fileOrder[oldKey].filter((id) => id !== fileId);
      }
      // Add to new order bucket
      const newKey = orderKey(file.projectId, folderId ?? null);
      if (!state.fileOrder[newKey]) state.fileOrder[newKey] = [];
      state.fileOrder[newKey].push(fileId);
      // Update record
      file.folderId = folderId;
      file.fullName = fullName;
    },
    batchSetFileFolder: (
      state,
      action: PayloadAction<{ id: string; folderId: string | null; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, folderId, fullName }) => {
        const file = state.byId[id];
        if (!file) return;
        const oldKey = orderKey(file.projectId, file.folderId ?? null);
        if (state.fileOrder[oldKey]) {
          state.fileOrder[oldKey] = state.fileOrder[oldKey].filter((fid) => fid !== id);
        }
        const newKey = orderKey(file.projectId, folderId ?? null);
        if (!state.fileOrder[newKey]) state.fileOrder[newKey] = [];
        state.fileOrder[newKey].push(id);
        file.folderId = folderId;
        file.fullName = fullName;
      });
    },
    batchSetFileFullNames: (
      state,
      action: PayloadAction<{ id: string; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, fullName }) => {
        const file = state.byId[id];
        if (!file) return;
        file.fullName = fullName;
      });
    },
  },
});

export const {
  addFile,
  updateFile,
  removeFile,
  clearAllDirty,
  setFileFolder,
  batchSetFileFolder,
  batchSetFileFullNames,
} = filesSlice.actions;
export default filesSlice.reducer;
