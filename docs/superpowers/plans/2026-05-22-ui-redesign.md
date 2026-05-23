# softBASIC UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the softBASIC frontend into a professional browser-based IDE with a Deep Space colour palette, VS Code-style activity bar + collapsible sidebar, a full-width tabbed bottom panel (Console + Problems), dirty file dots on editor tabs, an accessible Modal Portal, and keyboard navigation in the file tree.

**Architecture:** All new visual structure lives in restyled/new components (`ProjectShell`, `BottomPanel`, `FileTabs`, `ActivityBar`). State changes are minimal: `dirtyFileIds` added to `filesSlice` (cleared on rehydrate), `useAutoSave` hook provides the debounced clear. No routing or data model changes.

**Tech Stack:** React 19, Redux Toolkit, Tailwind CSS 3, `@monaco-editor/react`, `ReactDOM.createPortal`, Vitest + RTL

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/components/FileTabs/index.tsx` | File tab bar — one tab per project file, dirty dot, close button |
| `src/components/BottomPanel/index.tsx` | Full-width tabbed panel — Console tab + Problems tab, collapsible |
| `src/hooks/useAutoSave.ts` | Debounced dirty-state clearer (500ms after last edit) |

### Modified files
| File | Change |
|---|---|
| `tailwind.config.js` | Add `ds-*` design system colour tokens |
| `src/features/files/filesSlice.ts` | Add `dirtyFileIds: string[]`; `updateFile` marks dirty; REHYDRATE clears |
| `src/components/ProjectShell/index.tsx` | Full restyle: activity bar slot, collapsible sidebar, `panel` slot, ds-* tokens |
| `src/components/Modal/ModalWithInput.tsx` | Rebuild with `ReactDOM.createPortal`, focus trap, aria attrs, Escape handler |
| `src/components/Modal/index.tsx` | Re-export (no change needed if already exporting correctly) |
| `src/pages/ProjectsPage.tsx` | Wrap in `<IDEAppShell>` (minimal top nav + main content area) |
| `src/components/Projects/index.tsx` | Card grid with accent stripe, metadata, hover-delete, dashed new-card slot |
| `src/components/Preview/index.tsx` | Remove `Console` — now just renders `Runner` (console moved to `BottomPanel`) |
| `src/components/Preview/Console.tsx` | Restyle with ds-* tokens + timestamps (still used by `BottomPanel`) |
| `src/pages/EditPage.tsx` | Add `FileTabs`, pass `BottomPanel` as `panel` slot, wire `useAutoSave` |
| `src/components/TreePanel/index.tsx` | Remove `<aside>` wrapper — ProjectShell owns sidebar chrome |
| `src/components/FileTree/index.tsx` | Add keyboard navigation (arrow keys, Enter, Delete), aria attributes |
| `src/components/TreePanel/AssetTree/index.tsx` | Add `aria-label` to upload button, ds-* tokens |

---

## Task 1: Design system tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'ds-bg':             '#0b0b18',
        'ds-surface':        '#12122a',
        'ds-surface-2':      '#1a1a38',
        'ds-border':         '#2a2a55',
        'ds-border-subtle':  '#1e1e44',
        // Text
        'ds-text':           '#e0e0f0',
        'ds-text-muted':     '#8888bb',
        'ds-text-dim':       '#4a4a88',
        // Accent (indigo/violet)
        'ds-accent':         '#6060dd',
        'ds-accent-btn':     '#3030aa',
        'ds-accent-btn-text':'#c8c8ff',
        'ds-accent-subtle':  '#1e1e44',
        // Semantic
        'ds-success':        '#40aa60',
        'ds-success-bg':     '#0f2a1a',
        'ds-error':          '#cc4466',
        'ds-error-bg':       '#2a1020',
        'ds-warning':        '#cc9933',
        'ds-warning-bg':     '#2a2010',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Verify tokens are available**

Run: `npx tailwindcss --input src/index.css --output /tmp/tw-out.css --content "src/index.html" 2>&1 | head -5`

Expected: no errors. (If `tailwindcss` CLI isn't available globally, skip — it will be validated when Vite dev server starts.)

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add ds-* design system colour tokens to Tailwind config"
```

---

## Task 2: dirtyFileIds in filesSlice + useAutoSave hook

**Files:**
- Modify: `src/features/files/filesSlice.ts`
- Create: `src/hooks/useAutoSave.ts`
- Test: `tests/ui/features/files/filesSlice.test.ts` (extend existing)
- Test: `tests/ui/hooks/useAutoSave.test.tsx` (new)

- [ ] **Step 1: Write failing tests for dirtyFileIds**

Add to `tests/ui/features/files/filesSlice.test.ts`:

```typescript
import { REHYDRATE } from 'redux-persist';

describe('dirtyFileIds', () => {
  it('updateFile marks the file as dirty', () => {
    const store = configureStore({ reducer: { files: filesReducer } });
    store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'PRINT "hi"', projectId: 'p1' }));
    expect(store.getState().files.dirtyFileIds).toContain('f1');
  });

  it('clearAllDirty removes all dirty ids', () => {
    const store = configureStore({ reducer: { files: filesReducer } });
    store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'x', projectId: 'p1' }));
    store.dispatch(clearAllDirty());
    expect(store.getState().files.dirtyFileIds).toHaveLength(0);
  });

  it('REHYDRATE clears dirtyFileIds', () => {
    const store = configureStore({ reducer: { files: filesReducer } });
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'x', projectId: 'p1' }));
    store.dispatch({ type: REHYDRATE, key: 'softBASIC', payload: {} });
    expect(store.getState().files.dirtyFileIds).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /c/Users/jsnap/source/repos/Basic4WebGL
npx vitest run tests/ui/features/files/filesSlice.test.ts 2>&1 | tail -15
```

Expected: 3 new test failures (dirtyFileIds not defined yet).

- [ ] **Step 3: Update filesSlice.ts**

```typescript
// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
}

const initialState: IFilesState = {
  byId: {},
  dirtyFileIds: [],
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
    },
    updateFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      if (!state.dirtyFileIds.includes(action.payload.id)) {
        state.dirtyFileIds.push(action.payload.id);
      }
    },
    removeFile: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
  },
  extraReducers: (builder) => {
    // dirtyFileIds must never survive a page refresh — clear on rehydrate
    builder.addCase(REHYDRATE, (state) => {
      state.dirtyFileIds = [];
    });
  },
});

export const { addFile, updateFile, removeFile, clearAllDirty } = filesSlice.actions;
export default filesSlice.reducer;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/ui/features/files/filesSlice.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Write failing test for useAutoSave**

Create `tests/ui/hooks/useAutoSave.test.tsx`:

```typescript
// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import React from 'react';
import filesReducer, { addFile, updateFile } from '../../../src/features/files/filesSlice';
import { useAutoSave } from '../../../src/hooks/useAutoSave';

const makeStore = () =>
  configureStore({ reducer: { files: filesReducer } });

const wrapper = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('clears dirty files 500ms after last update', async () => {
  const store = makeStore();
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'PRINT', projectId: 'p1' }));

  renderHook(() => useAutoSave(), { wrapper: wrapper(store) });

  expect(store.getState().files.dirtyFileIds).toContain('f1');

  act(() => { vi.advanceTimersByTime(500); });

  expect(store.getState().files.dirtyFileIds).toHaveLength(0);
});

test('resets debounce timer when another update arrives', async () => {
  const store = makeStore();
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'A', projectId: 'p1' }));

  const { rerender } = renderHook(() => useAutoSave(), { wrapper: wrapper(store) });

  act(() => { vi.advanceTimersByTime(300); });
  // Another update before 500ms
  act(() => {
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'AB', projectId: 'p1' }));
  });
  rerender();

  // Still dirty at 300ms after second update
  act(() => { vi.advanceTimersByTime(300); });
  expect(store.getState().files.dirtyFileIds).toContain('f1');

  // Clean at 500ms after second update
  act(() => { vi.advanceTimersByTime(200); });
  expect(store.getState().files.dirtyFileIds).toHaveLength(0);
});
```

- [ ] **Step 6: Run test to confirm it fails**

```bash
npx vitest run tests/ui/hooks/useAutoSave.test.tsx 2>&1 | tail -10
```

Expected: fails — `useAutoSave` does not exist yet.

- [ ] **Step 7: Create useAutoSave.ts**

```typescript
// src/hooks/useAutoSave.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { clearAllDirty } from '../features/files/filesSlice';

/**
 * Watches dirtyFileIds and clears them 500ms after the last updateFile dispatch.
 * Call this once at the EditPage level.
 */
export const useAutoSave = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dirtyFileIds = useSelector((state: RootState) => state.files.dirtyFileIds);

  useEffect(() => {
    if (dirtyFileIds.length === 0) return;
    const timer = setTimeout(() => {
      dispatch(clearAllDirty());
    }, 500);
    return () => clearTimeout(timer);
  }, [dirtyFileIds, dispatch]);
};
```

- [ ] **Step 8: Run all tests**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/features/files/filesSlice.ts src/hooks/useAutoSave.ts \
        tests/ui/features/files/filesSlice.test.ts tests/ui/hooks/useAutoSave.test.tsx
git commit -m "feat: add dirtyFileIds to filesSlice, useAutoSave hook (L3 dirty indicator)"
```

---

## Task 3: Modal as React Portal with focus trap

**Files:**
- Modify: `src/components/Modal/ModalWithInput.tsx`
- Test: `tests/ui/components/Modal/ModalWithInput.test.tsx` (new)

- [ ] **Step 1: Write failing tests**

Create `tests/ui/components/Modal/ModalWithInput.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ModalWithInput from '../../../../src/components/Modal/ModalWithInput';

test('renders trigger button with openText', () => {
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
});

test('modal is not visible initially', () => {
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('opens modal when trigger is clicked', async () => {
  const user = userEvent.setup();
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('New file')).toBeInTheDocument();
});

test('Escape closes the modal', async () => {
  const user = userEvent.setup();
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('calls onSubmit with input value and closes', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ModalWithInput title="New file" openText="+" saveText="Save" onSubmit={onSubmit} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'utils.bas');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith('utils.bas');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run tests/ui/components/Modal/ModalWithInput.test.tsx 2>&1 | tail -15
```

Expected: most tests fail (no `role="dialog"`, Escape not handled).

- [ ] **Step 3: Rewrite ModalWithInput.tsx**

```tsx
// src/components/Modal/ModalWithInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface IModalWithInputProps {
  title: string;
  openText?: string;
  placeholder?: string;
  saveText?: string;
  closeText?: string;
  onSubmit: (inputText: string) => void;
}

const ModalWithInput: React.FC<IModalWithInputProps> = ({
  title,
  openText = 'Open',
  placeholder = 'Type here...',
  saveText = 'Save',
  closeText = 'Close',
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);

  const open = () => {
    setIsOpen(true);
    setInputValue('');
  };

  const close = () => {
    setIsOpen(false);
    // Return focus to trigger on close
    triggerRef.current?.focus();
  };

  const submit = () => {
    onSubmit(inputValue);
    close();
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const modal = isOpen
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId.current}
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
            onKeyDown={(e) => {
              // Trap Tab focus inside modal
              if (e.key !== 'Tab') return;
              const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
                'input, button, [tabindex]:not([tabindex="-1"])'
              );
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            }}
          >
            <h2 id={titleId.current} className="text-ds-text text-lg font-semibold mb-4">
              {title}
            </h2>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={placeholder}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ds-accent"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={submit}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                {saveText}
              </button>
              <button
                onClick={close}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                {closeText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open}
        className="text-ds-text-muted hover:text-ds-text transition text-sm"
        aria-label={openText}
      >
        {openText}
      </button>
      {modal}
    </>
  );
};

export default ModalWithInput;
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/ui/components/Modal/ModalWithInput.test.tsx 2>&1 | tail -10
```

Expected: all 5 tests pass.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Modal/ModalWithInput.tsx tests/ui/components/Modal/ModalWithInput.test.tsx
git commit -m "feat: rebuild ModalWithInput as React Portal with focus trap and Escape handler (M2+L1)"
```

---

## Task 4: Projects page redesign

**Files:**
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/components/Projects/index.tsx`

- [ ] **Step 1: Update ProjectsPage.tsx**

```tsx
// src/pages/ProjectsPage.tsx
import React from 'react';
import ProjectList from '../components/Projects';

const ProjectsPage: React.FC = () => (
  <div className="min-h-screen bg-ds-bg text-ds-text">
    <header className="h-11 px-6 flex items-center border-b border-ds-border bg-ds-surface">
      <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">
        softBASIC
      </span>
    </header>
    <main className="max-w-5xl mx-auto px-6 py-8">
      <ProjectList />
    </main>
  </div>
);

export default ProjectsPage;
```

- [ ] **Step 2: Update Projects/index.tsx**

```tsx
// src/components/Projects/index.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { createProjectWithMainFile } from '../../features/projects/createProjectWithMainFile';
import { deleteProjectWithMainFile } from '../../features/projects/deleteProjectAndFiles';
import { Project } from '../../features/projects/projectsSlice';
import { useAssetsForProject } from '../../hooks/useAssetsForProject';
import { useFilesForProject } from '../../hooks/useFilesForProject';

// Derive a stable accent colour from the project id
const ACCENT_SHADES = [
  '#5050cc', '#7050cc', '#3060aa', '#6040bb', '#4050dd', '#5070bb',
];
function projectAccent(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_SHADES[sum % ACCENT_SHADES.length];
}

const ProjectCard: React.FC<{ project: Project; onRemove: (id: string) => void }> = ({
  project,
  onRemove,
}) => {
  const files = useFilesForProject(project.id);
  const assets = useAssetsForProject(project.id);

  return (
    <div className="relative group bg-ds-surface border border-ds-border rounded-xl overflow-hidden hover:border-ds-accent transition-colors">
      {/* Accent stripe */}
      <div className="h-1" style={{ background: projectAccent(project.id) }} />
      <div className="p-4">
        <h3 className="font-semibold text-ds-text text-base mb-1 truncate">{project.name}</h3>
        <p className="text-ds-text-muted text-xs">
          {files.length} {files.length === 1 ? 'file' : 'files'}
          {assets.length > 0 && ` · ${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}`}
        </p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle">
          <Link
            to={`/projects/${project.id}/edit`}
            className="text-ds-accent-btn-text bg-ds-accent-btn text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition"
          >
            Open →
          </Link>
          <button
            onClick={() => onRemove(project.id)}
            className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error text-xs transition-opacity"
            aria-label={`Delete project ${project.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectList: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.items);
  const dispatch = useDispatch<AppDispatch>();

  const handleAdd = () => {
    dispatch(createProjectWithMainFile(`Project ${projects.length + 1}`));
  };

  const handleRemove = (id: string) => {
    dispatch(deleteProjectWithMainFile(id));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ds-text">My Projects</h1>
          <p className="text-ds-text-muted text-sm mt-0.5">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">📁</div>
          <p className="text-ds-text-muted mb-4">No projects yet.</p>
          <button
            onClick={handleAdd}
            className="bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} onRemove={handleRemove} />
          ))}
          {/* New project dashed slot */}
          <button
            onClick={handleAdd}
            className="border-2 border-dashed border-ds-border rounded-xl p-4 flex flex-col items-center justify-center min-h-[108px] text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted transition-colors"
            aria-label="Create new project"
          >
            <span className="text-3xl leading-none mb-1">+</span>
            <span className="text-xs">New project</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ProjectList;
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass (no component tests for ProjectList, but the suite passes).

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProjectsPage.tsx src/components/Projects/index.tsx
git commit -m "feat: redesign Projects page — card grid with accent stripes, empty state, ds-* tokens"
```

---

## Task 5: FileTabs component

**Files:**
- Create: `src/components/FileTabs/index.tsx`
- Test: `tests/ui/components/FileTabs/FileTabs.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/ui/components/FileTabs/FileTabs.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FileTabs from '../../../../src/components/FileTabs';

const files = [
  { id: 'f1', name: 'main.bas', source: '', projectId: 'p1' },
  { id: 'f2', name: 'utils.bas', source: '', projectId: 'p1' },
];

test('renders a tab for each file', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.getByText('main.bas')).toBeInTheDocument();
  expect(screen.getByText('utils.bas')).toBeInTheDocument();
});

test('active tab has aria-selected="true"', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.getByRole('tab', { name: /main\.bas/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /utils\.bas/ })).toHaveAttribute('aria-selected', 'false');
});

test('dirty tab shows ● indicator', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={['f2']}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  // The dirty dot should appear for f2
  const dirtyTab = screen.getByRole('tab', { name: /utils\.bas/ });
  expect(dirtyTab.textContent).toContain('●');
});

test('clicking a tab calls onSelect with file id', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={onSelect}
      onClose={vi.fn()}
    />
  );
  await user.click(screen.getByRole('tab', { name: /utils\.bas/ }));
  expect(onSelect).toHaveBeenCalledWith('f2');
});

test('close button hidden when only one file', () => {
  render(
    <FileTabs
      files={[files[0]]}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run tests/ui/components/FileTabs/FileTabs.test.tsx 2>&1 | tail -10
```

Expected: all 5 fail — component doesn't exist.

- [ ] **Step 3: Create FileTabs component**

Create `src/components/FileTabs/index.tsx`:

```tsx
import React from 'react';
import { IFile } from '../../features/files/filesSlice';

type FileTabsProps = {
  files: IFile[];
  selectedFileId: string | undefined;
  dirtyFileIds: string[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

const FileTabs: React.FC<FileTabsProps> = ({
  files,
  selectedFileId,
  dirtyFileIds,
  onSelect,
  onClose,
}) => {
  const canClose = files.length > 1;

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex items-end bg-ds-bg border-b border-ds-border overflow-x-auto flex-shrink-0"
    >
      {files.map((file) => {
        const isActive = file.id === selectedFileId;
        const isDirty = dirtyFileIds.includes(file.id);

        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(file.id)}
            className={`
              group relative flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
              select-none whitespace-nowrap border-b-2 transition-colors
              ${isActive
                ? 'text-ds-text border-ds-accent bg-ds-surface'
                : 'text-ds-text-muted border-transparent hover:text-ds-text hover:bg-ds-surface-2'
              }
            `}
          >
            {isDirty && (
              <span className="text-ds-accent" aria-label="unsaved changes">●</span>
            )}
            <span>{file.name}</span>
            {canClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(file.id); }}
                className="ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                aria-label={`Close ${file.name}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileTabs;
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/ui/components/FileTabs/FileTabs.test.tsx 2>&1 | tail -10
```

Expected: all 5 pass.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FileTabs/index.tsx tests/ui/components/FileTabs/FileTabs.test.tsx
git commit -m "feat: FileTabs component — active tab, dirty dot, close button (L3)"
```

---

## Task 6: BottomPanel component (Console + Problems tabs)

**Files:**
- Create: `src/components/BottomPanel/index.tsx`
- Modify: `src/components/Preview/Console.tsx` (restyle only — used by BottomPanel)

- [ ] **Step 1: Write failing test**

Create `tests/ui/components/BottomPanel/BottomPanel.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogItemType } from '../../../../src/Types/LogItem';
import BottomPanel from '../../../../src/components/BottomPanel';

const logs = [
  { type: LogItemType.Notice, text: 'compiled ok' },
  { type: LogItemType.Error, text: 'main.bas:4 undefined var' },
  { type: LogItemType.Output, text: 'score = 10' },
];

test('renders Console tab active by default', () => {
  render(<BottomPanel logs={logs} />);
  expect(screen.getByRole('tab', { name: /console/i })).toHaveAttribute('aria-selected', 'true');
});

test('shows all logs in console tab', () => {
  render(<BottomPanel logs={logs} />);
  expect(screen.getByText('compiled ok')).toBeInTheDocument();
  expect(screen.getByText('score = 10')).toBeInTheDocument();
});

test('Problems tab badge shows error count', () => {
  render(<BottomPanel logs={logs} />);
  // 1 error log — badge should show 1
  const problemsTab = screen.getByRole('tab', { name: /problems/i });
  expect(problemsTab.textContent).toContain('1');
});

test('switching to Problems tab shows only errors', async () => {
  const user = userEvent.setup();
  render(<BottomPanel logs={logs} />);
  await user.click(screen.getByRole('tab', { name: /problems/i }));
  expect(screen.getByText('main.bas:4 undefined var')).toBeInTheDocument();
  expect(screen.queryByText('compiled ok')).not.toBeInTheDocument();
  expect(screen.queryByText('score = 10')).not.toBeInTheDocument();
});

test('collapse button toggles panel body visibility', async () => {
  const user = userEvent.setup();
  render(<BottomPanel logs={logs} />);
  const toggle = screen.getByRole('button', { name: /collapse|expand/i });
  await user.click(toggle);
  expect(screen.queryByText('compiled ok')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run tests/ui/components/BottomPanel/BottomPanel.test.tsx 2>&1 | tail -10
```

Expected: all 5 fail.

- [ ] **Step 3: Create BottomPanel component**

Create `src/components/BottomPanel/index.tsx`:

```tsx
import React, { useState } from 'react';
import { LogItem, LogItemType } from '../../Types/LogItem';

type BottomPanelProps = {
  logs: LogItem[];
};

const TAG_STYLES: Record<LogItemType, string> = {
  [LogItemType.Notice]:  'bg-ds-success-bg text-ds-success',
  [LogItemType.Error]:   'bg-ds-error-bg text-ds-error',
  [LogItemType.Warning]: 'bg-ds-warning-bg text-ds-warning',
  [LogItemType.Output]:  'bg-ds-surface-2 text-ds-text-muted',
};

const TAG_LABELS: Record<LogItemType, string> = {
  [LogItemType.Notice]:  'OK',
  [LogItemType.Error]:   'ERR',
  [LogItemType.Warning]: 'WARN',
  [LogItemType.Output]:  'OUT',
};

type Tab = 'console' | 'problems';

const BottomPanel: React.FC<BottomPanelProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [collapsed, setCollapsed] = useState(false);

  const errorLogs = logs.filter((l) => l.type === LogItemType.Error);
  const visibleLogs = activeTab === 'console' ? logs : errorLogs;

  return (
    <div className="flex flex-col bg-ds-bg border-t border-ds-border" style={{ height: collapsed ? 'auto' : '180px' }}>
      {/* Tab bar */}
      <div role="tablist" className="flex items-center bg-ds-surface border-b border-ds-border flex-shrink-0 px-2">
        {(['console', 'problems'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const badge = tab === 'problems' ? errorLogs.length : logs.length;
          const badgeStyle = tab === 'problems' && errorLogs.length > 0
            ? 'bg-ds-error-bg text-ds-error'
            : 'bg-ds-surface-2 text-ds-text-dim';

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors capitalize
                ${isActive
                  ? 'text-ds-text border-ds-accent'
                  : 'text-ds-text-muted border-transparent hover:text-ds-text'
                }
              `}
            >
              {tab}
              {badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${badgeStyle}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-ds-text-dim hover:text-ds-text-muted px-2 py-1 text-xs transition-colors"
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {/* Log list */}
      {!collapsed && (
        <ul className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5">
          {visibleLogs.length === 0 && (
            <li className="text-ds-text-dim py-1 px-1">No output.</li>
          )}
          {visibleLogs.map((log, i) => (
            <li key={i} className="flex items-start gap-2 px-1 py-0.5">
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${TAG_STYLES[log.type]}`}>
                {TAG_LABELS[log.type]}
              </span>
              <span className="text-ds-text leading-relaxed">{log.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BottomPanel;
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/ui/components/BottomPanel/BottomPanel.test.tsx 2>&1 | tail -10
```

Expected: all 5 pass.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/BottomPanel/index.tsx tests/ui/components/BottomPanel/BottomPanel.test.tsx
git commit -m "feat: BottomPanel with Console + Problems tabs, collapsible, ds-* tokens"
```

---

## Task 7: ProjectShell redesign — activity bar + collapsible sidebar

**Files:**
- Modify: `src/components/ProjectShell/index.tsx`
- Modify: `src/components/TreePanel/index.tsx`
- Modify: `src/components/Preview/index.tsx`

The new `ProjectShell` adds an activity bar (40px) that toggles sidebar sections, replaces the fixed sidebar width with a collapsible 220px panel, and adds a `panel` slot for the bottom panel. `Preview` loses its Console wrapper (that moves to BottomPanel).

- [ ] **Step 1: Update Preview/index.tsx to remove Console**

`Preview` now just renders the Runner — Console has moved to BottomPanel.

```tsx
// src/components/Preview/index.tsx
import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => (
  <Runner transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
);

export default Preview;
```

- [ ] **Step 2: Update TreePanel to remove its own wrapper**

`ProjectShell` now owns the sidebar chrome; `TreePanel` just renders content.

```tsx
// src/components/TreePanel/index.tsx
import React from 'react';
import AssetTree from './AssetTree';
import FileTree from '../FileTree';

type TreePanelProps = {
  projectId: string;
};

const TreePanel: React.FC<TreePanelProps> = ({ projectId }) => (
  <>
    <FileTree projectId={projectId} />
    <div className="mt-4 pt-4 border-t border-ds-border-subtle">
      <AssetTree projectId={projectId} />
    </div>
  </>
);

export default TreePanel;
```

- [ ] **Step 3: Rewrite ProjectShell**

```tsx
// src/components/ProjectShell/index.tsx
import React, { useState } from 'react';

// Inline SVG icons — no external dependency needed
const FilesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const AssetsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export type ActivitySection = {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  content: React.ReactNode;
};

type ProjectShellProps = {
  header: React.ReactNode;
  activitySections: ActivitySection[];
  editor: React.ReactNode;
  preview?: React.ReactNode;
  panel: React.ReactNode;
  footer?: React.ReactNode;
};

const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  activitySections,
  editor,
  preview,
  panel,
  footer,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    activitySections[0]?.id ?? null
  );

  const activeSection = activitySections.find((s) => s.id === activeSectionId);
  const sidebarOpen = activeSectionId !== null;

  const toggleSection = (id: string) => {
    setActiveSectionId((current) => (current === id ? null : id));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-ds-bg text-ds-text overflow-hidden">
      {/* Header */}
      <header className="h-11 flex-shrink-0 flex items-center px-4 bg-ds-surface border-b border-ds-border">
        {header}
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Activity bar */}
        <div className="w-10 flex-shrink-0 flex flex-col items-center py-2 gap-1 bg-ds-surface border-r border-ds-border">
          {activitySections.map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              aria-label={section.ariaLabel}
              title={section.ariaLabel}
              className={`
                w-8 h-8 flex items-center justify-center rounded transition-colors
                focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-1 focus:ring-offset-ds-surface
                ${activeSectionId === section.id
                  ? 'text-ds-accent-btn-text bg-ds-accent-subtle'
                  : 'text-ds-text-dim hover:text-ds-text-muted'
                }
              `}
            >
              {section.icon}
            </button>
          ))}
        </div>

        {/* Sidebar panel */}
        {sidebarOpen && (
          <div className="w-56 flex-shrink-0 flex flex-col bg-ds-surface border-r border-ds-border overflow-y-auto">
            <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
              {activeSection?.ariaLabel}
            </div>
            <div className="flex-1 px-2 pb-3">
              {activeSection?.content}
            </div>
          </div>
        )}

        {/* Editor area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-ds-bg">
          {editor}
        </main>

        {/* Preview pane */}
        {preview && (
          <aside className="w-2/5 flex-shrink-0 bg-ds-bg border-l border-ds-border flex flex-col overflow-hidden">
            <div className="px-3 py-1 text-[10px] text-ds-text-dim uppercase tracking-wider bg-ds-surface border-b border-ds-border flex-shrink-0">
              Preview
            </div>
            <div className="flex-1 overflow-hidden">
              {preview}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom panel */}
      {panel}

      {/* Status bar */}
      {footer && (
        <footer className="h-7 flex-shrink-0 flex items-center justify-between px-4 bg-ds-surface border-t border-ds-border text-[11px] text-ds-text-dim">
          {footer}
        </footer>
      )}
    </div>
  );
};

export { FilesIcon, AssetsIcon };
export default ProjectShell;
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass (ProjectShell has no unit tests; Preview change is structural only).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectShell/index.tsx src/components/TreePanel/index.tsx \
        src/components/Preview/index.tsx
git commit -m "feat: ProjectShell activity bar + collapsible sidebar + panel slot; Preview simplified"
```

---

## Task 8: EditPage — wire all new components together

**Files:**
- Modify: `src/pages/EditPage.tsx`

This is the integration task. `EditPage` now uses `FileTabs`, `BottomPanel`, `useAutoSave`, the new `ProjectShell` `activitySections` API, and passes the breadcrumb header.

- [ ] **Step 1: Read current EditPage.tsx to understand what needs to change**

The current `EditPage` uses `ProjectShell` with `header`, `sidebar`, `editor`, `preview`, `footer` props. The new `ProjectShell` uses `header`, `activitySections`, `editor`, `preview`, `panel`, `footer`.

- [ ] **Step 2: Replace EditPage.tsx**

```tsx
// src/pages/EditPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { useFilesForProject } from '../hooks/useFilesForProject';
import { removeFile } from '../features/files/filesSlice';
import { selectFile } from '../features/ui/uiSlice';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import ErrorBoundary from '../components/ErrorBoundary';
import { useCompiler } from '../hooks/useCompiler';
import { useRunnerMessages } from '../hooks/useRunnerMessages';
import { useAutoSave } from '../hooks/useAutoSave';
import TreePanel from '../components/TreePanel';
import ProjectShell, { FilesIcon, AssetsIcon } from '../components/ProjectShell';
import FileTabs from '../components/FileTabs';
import BottomPanel from '../components/BottomPanel';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);
  const logs = useSelector((state: RootState) => state.session.logs);
  const dirtyFileIds = useSelector((state: RootState) => state.files.dirtyFileIds);

  const { run, stop, isRunning } = useCompiler(id ?? '');
  useRunnerMessages();
  useAutoSave();

  // Hooks must be called unconditionally — above early return
  const selectedFile = useSelectedFile(id ?? '');
  const files = useFilesForProject(id ?? '');

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
      <div className="min-h-screen bg-ds-bg flex items-center justify-center text-ds-error text-sm">
        Project not found.
      </div>
    );
  }

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  const handleTabSelect = (fileId: string) => {
    dispatch(selectFile({ projectId: project.id, fileId }));
  };

  const handleTabClose = (fileId: string) => {
    dispatch(removeFile(fileId));
  };

  return (
    <ProjectShell
      header={
        <>
          <span className="font-bold text-sm text-ds-accent-btn-text tracking-wide mr-3">
            softBASIC
          </span>
          <span className="text-ds-text-dim text-sm">{project.name}</span>
          {selectedFile && (
            <>
              <span className="text-ds-text-dim mx-1.5 text-sm">›</span>
              <span className="text-ds-text-muted text-sm">{selectedFile.name}</span>
            </>
          )}
          <div className="flex-1" />
          {!isRunning ? (
            <button
              onClick={run}
              className="bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ds-accent"
              aria-label="Run project"
            >
              ▶ Run
            </button>
          ) : (
            <button
              onClick={stop}
              className="border border-ds-error text-ds-error text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-ds-error-bg transition focus:outline-none focus:ring-2 focus:ring-ds-error"
              aria-label="Stop project"
            >
              ■ Stop
            </button>
          )}
        </>
      }
      activitySections={[
        {
          id: 'files',
          icon: <FilesIcon />,
          ariaLabel: 'Files',
          content: <TreePanel projectId={project.id} />,
        },
      ]}
      editor={
        <ErrorBoundary
          key={project.id}
          fallback={<p className="p-4 text-ds-error text-sm">Editor failed to load.</p>}
        >
          <div className="flex flex-col h-full">
            <FileTabs
              files={files}
              selectedFileId={selectedFile?.id}
              dirtyFileIds={dirtyFileIds}
              onSelect={handleTabSelect}
              onClose={handleTabClose}
            />
            <div className="flex-1 min-h-0">
              <Editor onChange={handleChange} file={selectedFile} height="100%" />
            </div>
          </div>
        </ErrorBoundary>
      }
      preview={
        isRunning ? (
          <ErrorBoundary
            key={project.id}
            fallback={<p className="p-4 text-ds-error text-sm">Preview failed to load.</p>}
          >
            <Preview transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
      panel={<BottomPanel logs={logs} />}
      footer={
        <>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2 · UTF-8 · LF</span>
        </>
      }
    />
  );
};

export default EditPage;
```

Note: The Assets section is intentionally omitted from `activitySections` here as it's already inside `TreePanel`. If you want a separate Assets icon in the activity bar, split `TreePanel` into separate `FileTree` and `AssetTree` renders and pass them as two `activitySections`.

- [ ] **Step 3: Update Editor to accept height="100%"**

The editor currently has `height="90vh"` hardcoded in its call site; the new EditPage passes `height="100%"`. No change to `Editor/index.tsx` itself — it already accepts `height` as a prop and passes it to Monaco.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EditPage.tsx
git commit -m "feat: EditPage integrates FileTabs, BottomPanel, useAutoSave, new ProjectShell API"
```

---

## Task 9: FileTree keyboard navigation + accessibility

**Files:**
- Modify: `src/components/FileTree/index.tsx`
- Test: `tests/ui/components/FileTree/FileTree.test.tsx` (new)

- [ ] **Step 1: Write failing tests**

Create `tests/ui/components/FileTree/FileTree.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import FileTree from '../../../../src/components/FileTree';

const makeStore = () => {
  const store = configureStore({ reducer: { files: filesReducer, ui: uiReducer } });
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'utils.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('renders file list with role="listbox"', () => {
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  expect(screen.getByRole('listbox', { name: /files/i })).toBeInTheDocument();
});

test('ArrowDown moves focus to next file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[0].focus();
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(items[1]);
});

test('ArrowUp moves focus to previous file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[1].focus();
  await user.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(items[0]);
});

test('Enter selects focused file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[1].focus();
  await user.keyboard('{Enter}');
  expect(store.getState().ui.selectedFileByProject['p1']).toBe('f2');
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run tests/ui/components/FileTree/FileTree.test.tsx 2>&1 | tail -10
```

Expected: fails — no `listbox` role, no keyboard handling.

- [ ] **Step 3: Update FileTree with keyboard navigation**

```tsx
// src/components/FileTree/index.tsx
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile } from '../../features/files/filesSlice';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';

type FileTreeProps = { projectId: string };

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none selected
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file: IFile = { id: uuidv4(), name: filename, source: '', projectId };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      } else {
        dispatch(clearProjectSelection(projectId));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, fileId: string) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = itemRefs.current[index + 1];
        if (next) next.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = itemRefs.current[index - 1];
        if (prev) prev.focus();
        break;
      }
      case 'Enter':
        e.preventDefault();
        handleFileSelected(fileId);
        break;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
          Files
        </span>
        <ModalWithInput
          onSubmit={handleNewFile}
          openText="+"
          saveText="Save"
          closeText="Cancel"
          title="New file"
          placeholder="filename.bas"
        />
      </div>
      <ul
        role="listbox"
        aria-label="Files"
        className="space-y-0.5"
      >
        {files.map((file, index) => (
          <li
            key={file.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            role="option"
            aria-selected={file.id === selectedFileId}
            tabIndex={0}
            onClick={() => handleFileSelected(file.id)}
            onKeyDown={(e) => handleKeyDown(e, index, file.id)}
            className={`
              group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-ds-accent
              ${file.id === selectedFileId
                ? 'bg-ds-accent-subtle text-ds-text'
                : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
              }
            `}
          >
            <span className="truncate">{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
                aria-label={`Delete ${file.name}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileTree;
```

- [ ] **Step 4: Run FileTree tests**

```bash
npx vitest run tests/ui/components/FileTree/FileTree.test.tsx 2>&1 | tail -10
```

Expected: all 4 pass.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FileTree/index.tsx tests/ui/components/FileTree/FileTree.test.tsx
git commit -m "feat: FileTree keyboard navigation (ArrowUp/Down, Enter), aria-role listbox/option (L1)"
```

---

## Task 10: Final style migration — replace remaining gray-* tokens

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx`
- Modify: `src/components/Editor/index.tsx`
- Modify: any remaining component with `gray-*` or hardcoded colours

- [ ] **Step 1: Find all remaining gray-* usages**

```bash
cd /c/Users/jsnap/source/repos/Basic4WebGL
grep -r "text-gray\|bg-gray\|border-gray" src/components src/pages --include="*.tsx" -l
```

Read each file listed and replace with appropriate `ds-*` tokens using the mapping:
- `bg-gray-900` / `bg-gray-950` → `bg-ds-bg`
- `bg-gray-800` → `bg-ds-surface`
- `bg-gray-700` → `bg-ds-surface-2`
- `border-gray-700` → `border-ds-border`
- `text-white` → `text-ds-text`
- `text-gray-400` → `text-ds-text-muted`
- `text-gray-500` / `text-gray-600` → `text-ds-text-dim`
- `text-red-400` → `text-ds-error`
- `text-green-400` → `text-ds-success`
- `text-orange-400` → `text-ds-warning`

- [ ] **Step 2: Update AssetTree aria-label**

In `src/components/TreePanel/AssetTree/index.tsx`, find the upload file button and add `aria-label="Upload asset"` if not already present.

- [ ] **Step 3: Run full suite**

```bash
npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "style: migrate all remaining gray-* classes to ds-* design tokens, add aria-labels (L1)"
```

---

## Final verification

- [ ] **Run all tests one last time**

```bash
cd /c/Users/jsnap/source/repos/Basic4WebGL
npx vitest run 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Check success criteria from spec**

```
- [ ] All existing tests pass (217+)
- [ ] No new TypeScript errors (npx tsc --noEmit)
- [ ] Modal focus trap: Tab cycles, Escape closes, focus returns to trigger
- [ ] Dirty dot appears when typing, disappears ~500ms after last keystroke
- [ ] Activity bar toggles sidebar open/closed
- [ ] Bottom panel collapses/expands; Console and Problems tabs switch correctly
- [ ] Projects card grid renders at 1/2/3 columns
- [ ] FileTree: ArrowUp/Down moves focus, Enter selects, all buttons have aria-labels
```
