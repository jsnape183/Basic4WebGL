import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
  section: 'files' | 'assets';
}

export interface IFoldersState {
  items: IFolder[];
}

const initialState: IFoldersState = { items: [] };

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    addFolder: (state, action: PayloadAction<IFolder>) => {
      state.items.push(action.payload);
    },
    removeFolder: (state, action: PayloadAction<string>) => {
      const folderId = action.payload;
      const folder = state.items.find((f) => f.id === folderId);
      if (!folder) return;
      // Re-parent direct children to this folder's parent
      state.items.forEach((f) => {
        if (f.parentId === folderId) {
          f.parentId = folder.parentId;
        }
      });
      state.items = state.items.filter((f) => f.id !== folderId);
    },
    renameFolder: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const folder = state.items.find((f) => f.id === action.payload.folderId);
      if (!folder) return;
      folder.name = action.payload.name;
    },
    moveFolder: (state, action: PayloadAction<{ folderId: string; parentId: string | null }>) => {
      const folder = state.items.find((f) => f.id === action.payload.folderId);
      if (!folder) return;
      folder.parentId = action.payload.parentId;
    },
  },
});

export const { addFolder, removeFolder, renameFolder, moveFolder } = foldersSlice.actions;
export default foldersSlice.reducer;
