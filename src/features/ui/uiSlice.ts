// src/features/ui/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  selectedFileByProject: Record<string, string>;
}

const initialState: UIState = {
  selectedFileByProject: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectFile: (
      state: UIState,
      action: PayloadAction<{ projectId: string; fileId: string }>
    ) => {
      const { projectId, fileId } = action.payload;
      state.selectedFileByProject[projectId] = fileId;
    },
  },
});

export const { selectFile } = uiSlice.actions;
export default uiSlice.reducer;
