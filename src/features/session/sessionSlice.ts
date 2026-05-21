// src/features/session/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LogItem } from '../../Types/LogItem';

export interface SessionState {
  logs: LogItem[];
  transpiled: string;
  isRunning: boolean;
}

const initialState: SessionState = {
  logs: [],
  transpiled: '',
  isRunning: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<LogItem>) => {
      state.logs.push(action.payload);
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setTranspiled: (state, action: PayloadAction<string>) => {
      state.transpiled = action.payload;
    },
    setIsRunning: (state, action: PayloadAction<boolean>) => {
      state.isRunning = action.payload;
    },
  },
});

export const { addLog, clearLogs, setTranspiled, setIsRunning } = sessionSlice.actions;
export default sessionSlice.reducer;
