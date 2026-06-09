# Asset Preview & Text Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users double-click assets to open them in editor tabs — image viewer for images, textarea editor for text/JSON — and create new blank text files from the asset panel.

**Architecture:** Open asset tabs live in local React state in `EditPage` (not Redux); Redux is only touched when saving (`updateAsset`) or creating (`addAsset`). A `getAssetType` helper routes by file extension; `FileTabs` is extended with optional asset-tab props so both file and asset tabs render in the same bar.

**Tech Stack:** React, Redux Toolkit, React Testing Library, Vitest, Tailwind/DS CSS variables

---

## File Map

**Create:**
- `src/components/AssetPreview/getAssetType.ts` — pure helper, maps extension → `'image' | 'text'`
- `src/components/AssetPreview/ImagePreview.tsx` — `<img>` centred in tab, `onError` fallback
- `src/components/AssetPreview/TextEditor.tsx` — textarea + Save, local draft state, `onDirtyChange` callback
- `src/components/AssetPreview/index.tsx` — wrapper, delegates to ImagePreview or TextEditor
- `src/components/TreePanel/AssetTree/validateAssetName.ts` — pure validator, folder-scoped uniqueness
- `tests/ui/components/AssetPreview/getAssetType.test.ts`
- `tests/ui/components/AssetPreview/ImagePreview.test.tsx`
- `tests/ui/components/AssetPreview/TextEditor.test.tsx`
- `tests/ui/components/AssetPreview/AssetPreview.test.tsx`
- `tests/ui/components/AssetTree/validateAssetName.test.ts`

**Modify:**
- `src/components/FileTabs/index.tsx` — add optional `assetTabs`, `selectedAssetTabId`, `dirtyAssetIds`, `onSelectAsset`, `onCloseAsset` props
- `src/components/TreePanel/AssetTree/index.tsx` — `onOpenAsset` prop, double-click on rows, "New file" modal
- `src/components/TreePanel/index.tsx` — forward `onOpenAsset` to `AssetTree`
- `src/pages/EditPage.tsx` — local state for open/dirty asset tabs, unified tab rendering, conditional editor/preview
- `tests/ui/components/FileTabs/FileTabs.test.tsx` — add asset-tab tests

---

### Task 1: `getAssetType` helper

**Files:**
- Create: `src/components/AssetPreview/getAssetType.ts`
- Test: `tests/ui/components/AssetPreview/getAssetType.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/ui/components/AssetPreview/getAssetType.test.ts
import { describe, test, expect } from 'vitest';
import { getAssetType } from '../../../../src/components/AssetPreview/getAssetType';

describe('getAssetType', () => {
  test.each(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'])(
    'extension %s → image',
    (ext) => expect(getAssetType(`photo${ext}`)).toBe('image')
  );

  test('PNG in uppercase → image', () => expect(getAssetType('photo.PNG')).toBe('image'));

  test.each(['.json', '.txt', '.csv', '.bas', '.xml'])(
    'extension %s → text',
    (ext) => expect(getAssetType(`file${ext}`)).toBe('text')
  );

  test('unknown extension → text', () => expect(getAssetType('file.unknown')).toBe('text'));
  test('no extension → text', () => expect(getAssetType('nodotfile')).toBe('text'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/components/AssetPreview/getAssetType.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

```ts
// src/components/AssetPreview/getAssetType.ts
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);

export function getAssetType(name: string): 'image' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) ? 'image' : 'text';
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/components/AssetPreview/getAssetType.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetPreview/getAssetType.ts tests/ui/components/AssetPreview/getAssetType.test.ts
git commit -m "feat: add getAssetType helper"
```

---

### Task 2: `ImagePreview` component

**Files:**
- Create: `src/components/AssetPreview/ImagePreview.tsx`
- Test: `tests/ui/components/AssetPreview/ImagePreview.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment jsdom
// tests/ui/components/AssetPreview/ImagePreview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ImagePreview from '../../../../src/components/AssetPreview/ImagePreview';
import { IAsset } from '../../../../src/features/assets/assetsSlice';

const asset: IAsset = {
  id: 'a1', name: 'logo.png',
  content: 'data:image/png;base64,abc123',
  projectId: 'p1', folderId: null, fullName: 'logo.png',
};

describe('ImagePreview', () => {
  test('renders image with src from asset content', () => {
    render(<ImagePreview asset={asset} />);
    expect(screen.getByRole('img', { name: 'logo.png' })).toHaveAttribute(
      'src',
      'data:image/png;base64,abc123'
    );
  });

  test('shows error message when image fails to load', () => {
    render(<ImagePreview asset={asset} />);
    fireEvent.error(screen.getByRole('img', { name: 'logo.png' }));
    expect(screen.getByText(/unable to display image/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/components/AssetPreview/ImagePreview.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/components/AssetPreview/ImagePreview.tsx
import React, { useState } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';

type Props = { asset: IAsset };

const ImagePreview: React.FC<Props> = ({ asset }) => {
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {error ? (
        <p className="text-ds-text-muted text-sm">Unable to display image.</p>
      ) : (
        <img
          src={asset.content}
          alt={asset.name}
          onError={() => setError(true)}
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  );
};

export default ImagePreview;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/components/AssetPreview/ImagePreview.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetPreview/ImagePreview.tsx tests/ui/components/AssetPreview/ImagePreview.test.tsx
git commit -m "feat: add ImagePreview component"
```

---

### Task 3: `TextEditor` component

**Files:**
- Create: `src/components/AssetPreview/TextEditor.tsx`
- Test: `tests/ui/components/AssetPreview/TextEditor.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment jsdom
// tests/ui/components/AssetPreview/TextEditor.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import TextEditor from '../../../../src/components/AssetPreview/TextEditor';

// "hello" in base64 = aGVsbG8=
const makeAsset = (content = 'data:text/plain;base64,aGVsbG8='): IAsset => ({
  id: 'a1', name: 'notes.txt', content,
  projectId: 'p1', folderId: null, fullName: 'notes.txt',
});

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

function renderEditor(asset = makeAsset(), onDirtyChange = vi.fn()) {
  const store = makeStore();
  render(
    <Provider store={store}>
      <TextEditor asset={asset} onDirtyChange={onDirtyChange} />
    </Provider>
  );
  return { store };
}

describe('TextEditor', () => {
  test('renders decoded asset content in textarea on mount', () => {
    renderEditor();
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  test('does not call onDirtyChange on initial render', () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    expect(onDirtyChange).not.toHaveBeenCalled();
  });

  test('calls onDirtyChange(id, true) when textarea content changes', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await user.type(screen.getByRole('textbox'), ' world');
    expect(onDirtyChange).toHaveBeenCalledWith('a1', true);
  });

  test('clicking Save dispatches updateAsset with re-encoded content', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'world');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const state = store.getState() as ReturnType<typeof store.getState>;
    const expectedContent = 'data:text/plain;base64,' + btoa('world');
    expect(state.assets.byId['a1']?.content).toBe(expectedContent);
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await user.type(screen.getByRole('textbox'), ' world');
    onDirtyChange.mockClear();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenCalledWith('a1', false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/components/AssetPreview/TextEditor.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/components/AssetPreview/TextEditor.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch } from '../../store';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

function decodeContent(content: string): string {
  const comma = content.indexOf(',');
  if (comma === -1) return '';
  try {
    return atob(content.slice(comma + 1));
  } catch {
    return '';
  }
}

const TextEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [draftText, setDraftText] = useState(() => decodeContent(asset.content));
  const storedText = decodeContent(asset.content);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDraftText(newText);
    onDirtyChange?.(asset.id, newText !== storedText);
  };

  const handleSave = () => {
    const encoded = 'data:text/plain;base64,' + btoa(draftText);
    dispatch(updateAsset({ ...asset, content: encoded }));
    onDirtyChange?.(asset.id, false);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <textarea
        aria-label="Asset text content"
        value={draftText}
        onChange={handleChange}
        className="flex-1 resize-none bg-ds-bg text-ds-text border border-ds-border rounded p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ds-accent"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-1.5 rounded hover:opacity-90 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/components/AssetPreview/TextEditor.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetPreview/TextEditor.tsx tests/ui/components/AssetPreview/TextEditor.test.tsx
git commit -m "feat: add TextEditor component"
```

---

### Task 4: `AssetPreview` wrapper

**Files:**
- Create: `src/components/AssetPreview/index.tsx`
- Test: `tests/ui/components/AssetPreview/AssetPreview.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment jsdom
// tests/ui/components/AssetPreview/AssetPreview.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import AssetPreview from '../../../../src/components/AssetPreview';

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

const imageAsset: IAsset = {
  id: 'a1', name: 'photo.png',
  content: 'data:image/png;base64,abc',
  projectId: 'p1', folderId: null, fullName: 'photo.png',
};

// "{}" in base64 = e30=
const textAsset: IAsset = {
  id: 'a2', name: 'config.json',
  content: 'data:text/plain;base64,e30=',
  projectId: 'p1', folderId: null, fullName: 'config.json',
};

describe('AssetPreview', () => {
  test('renders ImagePreview for image assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={imageAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument();
  });

  test('renders TextEditor for text assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={textAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/components/AssetPreview/AssetPreview.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the wrapper**

```tsx
// src/components/AssetPreview/index.tsx
import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { getAssetType } from './getAssetType';
import ImagePreview from './ImagePreview';
import TextEditor from './TextEditor';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  if (getAssetType(asset.name) === 'image') {
    return <ImagePreview asset={asset} />;
  }
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};

export default AssetPreview;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/components/AssetPreview/AssetPreview.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetPreview/index.tsx tests/ui/components/AssetPreview/AssetPreview.test.tsx
git commit -m "feat: add AssetPreview wrapper component"
```

---

### Task 5: Extend `FileTabs` for asset tabs

**Files:**
- Modify: `src/components/FileTabs/index.tsx`
- Modify: `tests/ui/components/FileTabs/FileTabs.test.tsx`

- [ ] **Step 1: Add the new failing tests**

Append these tests to the bottom of `tests/ui/components/FileTabs/FileTabs.test.tsx`:

```tsx
// --- Asset tab tests ---

const assetTabs = [{ id: 'a1', name: 'config.json' }];

const assetTabProps = {
  files,
  selectedFileId: 'f1' as string | undefined,
  dirtyFileIds: [] as string[],
  onSelect: vi.fn(),
  onClose: vi.fn(),
  assetTabs,
  selectedAssetTabId: undefined as string | undefined,
  dirtyAssetIds: [] as string[],
  onSelectAsset: vi.fn(),
  onCloseAsset: vi.fn(),
};

test('renders asset tab alongside file tabs', () => {
  render(<FileTabs {...assetTabProps} />);
  expect(screen.getByText('config.json')).toBeInTheDocument();
});

test('active asset tab has aria-selected="true"', () => {
  render(<FileTabs {...assetTabProps} selectedFileId={undefined} selectedAssetTabId="a1" />);
  expect(screen.getByRole('tab', { name: /config\.json/ })).toHaveAttribute('aria-selected', 'true');
});

test('dirty asset tab shows ● indicator', () => {
  render(<FileTabs {...assetTabProps} selectedAssetTabId="a1" dirtyAssetIds={['a1']} />);
  expect(screen.getByRole('tab', { name: /config\.json/ }).textContent).toContain('●');
});

test('clicking an asset tab calls onSelectAsset with asset id', async () => {
  const user = userEvent.setup();
  const onSelectAsset = vi.fn();
  render(<FileTabs {...assetTabProps} onSelectAsset={onSelectAsset} />);
  await user.click(screen.getByRole('tab', { name: /config\.json/ }));
  expect(onSelectAsset).toHaveBeenCalledWith('a1');
});

test('asset tab close button calls onCloseAsset with asset id', async () => {
  const user = userEvent.setup();
  const onCloseAsset = vi.fn();
  render(<FileTabs {...assetTabProps} onCloseAsset={onCloseAsset} />);
  await user.click(screen.getByRole('button', { name: /close config\.json/i }));
  expect(onCloseAsset).toHaveBeenCalledWith('a1');
});

test('renders no asset tabs when assetTabs prop is omitted', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.queryByRole('tab', { name: /config\.json/ })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```
npx vitest run tests/ui/components/FileTabs/FileTabs.test.tsx
```

Expected: original 5 tests pass, new 6 tests fail.

- [ ] **Step 3: Extend `FileTabs`**

Replace the entire `src/components/FileTabs/index.tsx` with:

```tsx
import React from 'react';
import { IFile } from '../../features/files/filesSlice';

type AssetTabDescriptor = { id: string; name: string };

type FileTabsProps = {
  files: IFile[];
  selectedFileId: string | undefined;
  dirtyFileIds: string[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  // optional asset tabs
  assetTabs?: AssetTabDescriptor[];
  selectedAssetTabId?: string | undefined;
  dirtyAssetIds?: string[];
  onSelectAsset?: (id: string) => void;
  onCloseAsset?: (id: string) => void;
};

const FileTabs: React.FC<FileTabsProps> = ({
  files,
  selectedFileId,
  dirtyFileIds,
  onSelect,
  onClose,
  assetTabs = [],
  selectedAssetTabId,
  dirtyAssetIds = [],
  onSelectAsset,
  onCloseAsset,
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

      {assetTabs.map((asset) => {
        const isActive = asset.id === selectedAssetTabId;
        const isDirty = dirtyAssetIds.includes(asset.id);

        return (
          <div
            key={`asset:${asset.id}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectAsset?.(asset.id)}
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
            <span>{asset.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseAsset?.(asset.id); }}
              className="ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none"
              aria-label={`Close ${asset.name}`}
              tabIndex={-1}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileTabs;
```

- [ ] **Step 4: Run all FileTabs tests**

```
npx vitest run tests/ui/components/FileTabs/FileTabs.test.tsx
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/FileTabs/index.tsx tests/ui/components/FileTabs/FileTabs.test.tsx
git commit -m "feat: extend FileTabs to support asset tabs"
```

---

### Task 6: `validateAssetName` helper and `AssetTree` double-click + new file

**Files:**
- Create: `src/components/TreePanel/AssetTree/validateAssetName.ts`
- Modify: `src/components/TreePanel/AssetTree/index.tsx`
- Test: `tests/ui/components/AssetTree/validateAssetName.test.ts`

- [ ] **Step 1: Write the failing validation tests**

```ts
// tests/ui/components/AssetTree/validateAssetName.test.ts
import { describe, test, expect } from 'vitest';
import { validateAssetName } from '../../../../src/components/TreePanel/AssetTree/validateAssetName';

const existingAssets = [
  { name: 'hero.png', folderId: null },
  { name: 'config.json', folderId: 'folder1' },
];

describe('validateAssetName', () => {
  test('empty name returns an error', () => {
    expect(validateAssetName('', existingAssets, null)).not.toBeNull();
  });

  test('whitespace-only name returns an error', () => {
    expect(validateAssetName('   ', existingAssets, null)).not.toBeNull();
  });

  test('duplicate name in the SAME folder returns an error', () => {
    expect(validateAssetName('hero.png', existingAssets, null)).not.toBeNull();
  });

  test('error message includes the filename', () => {
    const err = validateAssetName('hero.png', existingAssets, null);
    expect(err).toContain('hero.png');
  });

  test('duplicate name in a DIFFERENT folder returns null (allowed)', () => {
    // 'config.json' exists in folder1, not in root (null)
    expect(validateAssetName('config.json', existingAssets, null)).toBeNull();
  });

  test('unique name returns null', () => {
    expect(validateAssetName('newfile.txt', existingAssets, null)).toBeNull();
  });

  test('duplicate name in a non-null folder returns an error', () => {
    // 'config.json' exists in folder1
    expect(validateAssetName('config.json', existingAssets, 'folder1')).not.toBeNull();
  });

  test('same filename in a different non-null folder returns null', () => {
    // 'config.json' is only in folder1, not in folder2
    expect(validateAssetName('config.json', existingAssets, 'folder2')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/components/AssetTree/validateAssetName.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

```ts
// src/components/TreePanel/AssetTree/validateAssetName.ts
export function validateAssetName(
  name: string,
  existingAssets: { name: string; folderId: string | null }[],
  folderId: string | null,
): string | null {
  if (!name.trim()) return 'Name cannot be empty.';
  const trimmed = name.trim();
  const exists = existingAssets.some(
    (a) => a.name === trimmed && (a.folderId ?? null) === folderId
  );
  if (exists) return `'${trimmed}' already exists in this folder.`;
  return null;
}
```

- [ ] **Step 4: Run helper tests to verify they pass**

```
npx vitest run tests/ui/components/AssetTree/validateAssetName.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 5: Update `AssetTree` — add `onOpenAsset` prop, double-click on rows, new file modal**

This is a large modification. Replace the entire `src/components/TreePanel/AssetTree/index.tsx` with the following. The only real changes vs the original are:
1. New `onOpenAsset` prop on `AssetTree` and `SortableAssetItem`
2. `onDoubleClick` on the `<li>` in `SortableAssetItem`
3. New "📄+" button in the header
4. Three new state vars + ref + useEffects for the "New file" modal
5. The `newFileModal` portal
6. `{newFileModal}` added to the return JSX

```tsx
// src/components/TreePanel/AssetTree/index.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RootState, AppDispatch } from '../../../store';
import { makeSelectFoldersBySection } from '../../../selectors/folderSelectors';
import { makeSelectAssetsByProject } from '../../../selectors/assetSelectors';
import { IAsset, addAsset, removeAsset, reorderAssets, setAssetFolder } from '../../../features/assets/assetsSlice';
import { IFolder, addFolder } from '../../../features/folders/foldersSlice';
import { renameFolderWithCascade, removeFolderWithCascade } from '../../../features/folders/folderThunks';
import { getFullName } from '../../../selectors/getFullName';
import FolderNode from '../../FileTree/FolderNode';
import ReactDOM from 'react-dom';
import { validateAssetName } from './validateAssetName';

type AssetTreeProps = {
  projectId: string;
  onOpenAsset?: (assetId: string) => void;
};

type SortableAssetItemProps = {
  asset: IAsset;
  depth: number;
  onRemove: (id: string) => void;
  onDoubleClick?: (id: string) => void;
};

const SortableAssetItem: React.FC<SortableAssetItemProps> = ({ asset, depth, onRemove, onDoubleClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style: React.CSSProperties = {
    paddingLeft: depth * 12,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      onDoubleClick={() => onDoubleClick?.(asset.id)}
      className="group flex items-center justify-between px-2 py-1 rounded text-xs text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text cursor-pointer"
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
      <span className="truncate flex-1">{asset.name}</span>
      <button
        onClick={() => onRemove(asset.id)}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
        aria-label={`Remove ${asset.name}`}
      >
        ×
      </button>
    </li>
  );
};

const MAX_BYTES = 4 * 1024 * 1024;

function countAssets(folderId: string, folders: IFolder[], allAssets: IAsset[]): number {
  const direct = allAssets.filter((a) => a.folderId === folderId).length;
  const children = folders.filter((f) => f.parentId === folderId);
  return direct + children.reduce((sum, cf) => sum + countAssets(cf.id, folders, allAssets), 0);
}

const AssetTree: React.FC<AssetTreeProps> = ({ projectId, onOpenAsset }) => {
  const dispatch = useDispatch<AppDispatch>();

  const selectAssets = useMemo(() => makeSelectAssetsByProject(projectId), [projectId]);
  const allAssets = useSelector(selectAssets);

  const inputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<IFolder | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New file modal state
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);

  const selectFolders = useMemo(() => makeSelectFoldersBySection(projectId, 'assets'), [projectId]);
  const folders: IFolder[] = useSelector(selectFolders);

  const assetOrder = useSelector((state: RootState) => state.assets.assetOrder);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (creatingFolderParent !== undefined) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0);
    }
  }, [creatingFolderParent]);

  useEffect(() => {
    if (deletingFolder) setTimeout(() => deleteInputRef.current?.focus(), 0);
  }, [deletingFolder]);

  useEffect(() => {
    if (!deletingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeletingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingFolder]);

  useEffect(() => {
    if (!renamingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRenamingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [renamingFolder]);

  useEffect(() => {
    if (dragOverFolderId === null) {
      if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
      return;
    }
    autoExpandTimerRef.current = setTimeout(() => {
      setOpenFolders((prev) => ({ ...prev, [dragOverFolderId]: true }));
    }, 500);
    return () => { if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current); };
  }, [dragOverFolderId]);

  useEffect(() => {
    if (newFileModalOpen) {
      setTimeout(() => newFileInputRef.current?.focus(), 0);
    }
  }, [newFileModalOpen]);

  useEffect(() => {
    if (!newFileModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNewFileModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newFileModalOpen]);

  const processFiles = async (fileList: FileList, targetFolderId: string | null = null) => {
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_BYTES) { alert(`${f.name} is too large (max 4 MB).`); return; }
    }
    await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const assetName = file.name;
              const fullName = getFullName(assetName, targetFolderId, folders);
              dispatch(addAsset({
                id: crypto.randomUUID(),
                name: assetName,
                content: reader.result as string,
                projectId,
                folderId: targetFolderId,
                fullName,
              }));
              resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderParent(undefined); return; }
    dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: creatingFolderParent ?? null, section: 'assets' }));
    setNewFolderName('');
    setCreatingFolderParent(undefined);
  };

  const handleCreateNewFile = () => {
    const name = newFileName.trim();
    const error = validateAssetName(name, allAssets, null);
    if (error) { setNewFileError(error); return; }
    const id = crypto.randomUUID();
    dispatch(addAsset({
      id,
      name,
      content: 'data:text/plain;base64,',
      projectId,
      folderId: null,
      fullName: name,
    }));
    onOpenAsset?.(id);
    setNewFileModalOpen(false);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    if (!over || active.id === over.id) return;

    const activeAsset = allAssets.find((a) => a.id === active.id);
    if (!activeAsset) return;

    if (String(over.id).startsWith('folder-drop:')) {
      const targetFolderId = String(over.id).replace('folder-drop:', '');
      const newFullName = getFullName(activeAsset.name, targetFolderId, folders);
      dispatch(setAssetFolder({ assetId: activeAsset.id, folderId: targetFolderId, fullName: newFullName }));
      setOpenFolders((prev) => ({ ...prev, [targetFolderId]: true }));
      return;
    }

    const overAsset = allAssets.find((a) => a.id === over.id);
    if (!overAsset || overAsset.folderId !== activeAsset.folderId) return;
    const key = `${projectId}:${activeAsset.folderId ?? 'root'}`;
    const orderIds = assetOrder[key];
    const levelAssets = orderIds?.length
      ? (orderIds.map((id) => allAssets.find((a) => a.id === id)).filter(Boolean) as IAsset[])
      : allAssets.filter((a) => (a.folderId ?? null) === (activeAsset.folderId ?? null));
    const fromIndex = levelAssets.findIndex((a) => a.id === active.id);
    const toIndex = levelAssets.findIndex((a) => a.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderAssets({ orderKey: key, fromIndex, toIndex }));
    }
  }, [allAssets, assetOrder, folders, dispatch, projectId]);

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    const scopedKey = `${projectId}:${parentId ?? 'root'}`;
    const orderIds = assetOrder[scopedKey];
    const levelAssets = orderIds?.length
      ? (orderIds.map((id) => allAssets.find((a) => a.id === id)).filter(Boolean) as IAsset[])
      : allAssets.filter((a) => (a.folderId ?? null) === parentId);
    const assetIds = levelAssets.map((a) => a.id);

    return (
      <>
        {levelFolders.map((folder) => {
          const isOpen = openFolders[folder.id] !== false;
          const count = countAssets(folder.id, folders, allAssets);
          return (
            <div key={folder.id}>
              <FolderNode
                folderId={folder.id}
                name={folder.name}
                isOpen={isOpen}
                itemCount={count}
                depth={depth}
                onToggle={() => setOpenFolders((prev) => ({ ...prev, [folder.id]: !isOpen }))}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => { setDeletingFolder(folder); setDeleteConfirmName(''); }}
              />
              {isOpen && (
                <div style={{ paddingLeft: (depth + 1) * 4 }}>
                  {renderLevel(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        <SortableContext items={assetIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {levelAssets.map((asset) => (
              <SortableAssetItem
                key={asset.id}
                asset={asset}
                depth={depth}
                onRemove={(id) => dispatch(removeAsset(id))}
                onDoubleClick={onOpenAsset}
              />
            ))}
          </ul>
        </SortableContext>

        {creatingFolderParent === parentId && (
          <div style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs">📁</span>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setCreatingFolderParent(undefined);
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name"
              className="flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
            />
          </div>
        )}
      </>
    );
  };

  // Rename modal
  const renameModal = renamingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-rename-folder-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-rename-folder-title" className="text-ds-text text-lg font-semibold mb-4">Rename folder</h2>
            <input
              ref={renameInputRef}
              autoFocus
              defaultValue={renamingFolder.name}
              type="text"
              placeholder="Folder name"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = (e.target as HTMLInputElement).value.trim();
                  if (name && name !== renamingFolder.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder.id, name }));
                  }
                  setRenamingFolder(null);
                }
                if (e.key === 'Escape') setRenamingFolder(null);
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const name = renameInputRef.current?.value.trim();
                  if (name && name !== renamingFolder!.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder!.id, name }));
                  }
                  setRenamingFolder(null);
                }}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                Rename
              </button>
              <button onClick={() => setRenamingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // Delete modal
  const deleteModal = deletingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-delete-folder-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-delete-folder-title" className="text-ds-text text-lg font-semibold mb-2">Delete folder</h2>
            <p className="text-ds-text-muted text-sm mb-4">
              Items inside will move to the parent level. Type <span className="text-ds-text font-medium">{deletingFolder.name}</span> to confirm.
            </p>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmName === deletingFolder.name) {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }
              }}
              placeholder={deletingFolder.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { dispatch(removeFolderWithCascade({ folderId: deletingFolder.id })); setDeletingFolder(null); }}
                disabled={deleteConfirmName !== deletingFolder.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button onClick={() => setDeletingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // New file modal
  const newFileModal = newFileModalOpen
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setNewFileModalOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-new-file-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-new-file-title" className="text-ds-text text-lg font-semibold mb-4">New text file</h2>
            <input
              ref={newFileInputRef}
              type="text"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setNewFileError(validateAssetName(e.target.value, allAssets, null));
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewFile(); }}
              placeholder="filename.txt"
              aria-describedby={newFileError ? 'at-new-file-error' : undefined}
              className={`w-full bg-ds-bg border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent ${
                newFileError ? 'border-ds-error mb-1' : 'border-ds-border mb-4'
              }`}
            />
            {newFileError && (
              <p id="at-new-file-error" className="text-ds-error text-xs mb-3">{newFileError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCreateNewFile}
                disabled={!!newFileError || !newFileName.trim()}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => setNewFileModalOpen(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {renameModal}
      {deleteModal}
      {newFileModal}

      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Assets</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolderParent(null); setNewFolderName(''); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New folder"
            title="New folder"
          >
            📁+
          </button>
          <button
            onClick={() => { setNewFileModalOpen(true); setNewFileName(''); setNewFileError(null); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New text file"
            title="New text file"
          >
            📄+
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="Upload asset"
            title="Upload asset"
          >
            +
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            data-testid="uploader"
            aria-label="Upload asset"
            onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      </div>

      {allAssets.length === 0 && folders.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`mt-1 border border-dashed rounded px-2 py-3 text-center cursor-pointer transition-colors
            ${dragging ? 'border-ds-accent text-ds-text-muted bg-ds-accent-subtle' : 'border-ds-border text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted'}`}
        >
          <span className="text-[10px] leading-relaxed">Drop files here<br />or click + to browse</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={(event) => {
            const overId = String(event.over?.id ?? '');
            if (overId.startsWith('folder-drop:')) {
              const fId = overId.replace('folder-drop:', '');
              setDragOverFolderId((prev) => (prev === fId ? prev : fId));
            } else {
              setDragOverFolderId(null);
            }
          }}
          onDragEnd={handleDragEnd}
        >
          {renderLevel(null, 0)}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`mt-1 border border-dashed rounded px-2 py-1.5 text-center cursor-pointer transition-colors text-[10px]
              ${dragging ? 'border-ds-accent text-ds-text-muted' : 'border-ds-border text-ds-text-dim hover:border-ds-accent'}`}
          >
            Drop to add more
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default AssetTree;
```

- [ ] **Step 6: Add the AssetTree double-click test to the existing test file**

Append to `tests/ui/components/AssetTree/AssetTree.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { addAsset } from '../../../../src/features/assets/assetsSlice';

test('double-clicking an asset item calls onOpenAsset with its id', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
  store.dispatch(addAsset({ id: 'a1', name: 'data.json', content: '', projectId: 'p1' }));
  const onOpenAsset = vi.fn();

  const { getByText } = render(
    <Provider store={store}>
      <AssetTree projectId="p1" onOpenAsset={onOpenAsset} />
    </Provider>
  );

  await user.dblClick(getByText('data.json'));
  expect(onOpenAsset).toHaveBeenCalledWith('a1');
});
```

Note: `makeStore`, `addProject`, `render`, and `Provider` are already imported at the top of `AssetTree.test.tsx` — only add the new imports (`userEvent`, `vi`, `addAsset`) if not already present.

- [ ] **Step 7: Run all AssetTree tests**

```
npx vitest run tests/ui/components/AssetTree/
```

Expected: all pass (existing section-filtering tests + new double-click test).

- [ ] **Step 8: Commit**

```bash
git add src/components/TreePanel/AssetTree/validateAssetName.ts src/components/TreePanel/AssetTree/index.tsx tests/ui/components/AssetTree/validateAssetName.test.ts tests/ui/components/AssetTree/AssetTree.test.tsx
git commit -m "feat: add validateAssetName helper, double-click and new-file support to AssetTree"
```

---

### Task 7: `TreePanel` forwarding and `EditPage` wiring

**Files:**
- Modify: `src/components/TreePanel/index.tsx`
- Modify: `src/pages/EditPage.tsx`

No new test file needed — the existing `EditPage.test.tsx` smoke test must continue to pass.

- [ ] **Step 1: Update `TreePanel` to forward `onOpenAsset`**

Replace `src/components/TreePanel/index.tsx` with:

```tsx
import React from 'react';
import AssetTree from './AssetTree';
import FileTree from '../FileTree';

type TreePanelProps = {
  projectId: string;
  onOpenAsset?: (assetId: string) => void;
};

const TreePanel: React.FC<TreePanelProps> = ({ projectId, onOpenAsset }) => (
  <>
    <FileTree projectId={projectId} />
    <div className="mt-4 pt-4 border-t border-ds-border-subtle">
      <AssetTree projectId={projectId} onOpenAsset={onOpenAsset} />
    </div>
  </>
);

export default TreePanel;
```

- [ ] **Step 2: Run the existing EditPage smoke test to verify it still passes**

```
npx vitest run tests/ui/pages/EditPage.test.tsx
```

Expected: PASS (TreePanel change is backward-compatible — `onOpenAsset` is optional).

- [ ] **Step 3: Update `EditPage` to wire up asset tabs**

Replace `src/pages/EditPage.tsx` with:

```tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile, removeFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { useAllFilesForProject } from '../hooks/useAllFilesForProject';
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
import ProjectShell, { FilesIcon } from '../components/ProjectShell';
import FileTabs from '../components/FileTabs';
import BottomPanel from '../components/BottomPanel';
import AssetPreview from '../components/AssetPreview';

type AssetTabEntry = { assetId: string };

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
  const allAssetsById = useSelector((state: RootState) => state.assets.byId);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Asset tab state
  const [openAssetTabs, setOpenAssetTabs] = useState<AssetTabEntry[]>([]);
  const [activeAssetTabId, setActiveAssetTabId] = useState<string | null>(null);
  const [dirtyAssetIds, setDirtyAssetIds] = useState<string[]>([]);

  const { run, stop, isRunning } = useCompiler(id ?? '');
  useRunnerMessages();
  useAutoSave();

  const selectedFile = useSelectedFile(id ?? '');
  const files = useAllFilesForProject(id ?? '');

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
    setActiveAssetTabId(null);
  };

  const handleTabClose = (fileId: string) => {
    dispatch(removeFile(fileId));
  };

  const handleOpenAsset = (assetId: string) => {
    if (!openAssetTabs.some((t) => t.assetId === assetId)) {
      setOpenAssetTabs((prev) => [...prev, { assetId }]);
    }
    setActiveAssetTabId(assetId);
  };

  const handleAssetTabSelect = (assetId: string) => {
    setActiveAssetTabId(assetId);
  };

  const handleAssetTabClose = (assetId: string) => {
    if (dirtyAssetIds.includes(assetId)) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    setOpenAssetTabs((prev) => prev.filter((t) => t.assetId !== assetId));
    setDirtyAssetIds((prev) => prev.filter((id) => id !== assetId));
    if (activeAssetTabId === assetId) {
      setActiveAssetTabId(null);
    }
  };

  const handleAssetDirtyChange = (assetId: string, dirty: boolean) => {
    setDirtyAssetIds((prev) =>
      dirty
        ? prev.includes(assetId) ? prev : [...prev, assetId]
        : prev.filter((id) => id !== assetId)
    );
  };

  const assetTabDescriptors = openAssetTabs.map((t) => ({
    id: t.assetId,
    name: allAssetsById[t.assetId]?.name ?? 'Unknown',
  }));

  const activeAsset = activeAssetTabId ? allAssetsById[activeAssetTabId] : undefined;

  return (
    <ProjectShell
      header={
        <>
          <Link
            to="/"
            className="mr-2 text-ds-text-dim hover:text-ds-text-muted transition-colors text-lg leading-none"
            aria-label="Back to projects"
            title="Back to projects"
          >
            ‹
          </Link>
          <span className="font-bold text-sm text-ds-accent-btn-text tracking-wide mr-3">
            softBASIC
          </span>
          <span className="text-ds-text-dim text-sm">{project.name}</span>
          {selectedFile && !activeAssetTabId && (
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
          content: <TreePanel projectId={project.id} onOpenAsset={handleOpenAsset} />,
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
              selectedFileId={activeAssetTabId ? undefined : selectedFile?.id}
              dirtyFileIds={dirtyFileIds}
              onSelect={handleTabSelect}
              onClose={handleTabClose}
              assetTabs={assetTabDescriptors}
              selectedAssetTabId={activeAssetTabId ?? undefined}
              dirtyAssetIds={dirtyAssetIds}
              onSelectAsset={handleAssetTabSelect}
              onCloseAsset={handleAssetTabClose}
            />
            <div className="flex-1 min-h-0">
              {activeAssetTabId && activeAsset ? (
                <AssetPreview
                  asset={activeAsset}
                  onDirtyChange={handleAssetDirtyChange}
                />
              ) : (
                <Editor
                  onChange={handleChange}
                  file={selectedFile}
                  height="100%"
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              )}
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
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 2 · UTF-8 · LF</span>
        </>
      }
    />
  );
};

export default EditPage;
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass (same count as before + the new component tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/TreePanel/index.tsx src/pages/EditPage.tsx
git commit -m "feat: wire asset preview tabs into EditPage"
```
