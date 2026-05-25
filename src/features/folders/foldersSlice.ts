import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
}

export interface IFoldersState {
  items: IFolder[];
}

const initialState: IFoldersState = { items: [] };

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {},
});

export default foldersSlice.reducer;
