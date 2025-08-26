// src/app/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./features/projects/projectsSlice";
import filesReducer from "./features/files/filesSlice";
import assetsReducer from "./features/assets/assetsSlice";
import uiReducer from "./features/ui/uiSlice";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const combinedRecduers = combineReducers({
  projects: projectsReducer,
  files: filesReducer,
  assets: assetsReducer,
  ui: uiReducer,
});

const persistedConfig = {
  key: "softBASIC",
  storage,
};

const localStorageRecuder = persistReducer(persistedConfig, combinedRecduers);

export const store = configureStore({
  reducer: localStorageRecuder,
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
