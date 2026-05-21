// src/app/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./features/projects/projectsSlice";
import filesReducer from "./features/files/filesSlice";
import assetsReducer from "./features/assets/assetsSlice";
import uiReducer from "./features/ui/uiSlice";
import sessionReducer from "./features/session/sessionSlice";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistedConfig = {
  key: "softBASIC",
  storage,
  blacklist: ["session"],
};

const rootReducer = combineReducers({
  projects: projectsReducer,
  files: filesReducer,
  assets: assetsReducer,
  ui: uiReducer,
  session: sessionReducer,
});

const persistedReducer = persistReducer(persistedConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
