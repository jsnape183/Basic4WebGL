# File Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to drag-reorder files in the FileTree panel to control compilation order.

**Architecture:** Add a `fileOrder: Record<string, string[]>` field to the Redux files slice; update `useFilesForProject` to return files in that order; wrap the FileTree list in `@dnd-kit/core` sortable context with a per-row drag handle that is the only drag trigger.

**Tech Stack:** TypeScript, React, Redux Toolkit, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, Vitest + Testing Library.

---

## Codebase Orientation

| File | Role |
|------|------|
| `src/features/files/filesSlice.ts` | Redux slice — add `fileOrder` state and `reorderFiles` action |
| `src/hooks/useFilesForProject.ts` | Hook that returns ordered files for a project |
| `src/components/FileTree/index.tsx` | FileTree component — wire up DndContext |
| `src/components/FileTree/SortableFileItem.tsx` | New: individual sortable file row with drag handle |
| `src/utils/reorder.ts` | New: pure array reorder utility |
| `tests/ui/features/files/filesSlice.test.ts` | Extend with fileOrder tests |
| `tests/ui/components/FileTree/FileTreeReorder.test.tsx` | New: drag handle presence test |

Run all tests with: `npx vitest run`
Run a single file: `npx vitest run tests/ui/features/files/filesSlice.test.ts`

---

## File Structure

**New files:**
- `src/utils/reorder.ts`
- `src/components/FileTree/SortableFileItem.tsx`
- `tests/ui/components/FileTree/FileTreeReorder.test.tsx`

**Modified files:**
- `src/features/files/filesSlice.ts`
- `src/hooks/useFilesForProject.ts`
- `src/components/FileTree/index.tsx`
- `tests/ui/features/files/filesSlice.test.ts`

---

## Task 1: `reorder` utility

**Files:**
- Create: `src/utils/reorder.ts`
- Create: `tests/ui/utils/reorder.test.ts`

A pure function that moves one element in an array from one index to another. Used by the Redux reducer and independently unit-tested.

- [ ] **Step 1: Write the failing test**

Create `tests/ui/utils/reorder.test.ts`:
```typescript
import { describe, test, expect } from 'vitest';
import { reorder } from '../../../src/utils/reorder';

describe('reorder', () => {
  test('moves an item forward in the list', () => {
    expect(reorder(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  test('moves an item backward in the list', () => {
    expect(reorder(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  test('moving to the same index returns an equivalent array', () => {
    expect(reorder(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  test('does not mutate the original array', () => {
    const original = ['a', 'b', 'c'];
    reorder(original, 0, 2);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/ui/utils/reorder.test.ts
```

Expected: FAIL — `reorder` is not defined

- [ ] **Step 3: Create `src/utils/reorder.ts`**

```typescript
export function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/utils/reorder.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```
git add src/utils/reorder.ts tests/ui/utils/reorder.test.ts
git commit -m "feat: add reorder utility"
```

---

## Task 2: Extend `filesSlice` with `fileOrder` state

**Files:**
- Modify: `src/features/files/filesSlice.ts`
- Modify: `tests/ui/features/files/filesSlice.test.ts`

Add `fileOrder: Record<string, string[]>` to the slice, update `addFile` and `removeFile` to maintain it, and add a new `reorderFiles` action.

- [ ] **Step 1: Write failing tests**

Add to the end of `tests/ui/features/files/filesSlice.test.ts`:

```typescript
// --- fileOrder ---

const initial2: IFilesState = { byId: {}, dirtyFileIds: [], fileOrder: {} };

describe('fileOrder', () => {
  test('addFile appends the new file id to fileOrder for the project', () => {
    const s1 = filesReducer(initial2, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    const s2 = filesReducer(s1, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    expect(s2.fileOrder['p1']).toEqual(['f1', 'f2']);
  });

  test('addFile creates the order array when the project has no files yet', () => {
    const s = filesReducer(initial2, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p99' }));
    expect(s.fileOrder['p99']).toEqual(['f1']);
  });

  test('removeFile removes the id from fileOrder', () => {
    let s = filesReducer(initial2, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, removeFile('f1'));
    expect(s.fileOrder['p1']).toEqual(['f2']);
  });

  test('reorderFiles moves a file id from one index to another', () => {
    let s = filesReducer(initial2, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f3', name: 'c.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, reorderFiles({ projectId: 'p1', fromIndex: 0, toIndex: 2 }));
    expect(s.fileOrder['p1']).toEqual(['f2', 'f3', 'f1']);
  });

  test('reorderFiles does nothing when the project has no order entry', () => {
    const s = filesReducer(initial2, reorderFiles({ projectId: 'no-such', fromIndex: 0, toIndex: 1 }));
    expect(s.fileOrder['no-such']).toBeUndefined();
  });
});
```

Also update the first existing test that checks initial state — it will fail because `fileOrder: {}` is now part of the initial state:

Find this test:
```typescript
test('initial state has no selectedFileId field', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {}, dirtyFileIds: [] });
  expect('selectedFileId' in state).toBe(false);
});
```

Replace with:
```typescript
test('initial state shape is correct', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {}, dirtyFileIds: [], fileOrder: {} });
  expect('selectedFileId' in state).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/features/files/filesSlice.test.ts
```

Expected: FAIL — `reorderFiles` is not defined, `initial2` references missing `fileOrder` field

- [ ] **Step 3: Update `src/features/files/filesSlice.ts`**

Replace the entire file:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reorder } from '../../utils/reorder';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
  fileOrder: Record<string, string[]>;
}

const initialState: IFilesState = {
  byId: {},
  dirtyFileIds: [],
  fileOrder: {},
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      const { projectId, id } = action.payload;
      if (!state.fileOrder[projectId]) {
        state.fileOrder[projectId] = [];
      }
      state.fileOrder[projectId].push(id);
    },
    updateFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      // Always replace the array so React sees a new reference and re-triggers useEffect
      state.dirtyFileIds = [
        ...state.dirtyFileIds.filter((id) => id !== action.payload.id),
        action.payload.id,
      ];
    },
    removeFile: (state, action: PayloadAction<string>) => {
      const file = state.byId[action.payload];
      if (file) {
        const order = state.fileOrder[file.projectId];
        if (order) {
          state.fileOrder[file.projectId] = order.filter((id) => id !== action.payload);
        }
      }
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
    reorderFiles: (
      state,
      action: PayloadAction<{ projectId: string; fromIndex: number; toIndex: number }>
    ) => {
      const { projectId, fromIndex, toIndex } = action.payload;
      const order = state.fileOrder[projectId];
      if (!order) return;
      state.fileOrder[projectId] = reorder(order, fromIndex, toIndex);
    },
  },
});

export const { addFile, updateFile, removeFile, clearAllDirty, reorderFiles } = filesSlice.actions;
export default filesSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/features/files/filesSlice.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```
git add src/features/files/filesSlice.ts tests/ui/features/files/filesSlice.test.ts
git commit -m "feat: add fileOrder state and reorderFiles action to filesSlice"
```

---

## Task 3: Update `useFilesForProject` to honour `fileOrder`

**Files:**
- Modify: `src/hooks/useFilesForProject.ts`

The hook currently returns `Object.values(byId).filter(...)` which has no stable order. Change it to map `fileOrder[projectId]` → file objects, with a fallback for existing persisted state that predates this field.

- [ ] **Step 1: Replace `src/hooks/useFilesForProject.ts`**

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useFilesForProject = (projectId: string): IFile[] => {
  return useSelector((state: RootState) => {
    const order = state.files.fileOrder[projectId];
    if (!order || order.length === 0) {
      // Fallback for persisted state that predates fileOrder
      return Object.values(state.files.byId).filter(
        (file) => file.projectId === projectId
      ) as IFile[];
    }
    return order
      .map((id) => state.files.byId[id])
      .filter((file): file is IFile => Boolean(file));
  });
};
```

- [ ] **Step 2: Run full suite**

```
npx vitest run
```

Expected: all tests pass (no new tests needed — ordering correctness is covered by the slice tests; the hook's behaviour is exercised by existing FileTree UI tests)

- [ ] **Step 3: Commit**

```
git add src/hooks/useFilesForProject.ts
git commit -m "feat: useFilesForProject returns files in fileOrder sequence"
```

---

## Task 4: Install dnd-kit and create `SortableFileItem`

**Files:**
- Install: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Create: `src/components/FileTree/SortableFileItem.tsx`
- Create: `tests/ui/components/FileTree/FileTreeReorder.test.tsx`

`SortableFileItem` is a single file row that uses `useSortable` from dnd-kit. The drag handle (`⠿` button) is the only element that receives the drag `listeners` — clicking anywhere else on the row still selects the file normally.

- [ ] **Step 1: Install packages**

```
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `node_modules` and `package.json`

- [ ] **Step 2: Write the failing UI test**

Create `tests/ui/components/FileTree/FileTreeReorder.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import FileTree from '../../../../src/components/FileTree';

// dnd-kit uses ResizeObserver internally — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const makeStore = () => {
  const store = configureStore({ reducer: { files: filesReducer, ui: uiReducer } });
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'Car.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('drag handle button is rendered for each file', () => {
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const handles = screen.getAllByRole('button', { name: 'Drag to reorder' });
  expect(handles).toHaveLength(2);
});
```

- [ ] **Step 3: Run test to verify it fails**

```
npx vitest run tests/ui/components/FileTree/FileTreeReorder.test.tsx
```

Expected: FAIL — `Drag to reorder` buttons do not exist yet

- [ ] **Step 4: Create `src/components/FileTree/SortableFileItem.tsx`**

```typescript
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IFile } from '../../features/files/filesSlice';

type SortableFileItemProps = {
  file: IFile;
  isSelected: boolean;
  showDelete: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  itemRef: (el: HTMLLIElement | null) => void;
};

const SortableFileItem: React.FC<SortableFileItemProps> = ({
  file,
  isSelected,
  showDelete,
  onSelect,
  onDelete,
  onKeyDown,
  itemRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={(el) => { setNodeRef(el); itemRef(el); }}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      style={style}
      onClick={() => onSelect(file.id)}
      onKeyDown={onKeyDown}
      className={`
        group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-ds-accent
        ${isSelected
          ? 'bg-ds-accent-subtle text-ds-text font-semibold'
          : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
        }
      `}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <span className="truncate flex-1">{file.name}</span>
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity flex-shrink-0"
          aria-label={`Delete ${file.name}`}
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </li>
  );
};

export default SortableFileItem;
```

- [ ] **Step 5: Run test to verify it still fails** (FileTree not yet updated)

```
npx vitest run tests/ui/components/FileTree/FileTreeReorder.test.tsx
```

Expected: still FAIL — FileTree doesn't render `SortableFileItem` yet

- [ ] **Step 6: Run full suite to confirm no regressions**

```
npx vitest run
```

Expected: all existing tests pass; the new test is the only failure

- [ ] **Step 7: Commit**

```
git add src/components/FileTree/SortableFileItem.tsx tests/ui/components/FileTree/FileTreeReorder.test.tsx
git commit -m "feat: add SortableFileItem component with drag handle"
```

---

## Task 5: Wire up `DndContext` in `FileTree`

**Files:**
- Modify: `src/components/FileTree/index.tsx`

Replace the plain `<li>` elements with `<SortableFileItem>` and wrap the list in `DndContext` + `SortableContext`. On drag end, dispatch `reorderFiles`.

- [ ] **Step 1: Replace `src/components/FileTree/index.tsx`**

```typescript
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile, reorderFiles } from '../../features/files/filesSlice';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';
import SortableFileItem from './SortableFileItem';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none is selected for this project
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: normaliseFileName(filename),
      source: '',
      projectId,
    };
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = files.findIndex((f) => f.id === active.id);
    const toIndex = files.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderFiles({ projectId, fromIndex, toIndex }));
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

  const fileIds = files.map((f) => f.id);

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
          closeText="Close"
          title="New file"
          placeholder="e.g. Main"
          validate={validateFileName}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
          <ul
            role="listbox"
            aria-label="Files"
            className="space-y-0.5"
          >
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                showDelete={files.length > 1}
                onSelect={handleFileSelected}
                onDelete={handleDeleteFile}
                onKeyDown={(e) => handleKeyDown(e, index, file.id)}
                itemRef={(el) => { itemRefs.current[index] = el; }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FileTree;
```

- [ ] **Step 2: Run the reorder test to verify it passes**

```
npx vitest run tests/ui/components/FileTree/FileTreeReorder.test.tsx
```

Expected: PASS

- [ ] **Step 3: Run the full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```
git add src/components/FileTree/index.tsx
git commit -m "feat: wire up drag-to-reorder in FileTree with dnd-kit"
```

---

## Self-Review Checklist (for the implementer)

- [ ] `npx vitest run` passes with zero failures
- [ ] Drag handle button has `aria-label="Drag to reorder"`
- [ ] Clicking anywhere on the row (not the handle) still selects the file
- [ ] `dim x as Type` (no args) still works — `dim x as Type(args)` still works
- [ ] Adding a new file appends it to the bottom of the list
- [ ] Deleting a file removes it from `fileOrder`
- [ ] `useFilesForProject` fallback works — a store with no `fileOrder` key still returns the files
