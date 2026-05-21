# UI Architectural Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 critical bugs and restructure the React UI into clear, testable architectural layers without changing any visible behaviour.

**Architecture:** Session-volatile state (`logs`, `transpiled`, `isRunning`) moves to a non-persisted `sessionSlice`; compiler logic moves to a `useCompiler` hook; the iframe message listener moves to a `useRunnerMessages` hook; `EditPage` becomes a thin coordinator that renders a new `ProjectShell` layout wrapper. All other persisted state stays where it is.

**Tech Stack:** React 19, Redux Toolkit, redux-persist, React Router 7, Monaco Editor, Tailwind CSS, Vitest, @testing-library/react (added in Task 1)

**Parallelisation note:** Tasks 1 and 2 are independent. Tasks 3, 4, 5 are independent of each other (but run after 2 to avoid merge conflicts). Tasks 6 and 7 both depend on Task 3. Tasks 8 and 9 are independent of each other.

---

## File Map

### New files
- `src/features/session/sessionSlice.ts` — non-persisted slice: logs, transpiled, isRunning
- `src/hooks/useCompiler.ts` — run/stop/isRunning logic extracted from EditPage
- `src/hooks/useRunnerMessages.ts` — window.message listener extracted from Console
- `src/components/ProjectShell/index.tsx` — 3-pane layout shell (header/sidebar/editor/preview/footer)
- `src/components/ErrorBoundary/index.tsx` — React class-based error boundary
- `tests/ui/features/session/sessionSlice.test.ts` — session slice unit tests
- `tests/ui/hooks/useCompiler.test.ts` — compiler hook unit tests

### Modified files
- `vite.config.ts` — add `.tsx` to test include glob, configure jsdom per-file
- `src/store.ts` — add session reducer with persist blacklist
- `src/features/ui/uiSlice.ts` — remove logs/transpiled/setTranspiled/addLog/clearLogs
- `src/features/files/filesSlice.ts` — remove selectedFileId from state
- `src/components/Preview/Console.tsx` — remove message listener + throw; become pure display
- `src/components/Preview/index.tsx` — call useRunnerMessages hook
- `src/components/FileTree/index.tsx` — fix render-time dispatch; read from ui.selectedFileByProject
- `src/pages/EditPage.tsx` — use useCompiler hook; render ProjectShell; remove local isRunning state
- `src/components/Projects/index.tsx` — use deleteProjectAndFiles thunk instead of removeProject
- `src/components/TreePanel/AssetTree/index.tsx` — remove useLocalStorage
- `src/components/Editor/index.tsx` — use IFile instead of local SBFileProps type

### Deleted files
- `src/Types/state.ts` — dead file with broken import; replaced by RootState from store.ts

---

## Task 1: Install React Testing Library + configure vitest for UI tests

**Files:**
- Modify: `vite.config.ts`
- Create: `tests/ui/setup.ts`
- Create: `tests/ui/smoke.test.tsx`

- [ ] **Step 1: Install dependencies**

```bash
cd C:\Users\jsnap\source\repos\Basic4WebGL
npm install --save-dev @testing-library/react @testing-library/user-event jsdom
```

Expected: packages added to package.json devDependencies.

- [ ] **Step 2: Update vite.config.ts to include .tsx test files**

Change the `include` pattern and add a setup file reference:

```typescript
// vite.config.ts  (full file)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@CompilerLib': resolve(__dirname, './src/lib/CompilerLib'),
      '@Basic4WebGL': resolve(__dirname, './src/lib/Basic4WebGL'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/ui/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**'],
      exclude: ['src/lib/**/*.d.ts'],
    },
  },
});
```

- [ ] **Step 3: Create the setup file**

```typescript
// tests/ui/setup.ts
import '@testing-library/react';
// This file is intentionally minimal. Per-test jsdom environment is
// enabled via the `// @vitest-environment jsdom` comment at the top
// of each UI test file.
```

- [ ] **Step 4: Write a failing smoke test**

```tsx
// tests/ui/smoke.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';

function Hello() {
  return <span>hello</span>;
}

test('RTL renders a component', () => {
  render(<Hello />);
  expect(screen.getByText('hello')).toBeTruthy();
});
```

- [ ] **Step 5: Run test and verify it fails (module not found, before install is reflected)**

```bash
npx vitest run tests/ui/smoke.test.tsx
```

Expected: FAIL — if it passes immediately, verify `@testing-library/react` was newly installed.

- [ ] **Step 6: Run all tests and verify nothing is broken**

```bash
npx vitest run
```

Expected: all existing compiler tests still pass, smoke test passes.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts tests/ui/setup.ts tests/ui/smoke.test.tsx package.json package-lock.json
git commit -m "test: add @testing-library/react and configure vitest for UI tests"
```

---

## Task 2: Fix 4 critical bugs

**Files:**
- Modify: `src/components/Preview/Console.tsx`
- Modify: `src/components/FileTree/index.tsx`
- Modify: `src/pages/EditPage.tsx`

This task fixes all bugs in P8 / C1 / C2 / H1 / H2 from the audit. No new tests are written here because these fixes are verified by compilation and the behaviour changes are covered by later hook tests.

- [ ] **Step 1: Fix C1 + H1 in Console.tsx — remove the throw, enable origin check**

Replace the entire file:

```tsx
// src/components/Preview/Console.tsx
import { LogItem, LogItemType } from '../../Types/LogItem';

type ConsoleProps = {
  logs: Array<LogItem>;
};

const getClassesForType = (type: LogItemType) => {
  switch (type) {
    case LogItemType.Notice:  return 'text-green-400';
    case LogItemType.Warning: return 'text-orange-400';
    case LogItemType.Error:   return 'text-red-400';
    case LogItemType.Output:  return 'text-grey-400';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs = [] }) => {
  return (
    <ul className="bg-black text-xs font-mono p-2 overflow-scroll">
      <li className="text-grey-400">Console log output...</li>
      {logs.map((log, index) => (
        <li
          key={index}
          className={`bg-black ${getClassesForType(log.type)} text-xs font-mono p-2`}
        >
          {log.text}
        </li>
      ))}
    </ul>
  );
};

export default Console;
```

Note: the message listener (useEffect + window.addEventListener) is removed entirely here. It will be re-added as a proper hook in Task 7. Console is now a pure display component.

- [ ] **Step 2: Fix C2 in FileTree/index.tsx — move auto-select to useEffect**

Replace the component body (keep imports and types unchanged):

```tsx
// src/components/FileTree/index.tsx
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile } from '../../features/files/filesSlice';
import { useDispatch } from 'react-redux';
import { selectFile } from '../../features/ui/uiSlice';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none is selected for this project
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      handleFileSelected(files[0].id);
    }
  }, [selectedFileId, files]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: filename,
      source: '',
      projectId: projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  return (
    <>
      Files
      <ModalWithInput
        onSubmit={handleNewFile}
        openText="+"
        saveText="Save"
        closeText="Close"
        title="New file"
      />
      <ul className="space-y-2 text-sm">
        {files.map((file) => (
          <li
            key={file.id}
            className={`hover:text-white cursor-pointer ${
              file.id === selectedFileId ? 'text-white font-semibold' : ''
            }`}
            onClick={() => handleFileSelected(file.id)}
          >
            {file.name}
          </li>
        ))}
      </ul>
    </>
  );
};

export default FileTree;
```

- [ ] **Step 3: Fix H2 in EditPage.tsx — don't show preview on compile failure**

Change lines 77–78 (the failure branch of handleRun). Only the `handleRun` function changes:

```tsx
  const handleRun = () => {
    dispatch(clearLogs());
    dispatch(
      addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem)
    );

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(
          addLog({ type: LogItemType.Error, text: d.message + locStr } as LogItem)
        );
      });
      dispatch(setTranspiled(''));
      // H2 fix: do NOT set isRunning on failure — preview pane stays hidden
    } else {
      dispatch(
        addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem)
      );
      dispatch(setTranspiled(result.code!));
      setIsRunning(true);
    }
  };
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass (no test changes — these are behaviour fixes verified by compilation).

- [ ] **Step 5: Build to confirm TypeScript is clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Preview/Console.tsx src/components/FileTree/index.tsx src/pages/EditPage.tsx
git commit -m "fix: resolve 4 critical UI bugs (throw in listener, render-time dispatch, postMessage security, preview on error)"
```

---

## Task 3: Create sessionSlice — move session state out of uiSlice

**Files:**
- Create: `src/features/session/sessionSlice.ts`
- Create: `tests/ui/features/session/sessionSlice.test.ts`
- Modify: `src/store.ts`
- Modify: `src/features/ui/uiSlice.ts`
- Modify: `src/pages/EditPage.tsx`
- Modify: `src/components/Preview/index.tsx`

This task is P1 from the audit. `logs`, `transpiled`, and `isRunning` move to a non-persisted `sessionSlice`. `uiSlice` keeps only `selectedFileByProject`.

- [ ] **Step 1: Write failing tests for sessionSlice**

```typescript
// tests/ui/features/session/sessionSlice.test.ts
import sessionReducer, {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
  SessionState,
} from '../../../../src/features/session/sessionSlice';
import { LogItemType } from '../../../../src/Types/LogItem';

const initial: SessionState = {
  logs: [],
  transpiled: '',
  isRunning: false,
};

test('initial state', () => {
  expect(sessionReducer(undefined, { type: '@@init' })).toEqual(initial);
});

test('addLog appends a log entry', () => {
  const state = sessionReducer(initial, addLog({ type: LogItemType.Notice, text: 'hi' }));
  expect(state.logs).toHaveLength(1);
  expect(state.logs[0].text).toBe('hi');
});

test('clearLogs empties the log array', () => {
  const withLog = sessionReducer(initial, addLog({ type: LogItemType.Output, text: 'x' }));
  const cleared = sessionReducer(withLog, clearLogs());
  expect(cleared.logs).toHaveLength(0);
});

test('setTranspiled stores the code string', () => {
  const state = sessionReducer(initial, setTranspiled('var x = 1;'));
  expect(state.transpiled).toBe('var x = 1;');
});

test('setIsRunning toggles running flag', () => {
  const running = sessionReducer(initial, setIsRunning(true));
  expect(running.isRunning).toBe(true);
  const stopped = sessionReducer(running, setIsRunning(false));
  expect(stopped.isRunning).toBe(false);
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run tests/ui/features/session/sessionSlice.test.ts
```

Expected: FAIL — "Cannot find module '../../../../src/features/session/sessionSlice'"

- [ ] **Step 3: Create sessionSlice**

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run tests/ui/features/session/sessionSlice.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Register sessionSlice in store with persist blacklist**

```typescript
// src/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import projectsReducer from './features/projects/projectsSlice';
import filesReducer from './features/files/filesSlice';
import assetsReducer from './features/assets/assetsSlice';
import uiReducer from './features/ui/uiSlice';
import sessionReducer from './features/session/sessionSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistedConfig = {
  key: 'softBASIC',
  storage,
  blacklist: ['session'],
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
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 6: Strip uiSlice down to selectedFileByProject only**

```typescript
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
```

- [ ] **Step 7: Update EditPage.tsx to use sessionSlice**

Replace the imports at the top and update the component. Key changes:
- Import `addLog`, `clearLogs`, `setTranspiled`, `setIsRunning` from `session/sessionSlice`
- Remove local `isRunning` state (`useState(false)`)
- Read `isRunning` and `transpiled` from `state.session.*`

```tsx
// src/pages/EditPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import { useProjectForBuild } from '../hooks/useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { projectLib } from '../constants/projectLib';
import {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
} from '../features/session/sessionSlice';
import { LogItem, LogItemType } from '../Types/LogItem';
import TreePanel from '../components/TreePanel';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);
  const isRunning = useSelector((state: RootState) => state.session.isRunning);

  useEffect(() => {
    if (!project?.id) {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [project, navigate, location]);

  if (!project) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center text-red-600">
        <p>Project not found.</p>
      </div>
    );
  }

  const selectedFile = useSelectedFile(project.id);
  const buildProject = useProjectForBuild(project.id, projectLib);

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  const handleRun = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem));

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr } as LogItem));
      });
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };

  const handleStop = () => {
    dispatch(setIsRunning(false));
    dispatch(clearLogs());
    dispatch(setTranspiled(''));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <header className="h-12 px-4 flex items-center justify-between bg-gray-800 shadow">
        <div className="text-lg font-bold">softBASIC</div>
        {!isRunning ? (
          <button
            onClick={handleRun}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Run
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Stop
          </button>
        )}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <TreePanel projectId={project.id} />
        <main
          className={`flex-1 bg-gray-900 ${
            isRunning ? 'w-1/2' : 'w-full'
          } transition-all duration-300`}
        >
          <Editor onChange={handleChange} file={selectedFile} height="90vh" />
        </main>
        {isRunning && (
          <Preview transpiled={transpiled} projectId={project.id} />
        )}
      </div>
      <footer className="h-8 px-4 bg-gray-800 text-xs text-gray-400 flex items-center justify-between">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2 | UTF-8 | LF</span>
      </footer>
    </div>
  );
};

export default EditPage;
```

- [ ] **Step 8: Update Preview/index.tsx to read from session**

```tsx
// src/components/Preview/index.tsx
import { useSelector } from 'react-redux';
import Runner from '../Runner';
import Console from './Console';
import { RootState } from '../../store';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => {
  const logs = useSelector((state: RootState) => state.session.logs);

  return (
    <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
      <div className="flex-1 border-b border-gray-700">
        <Runner
          transpiled={transpiled}
          projectId={projectId}
          width="100%"
          height="100%"
        />
      </div>
      <Console logs={logs} />
    </aside>
  );
};

export default Preview;
```

- [ ] **Step 9: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass including the 5 new session slice tests.

- [ ] **Step 10: Build check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add src/features/session/ src/store.ts src/features/ui/uiSlice.ts src/pages/EditPage.tsx src/components/Preview/index.tsx tests/ui/features/
git commit -m "refactor: extract sessionSlice for non-persisted logs/transpiled/isRunning (P1)"
```

---

## Task 4: Unify file selection + fix project deletion

**Files:**
- Modify: `src/features/files/filesSlice.ts`
- Modify: `src/components/Projects/index.tsx`
- Delete: `src/Types/state.ts`

This task is P2 + M1 from the audit. FileTree already reads from `ui.selectedFileByProject` after Task 2's fix, so this task is mainly cleanup: removing the now-unused `selectedFileId` field from `filesSlice`, wiring the working deletion thunk, and deleting the dead `state.ts` file.

- [ ] **Step 1: Write a failing test for filesSlice without selectedFileId**

```typescript
// tests/ui/features/files/filesSlice.test.ts
import filesReducer, {
  IFile,
  IFilesState,
  addFile,
  updateFile,
  removeFile,
} from '../../../../src/features/files/filesSlice';

const sampleFile: IFile = {
  id: 'f1',
  name: 'Main.bas',
  source: 'PRINT "hello"',
  projectId: 'p1',
};

const initial: IFilesState = { byId: {} };

test('initial state has no selectedFileId field', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {} });
  expect('selectedFileId' in state).toBe(false);
});

test('addFile stores file by id', () => {
  const state = filesReducer(initial, addFile(sampleFile));
  expect(state.byId['f1']).toEqual(sampleFile);
});

test('updateFile replaces file source', () => {
  const withFile = filesReducer(initial, addFile(sampleFile));
  const updated = filesReducer(withFile, updateFile({ ...sampleFile, source: 'PRINT "world"' }));
  expect(updated.byId['f1'].source).toBe('PRINT "world"');
});

test('removeFile deletes by id', () => {
  const withFile = filesReducer(initial, addFile(sampleFile));
  const removed = filesReducer(withFile, removeFile('f1'));
  expect(removed.byId['f1']).toBeUndefined();
});
```

- [ ] **Step 2: Run tests — verify the selectedFileId assertion fails**

```bash
npx vitest run tests/ui/features/files/filesSlice.test.ts
```

Expected: FAIL on `'selectedFileId' in state` test.

- [ ] **Step 3: Remove selectedFileId from filesSlice**

```typescript
// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
}

const initialState: IFilesState = {
  byId: {},
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state: IFilesState, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateFile: (state: IFilesState, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeFile: (state: IFilesState, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
  },
});

export const { addFile, updateFile, removeFile } = filesSlice.actions;
export default filesSlice.reducer;
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run tests/ui/features/files/filesSlice.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Fix project deletion — use deleteProjectAndFiles thunk in ProjectList**

```tsx
// src/components/Projects/index.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { createProjectWithMainFile } from '../../features/projects/createProjectWithMainFile';
import { deleteProjectAndFiles } from '../../features/projects/deleteProjectAndFiles';
import { Project } from '../../features/projects/projectsSlice';

const ProjectList: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.items);
  const dispatch = useDispatch<AppDispatch>();

  const handleAdd = () => {
    dispatch(createProjectWithMainFile(`Project ${projects.length + 1}`));
  };

  const handleRemove = (id: string) => {
    dispatch(deleteProjectAndFiles(id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Projects</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600 text-center">No projects added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-blue-600 hover:underline">
                <Link to={`/projects/${project.id}/edit`}>{project.name}</Link>
              </h3>
              <button
                onClick={() => handleRemove(project.id)}
                className="mt-4 text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
```

- [ ] **Step 6: Delete the dead Types/state.ts file**

```bash
del "C:\Users\jsnap\source\repos\Basic4WebGL\src\Types\state.ts"
```

- [ ] **Step 7: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass, 0 TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/files/filesSlice.ts src/components/Projects/index.tsx tests/ui/features/files/
git rm src/Types/state.ts
git commit -m "refactor: unify file selection in uiSlice, fix project deletion to clean up files (P2+M1)"
```

---

## Task 5: Remove redundant asset localStorage writes

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx`

This task is P3 from the audit. Assets are already persisted by redux-persist via `assetsSlice`. The separate `useLocalStorage` call creates a divergence risk and is redundant.

No new test is needed — the asset Redux slice is already tested; the change is purely a removal.

- [ ] **Step 1: Verify useLocalStorage is only used in AssetTree**

```bash
grep -r "useLocalStorage" src/ --include="*.ts" --include="*.tsx"
```

Expected: only `src/components/TreePanel/AssetTree/index.tsx` and `src/hooks/useLocalStorage.ts`.

- [ ] **Step 2: Replace AssetTree — remove useLocalStorage**

```tsx
// src/components/TreePanel/AssetTree/index.tsx
import { useDispatch } from 'react-redux';
import { useAssetsForProject } from '../../../hooks/useAssetsForProject';
import FileInput, { FileUploadResult } from '../FileInput';
import { addAsset } from '../../../features/assets/assetsSlice';

type AssetTreeProps = {
  projectId: string;
};

const AssetTree: React.FC<AssetTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const assets = useAssetsForProject(projectId);

  const handleFileInputChange = (files: FileUploadResult[]) => {
    files.forEach((file) => {
      dispatch(
        addAsset({
          id: crypto.randomUUID(),
          name: file.name,
          content: file.content,
          projectId,
        })
      );
    });
  };

  return (
    <>
      Assets
      <FileInput onChange={handleFileInputChange} />
      <ul className="space-y-2 text-sm">
        {assets.map((asset) => (
          <li key={asset.id} className="hover:text-white cursor-pointer">
            {asset.name}
          </li>
        ))}
      </ul>
    </>
  );
};

export default AssetTree;
```

- [ ] **Step 3: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TreePanel/AssetTree/index.tsx
git commit -m "refactor: remove redundant localStorage writes from AssetTree, trust redux-persist (P3)"
```

---

## Task 6: Extract useCompiler hook

**Files:**
- Create: `src/hooks/useCompiler.ts`
- Create: `tests/ui/hooks/useCompiler.test.ts`
- Modify: `src/pages/EditPage.tsx`

This task is P4 from the audit. The compiler invocation, log dispatch, and run/stop control move from `EditPage` into a dedicated hook. `EditPage` becomes a thin coordinator.

- [ ] **Step 1: Write failing tests for useCompiler**

```typescript
// tests/ui/hooks/useCompiler.test.ts
// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../../src/features/session/sessionSlice';
import filesReducer from '../../../src/features/files/filesSlice';
import projectsReducer from '../../../src/features/projects/projectsSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import { useCompiler } from '../../../src/hooks/useCompiler';
import React from 'react';

const makeStore = () =>
  configureStore({
    reducer: {
      session: sessionReducer,
      files: filesReducer,
      projects: projectsReducer,
      assets: assetsReducer,
      ui: uiReducer,
    },
  });

const wrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('isRunning starts false', () => {
  const store = makeStore();
  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });
  expect(result.current.isRunning).toBe(false);
});

test('stop sets isRunning to false and clears logs', () => {
  const store = makeStore();
  // Pre-set isRunning and a log
  store.dispatch({ type: 'session/setIsRunning', payload: true });
  store.dispatch({ type: 'session/addLog', payload: { type: 0, text: 'old' } });

  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });

  act(() => {
    result.current.stop();
  });

  const state = store.getState();
  expect(state.session.isRunning).toBe(false);
  expect(state.session.logs).toHaveLength(0);
  expect(state.session.transpiled).toBe('');
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run tests/ui/hooks/useCompiler.test.ts
```

Expected: FAIL — "Cannot find module '../../../src/hooks/useCompiler'"

- [ ] **Step 3: Create useCompiler hook**

```typescript
// src/hooks/useCompiler.ts
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
} from '../features/session/sessionSlice';
import { LogItem, LogItemType } from '../Types/LogItem';
import Basic4WebGL from '../lib/Basic4WebGL';
import { useProjectForBuild } from './useProjectForBuild';
import { projectLib } from '../constants/projectLib';

export const useCompiler = (projectId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const buildProject = useProjectForBuild(projectId, projectLib);
  const isRunning = useSelector((state: RootState) => state.session.isRunning);

  const run = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem));

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr } as LogItem));
      });
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };

  const stop = () => {
    dispatch(setIsRunning(false));
    dispatch(clearLogs());
    dispatch(setTranspiled(''));
  };

  return { run, stop, isRunning };
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run tests/ui/hooks/useCompiler.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Update EditPage.tsx to use useCompiler**

```tsx
// src/pages/EditPage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import { useCompiler } from '../hooks/useCompiler';
import TreePanel from '../components/TreePanel';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);

  const { run, stop, isRunning } = useCompiler(id ?? '');

  useEffect(() => {
    if (!project?.id) {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [project, navigate, location]);

  if (!project) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center text-red-600">
        <p>Project not found.</p>
      </div>
    );
  }

  const selectedFile = useSelectedFile(project.id);

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <header className="h-12 px-4 flex items-center justify-between bg-gray-800 shadow">
        <div className="text-lg font-bold">softBASIC</div>
        {!isRunning ? (
          <button
            onClick={run}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Run
          </button>
        ) : (
          <button
            onClick={stop}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Stop
          </button>
        )}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <TreePanel projectId={project.id} />
        <main
          className={`flex-1 bg-gray-900 ${
            isRunning ? 'w-1/2' : 'w-full'
          } transition-all duration-300`}
        >
          <Editor onChange={handleChange} file={selectedFile} height="90vh" />
        </main>
        {isRunning && (
          <Preview transpiled={transpiled} projectId={project.id} />
        )}
      </div>
      <footer className="h-8 px-4 bg-gray-800 text-xs text-gray-400 flex items-center justify-between">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2 | UTF-8 | LF</span>
      </footer>
    </div>
  );
};

export default EditPage;
```

- [ ] **Step 6: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all pass, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useCompiler.ts src/pages/EditPage.tsx tests/ui/hooks/useCompiler.test.ts
git commit -m "refactor: extract useCompiler hook, EditPage delegates run/stop logic (P4)"
```

---

## Task 7: Extract useRunnerMessages hook

**Files:**
- Create: `src/hooks/useRunnerMessages.ts`
- Modify: `src/components/Preview/index.tsx`

This task is P5 from the audit. The `window.message` listener is restored as a proper, standalone hook called from `Preview`. The origin check (H1) is properly implemented — srcdoc iframes with `allow-same-origin` inherit the parent window's origin, so `e.origin === window.location.origin` is the correct guard.

- [ ] **Step 1: Create useRunnerMessages hook**

```typescript
// src/hooks/useRunnerMessages.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addLog } from '../features/session/sessionSlice';
import { LogItemType } from '../Types/LogItem';

type LogMessage = { type: string; message: string };

function isLogMessage(x: unknown): x is LogMessage {
  return !!x && typeof (x as LogMessage).type === 'string';
}

/**
 * Listens for postMessage events from the sandboxed runner iframe and
 * dispatches them as log entries. Origin-checks against window.location.origin
 * (valid because the iframe uses sandbox="allow-same-origin").
 */
export const useRunnerMessages = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isLogMessage(e.data)) return;
      switch (e.data.type) {
        case 'console.log':
          dispatch(addLog({ type: LogItemType.Output, text: e.data.message }));
          break;
        case 'runtimeError':
          dispatch(addLog({ type: LogItemType.Error, text: e.data.message }));
          break;
        default:
          dispatch(addLog({ type: LogItemType.Warning, text: e.data.message }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [dispatch]);
};
```

- [ ] **Step 2: Call the hook from Preview**

```tsx
// src/components/Preview/index.tsx
import { useSelector } from 'react-redux';
import Runner from '../Runner';
import Console from './Console';
import { RootState } from '../../store';
import { useRunnerMessages } from '../../hooks/useRunnerMessages';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => {
  const logs = useSelector((state: RootState) => state.session.logs);
  useRunnerMessages();

  return (
    <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
      <div className="flex-1 border-b border-gray-700">
        <Runner
          transpiled={transpiled}
          projectId={projectId}
          width="100%"
          height="100%"
        />
      </div>
      <Console logs={logs} />
    </aside>
  );
};

export default Preview;
```

- [ ] **Step 3: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass, 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useRunnerMessages.ts src/components/Preview/index.tsx
git commit -m "refactor: extract useRunnerMessages hook, Console is now a pure display component (P5+H1)"
```

---

## Task 8: Add ProjectShell layout component + file delete UI

**Files:**
- Create: `src/components/ProjectShell/index.tsx`
- Modify: `src/pages/EditPage.tsx`
- Modify: `src/components/FileTree/index.tsx`

This task is P6 + L2 from the audit. `ProjectShell` absorbs the 3-pane layout from `EditPage`. File delete is wired up in `FileTree`.

- [ ] **Step 1: Create ProjectShell component**

```tsx
// src/components/ProjectShell/index.tsx
import React from 'react';

type ProjectShellProps = {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  preview?: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * 3-pane IDE layout: fixed header + footer, collapsible sidebar,
 * main editor pane, and an optional preview pane.
 * Owns no state — purely structural.
 */
const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  sidebar,
  editor,
  preview,
  footer,
}) => (
  <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
    <header className="h-12 px-4 flex items-center justify-between bg-gray-800 shadow">
      {header}
    </header>

    <div className="flex flex-1 overflow-hidden">
      <nav className="w-64 flex-shrink-0 bg-gray-800 text-gray-300 p-4 border-r border-gray-700 overflow-y-auto">
        {sidebar}
      </nav>

      <main
        className={`flex-1 bg-gray-900 ${
          preview ? 'w-1/2' : 'w-full'
        } transition-all duration-300`}
      >
        {editor}
      </main>

      {preview && (
        <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
          {preview}
        </aside>
      )}
    </div>

    {footer && (
      <footer className="h-8 px-4 bg-gray-800 text-xs text-gray-400 flex items-center justify-between">
        {footer}
      </footer>
    )}
  </div>
);

export default ProjectShell;
```

- [ ] **Step 2: Update EditPage to use ProjectShell**

```tsx
// src/pages/EditPage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import { useCompiler } from '../hooks/useCompiler';
import TreePanel from '../components/TreePanel';
import ProjectShell from '../components/ProjectShell';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);
  const { run, stop, isRunning } = useCompiler(id ?? '');

  useEffect(() => {
    if (!project?.id) {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [project, navigate, location]);

  if (!project) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center text-red-600">
        <p>Project not found.</p>
      </div>
    );
  }

  const selectedFile = useSelectedFile(project.id);

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  return (
    <ProjectShell
      header={
        <>
          <div className="text-lg font-bold">softBASIC</div>
          {!isRunning ? (
            <button
              onClick={run}
              className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              Run
            </button>
          ) : (
            <button
              onClick={stop}
              className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              Stop
            </button>
          )}
        </>
      }
      sidebar={<TreePanel projectId={project.id} />}
      editor={<Editor onChange={handleChange} file={selectedFile} height="90vh" />}
      preview={
        isRunning ? (
          <Preview transpiled={transpiled} projectId={project.id} />
        ) : undefined
      }
      footer={
        <>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2 | UTF-8 | LF</span>
        </>
      }
    />
  );
};

export default EditPage;
```

- [ ] **Step 3: Add file delete to FileTree**

```tsx
// src/components/FileTree/index.tsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile } from '../../features/files/filesSlice';
import { selectFile } from '../../features/ui/uiSlice';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      handleFileSelected(files[0].id);
    }
  }, [selectedFileId, files]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: filename,
      source: '',
      projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    // If we just deleted the selected file, clear selection
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      }
    }
  };

  return (
    <>
      Files
      <ModalWithInput
        onSubmit={handleNewFile}
        openText="+"
        saveText="Save"
        closeText="Close"
        title="New file"
      />
      <ul className="space-y-2 text-sm">
        {files.map((file) => (
          <li
            key={file.id}
            className={`flex items-center justify-between group hover:text-white cursor-pointer ${
              file.id === selectedFileId ? 'text-white font-semibold' : ''
            }`}
          >
            <span onClick={() => handleFileSelected(file.id)}>{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="hidden group-hover:inline text-gray-500 hover:text-red-400 ml-2 text-xs"
                title="Delete file"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default FileTree;
```

Note: the delete button only appears on hover and is hidden when only one file remains (prevents deleting the last file).

- [ ] **Step 4: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectShell/ src/pages/EditPage.tsx src/components/FileTree/index.tsx
git commit -m "refactor: add ProjectShell layout wrapper, expose file delete in FileTree (P6+L2)"
```

---

## Task 9: Error boundaries + type cleanup

**Files:**
- Create: `src/components/ErrorBoundary/index.tsx`
- Modify: `src/pages/EditPage.tsx`
- Modify: `src/components/Editor/index.tsx`

This task is P7 + P9 from the audit. A reusable `ErrorBoundary` class component wraps `Editor` and `Preview`. `SBFileProps` (local type in Editor) is replaced with the canonical `IFile` from `filesSlice`.

- [ ] **Step 1: Create ErrorBoundary component**

```tsx
// src/components/ErrorBoundary/index.tsx
import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

/**
 * Class-based error boundary. Catches render-time errors in child components
 * and displays a fallback UI instead of crashing the whole page.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Editor crashed.</p>}>
 *     <Editor ... />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 bg-gray-900 text-red-400 text-sm font-mono">
            <p className="font-bold mb-1">Component error</p>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

- [ ] **Step 2: Wrap Editor and Preview with ErrorBoundary in EditPage**

In `src/pages/EditPage.tsx`, add the import and wrap the two slots:

```tsx
import ErrorBoundary from '../components/ErrorBoundary';
```

Change the `editor` and `preview` props in the `<ProjectShell>` call:

```tsx
      editor={
        <ErrorBoundary fallback={<p className="p-4 text-red-400">Editor failed to load.</p>}>
          <Editor onChange={handleChange} file={selectedFile} height="90vh" />
        </ErrorBoundary>
      }
      preview={
        isRunning ? (
          <ErrorBoundary fallback={<p className="p-4 text-red-400">Preview failed to load.</p>}>
            <Preview transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
```

- [ ] **Step 3: Replace SBFileProps with IFile in Editor**

`SBFileProps` and `IFile` are structurally identical. Remove the local type and use `IFile` directly:

```tsx
// src/components/Editor/index.tsx
import React, { useState, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { IFile } from '../../features/files/filesSlice';
import getMonacoConfig from '../../monacoHelpers';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);

  if (!file) {
    return <p>File not found.</p>;
  }

  useEffect(() => {
    if (!monaco) return;
    monaco.languages.register({ id: 'softBasic' });
    monaco.languages.setMonarchTokensProvider('softBasic', {
      tokenizer: { root: [...getMonacoConfig().tokens] },
    });
    monaco.editor.defineTheme('softBasicTheme', getMonacoConfig().theme);
    setLanguageLoaded(true);
  }, [monaco]);

  return (
    languageLoaded && (
      <Editor
        height={height}
        defaultValue=""
        language="softBasic"
        defaultLanguage="softBasic"
        theme="softBasicTheme"
        value={file.source}
        options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
        onChange={onChange}
      />
    )
  );
};

export default SBEditor;
```

- [ ] **Step 4: Run all tests and build check**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ErrorBoundary/ src/pages/EditPage.tsx src/components/Editor/index.tsx
git commit -m "refactor: add ErrorBoundary for Editor+Preview, replace local SBFileProps with IFile (P7+P9)"
```

---

## Self-Review

### Spec coverage

| Audit item | Task |
|---|---|
| C1 — throw in Console listener | Task 2 |
| C2 — FileTree render-time dispatch | Task 2 |
| H1 — postMessage origin check | Task 7 |
| H2 — isRunning true on failure | Task 2 |
| H3 — dual asset storage | Task 5 |
| H4 — dual file selection sources | Task 4 |
| M1 — file orphan on project delete | Task 4 |
| M2 — Modal portal (deferred) | not in scope |
| M3 — Error boundaries | Task 9 |
| M4 — buildProject inline (implicit fix) | Task 6 |
| M5 — IFile/SBFileProps type duplication | Task 9 |
| M6 — transpiled in persisted state | Task 3 |
| L2 — no file delete UI | Task 8 |
| P1 — session slice | Task 3 |
| P2 — unify file selection | Task 4 |
| P3 — asset localStorage | Task 5 |
| P4 — useCompiler hook | Task 6 |
| P5 — useRunnerMessages hook | Task 7 |
| P6 — ProjectShell layout | Task 8 |
| P7 — error boundaries | Task 9 |
| P9 — type unification | Task 9 |
| P10 — move thunks (already in features/) | Task 4 |

**Not in scope:** M2 (Modal portal replacement) — deferred to Phase 3 visual redesign. L1 (accessibility), L3 (unsaved indicator), L4 (cross-file undo) — deferred to Phase 3.

### Placeholder scan

No TBD, TODO, or incomplete sections found.

### Type consistency

- `IFile` used consistently from Task 4 onward
- `SessionState` actions (`addLog`, `clearLogs`, `setTranspiled`, `setIsRunning`) introduced in Task 3 and used identically in Tasks 6 and 7
- `RootState` references `state.session.*` in Tasks 3–9; all consistent
