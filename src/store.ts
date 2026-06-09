// src/app/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./features/projects/projectsSlice";
import filesReducer from "./features/files/filesSlice";
import assetsReducer from "./features/assets/assetsSlice";
import foldersReducer from "./features/folders/foldersSlice";
import packagesReducer from "./features/packages/packagesSlice";
import uiReducer from "./features/ui/uiSlice";
import sessionReducer from "./features/session/sessionSlice";
import {
  persistReducer,
  persistStore,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { IFilesState } from "./features/files/filesSlice";

// Always clear dirtyFileIds on rehydration — it's UI-only state that must
// not survive a page refresh. Using a transform (rather than a REHYDRATE
// reducer handler) avoids interfering with autoMergeLevel1's reference
// check, which would otherwise skip restoring byId.
const clearDirtyOnRehydrate = createTransform<IFilesState, IFilesState>(
  (inbound) => inbound, // nothing to do on the way into storage
  (outbound) => ({ ...outbound, dirtyFileIds: [] }), // clear on the way out
  { whitelist: ["files"] }
);

const persistedConfig = {
  key: "softBASIC",
  storage,
  blacklist: ["session", "packages"],
  transforms: [clearDirtyOnRehydrate],
};

const rootReducer = combineReducers({
  projects: projectsReducer,
  files: filesReducer,
  assets: assetsReducer,
  folders: foldersReducer,
  ui: uiReducer,
  session: sessionReducer,
  packages: packagesReducer,
});

const persistedReducer = persistReducer(persistedConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ["_persist"],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
