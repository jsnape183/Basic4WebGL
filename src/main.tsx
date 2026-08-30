import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store, persistor } from "./store";
import App from "./App.tsx";
import "./index.css";
import { PersistGate } from "redux-persist/integration/react";
import * as Sentry from "@sentry/react";

// Assets and persisted state moved from localStorage to IndexedDB (see
// docs/superpowers/plans/2026-08-30-indexeddb-asset-storage.md). There is no
// migration — the pre-move key is simply dropped so it can't shadow anything
// or waste quota.
try {
  window.localStorage.removeItem("persist:softBASIC");
} catch {
  /* ignore — private browsing / storage disabled */
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  normalizeDepth: 6,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
