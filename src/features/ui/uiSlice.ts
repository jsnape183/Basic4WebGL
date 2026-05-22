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
    clearProjectSelection: (state: UIState, action: PayloadAction<string>) => {
      delete state.selectedFileByProject[action.payload];
    },
  },
});

export const { selectFile, clearProjectSelection } = uiSlice.actions;
export default uiSlice.reducer;
