// src/features/ui/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LogItem } from "../../Types/LogItem";

export interface UIState {
  selectedFileByProject: Record<string, string>;
  logs: Array<LogItem>;
  transpiled: string;
}

const initialState: UIState = {
  selectedFileByProject: {},
  logs: [],
  transpiled: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectFile: (
      state: UIState,
      action: PayloadAction<{ projectId: string; fileId: string }>
    ) => {
      const { projectId, fileId } = action.payload;
      state.selectedFileByProject[projectId] = fileId;
    },
    addLog: (state: UIState, action: PayloadAction<LogItem>) => {
      state.logs.push(action.payload);
    },
    clearLogs: (state: UIState) => {
      state.logs = [];
    },
    setTranspiled: (state: UIState, action: PayloadAction<string>) => {
      state.transpiled = action.payload;
    },
  },
});

export const { selectFile, addLog, clearLogs, setTranspiled } = uiSlice.actions;
export default uiSlice.reducer;
