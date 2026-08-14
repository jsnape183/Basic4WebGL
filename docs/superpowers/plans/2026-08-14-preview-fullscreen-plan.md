# Editor Preview Fullscreen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen toggle button to the Editor's Preview panel header, so a running game can fill the whole monitor via the browser's native Fullscreen API, for real playthroughs instead of the cramped `2/5`-width sidebar.

**Architecture:** `Runner` and `Preview` forward a ref to the underlying `<iframe>`. `ProjectShell` gains an optional header-actions slot in its existing "Preview" label bar. `EditPage` owns the iframe ref, the fullscreen state (tracked via the browser's `fullscreenchange` event, not just click state), and renders the toggle button into that slot. No engine/rendering changes — the game already resizes itself to fill its container (`resizeTo: window` in `bootstrapper.html`), and the parent page requesting fullscreen on an iframe element it owns needs no `sandbox` attribute changes.

**Tech Stack:** React (function components, hooks), TypeScript, the Fullscreen API (`Element.requestFullscreen()`, `document.exitFullscreen()`, `fullscreenchange` event).

---

## Prerequisite reading (context, not a task)

- Design doc: `docs/superpowers/specs/2026-08-14-preview-fullscreen-design.md` — read this first, this plan implements it exactly.
- `src/components/Runner/index.tsx`, `src/components/Preview/index.tsx`, `src/components/ProjectShell/index.tsx`, `src/pages/EditPage.tsx` — the four files this plan touches. All were read in full during design; re-read them before editing to confirm current line numbers, since this is a real, actively-changing codebase.

---

### Task 1: Forward a ref to the `<iframe>` through `Runner` and `Preview`

**Files:**
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/components/Preview/index.tsx`

No test — these are thin structural changes to two simple presentational components with no existing test files; verified by the manual browser check in Task 4 (the last task), which is the only meaningful way to verify Fullscreen API behavior anyway.

- [ ] **Step 1: Wrap `Runner` in `React.forwardRef`**

In `src/components/Runner/index.tsx`, change:

```tsx
const Runner: React.FC<RunnerProps> = ({
  transpiled,
  projectId,
  width = '100%',
  height = '100%',
  assets,
}) => {
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        scrolling="no"
        title="Preview"
        srcDoc={bootstrapper
          .replace(
            '//${softBasicGFX}',
            [sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbPathfinding, sbScene, sbCamera, softBasicEngine].join('\n')
          )
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${inlineAssets}', assets?.length
            ? `await _sb.preload(${JSON.stringify(assets)});`
            : '')}
      ></iframe>
    </div>
  );
};

export default Runner;
```

to:

```tsx
const Runner = React.forwardRef<HTMLIFrameElement, RunnerProps>(({
  transpiled,
  projectId,
  width = '100%',
  height = '100%',
  assets,
}, ref) => {
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        ref={ref}
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        scrolling="no"
        title="Preview"
        srcDoc={bootstrapper
          .replace(
            '//${softBasicGFX}',
            [sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbPathfinding, sbScene, sbCamera, softBasicEngine].join('\n')
          )
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${inlineAssets}', assets?.length
            ? `await _sb.preload(${JSON.stringify(assets)});`
            : '')}
      ></iframe>
    </div>
  );
});

Runner.displayName = 'Runner';

export default Runner;
```

(`displayName` is set because `forwardRef` components don't get an automatic display name from their variable name the way a plain function component does — without it, React DevTools would show "Anonymous" or "ForwardRef" instead of "Runner".)

- [ ] **Step 2: Wrap `Preview` in `React.forwardRef`, passing the ref through**

In `src/components/Preview/index.tsx`, change:

```tsx
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

to:

```tsx
import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview = React.forwardRef<HTMLIFrameElement, PreviewProps>(({ transpiled, projectId }, ref) => (
  <Runner ref={ref} transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
));

Preview.displayName = 'Preview';

export default Preview;
```

- [ ] **Step 3: Type-check**

Run: `npx vite build`
Expected: builds cleanly, no TypeScript errors (this is exactly the kind of ref-typing mistake `tsc` would catch, and `vite build` runs its own type-check as part of the build per this project's established verification command — see `CLAUDE.md`).

- [ ] **Step 4: Commit**

```bash
git add src/components/Runner/index.tsx src/components/Preview/index.tsx
git commit -m "feat: forward a ref to the Preview iframe for fullscreen support"
```

---

### Task 2: Add a header-actions slot to `ProjectShell`'s Preview panel header

**Files:**
- Modify: `src/components/ProjectShell/index.tsx`

- [ ] **Step 1: Add the new prop to `ProjectShellProps`**

In `src/components/ProjectShell/index.tsx`, find:

```tsx
type ProjectShellProps = {
  header: React.ReactNode;
  activitySections: ActivitySection[];
  editor: React.ReactNode;
  preview?: React.ReactNode;
  panel: React.ReactNode;
  footer?: React.ReactNode;
};
```

Add `previewHeaderActions?: React.ReactNode;` after `preview?: React.ReactNode;`:

```tsx
type ProjectShellProps = {
  header: React.ReactNode;
  activitySections: ActivitySection[];
  editor: React.ReactNode;
  preview?: React.ReactNode;
  previewHeaderActions?: React.ReactNode;
  panel: React.ReactNode;
  footer?: React.ReactNode;
};
```

- [ ] **Step 2: Destructure the new prop**

Find:

```tsx
const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  activitySections,
  editor,
  preview,
  panel,
  footer,
}) => {
```

Change to:

```tsx
const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  activitySections,
  editor,
  preview,
  previewHeaderActions,
  panel,
  footer,
}) => {
```

- [ ] **Step 3: Render it in the Preview header bar**

Find the Preview panel header:

```tsx
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
```

Change the header `<div>` to a flex row with the label on the left and the new slot on the right:

```tsx
        {/* Preview pane */}
        {preview && (
          <aside className="w-2/5 flex-shrink-0 bg-ds-bg border-l border-ds-border flex flex-col overflow-hidden">
            <div className="px-3 py-1 flex items-center justify-between bg-ds-surface border-b border-ds-border flex-shrink-0">
              <span className="text-[10px] text-ds-text-dim uppercase tracking-wider">Preview</span>
              {previewHeaderActions}
            </div>
            <div className="flex-1 overflow-hidden">
              {preview}
            </div>
          </aside>
        )}
```

(The label text moves from the `<div>` itself into a `<span>`, since the `<div>` is now a flex container holding both the label and the new actions slot. `previewHeaderActions` renders as `undefined` — i.e. nothing — for every existing caller that doesn't pass it, so this is a pure addition with no visual change for callers that don't opt in.)

- [ ] **Step 4: Type-check and build**

Run: `npx vite build`
Expected: builds cleanly.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectShell/index.tsx
git commit -m "feat: add optional header-actions slot to ProjectShell's Preview panel"
```

---

### Task 3: Wire the fullscreen toggle button into `EditPage`

**Files:**
- Modify: `src/pages/EditPage.tsx`

- [ ] **Step 1: Update the `React` import to include `useRef`**

Find:

```tsx
import React, { useEffect, useState } from 'react';
```

Change to:

```tsx
import React, { useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: Add two small inline SVG icon components**

`ProjectShell`'s existing icons (`FilesIcon`, `AssetsIcon`, `ExportIcon`, `TilemapIcon`) are all `24x24` viewBox, `fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"` inline SVGs defined as small local components. Match that exact style. Add these two new components near the top of `src/pages/EditPage.tsx`, after the imports and before `type AssetTabEntry = { assetId: string };`:

```tsx
const EnterFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);
```

- [ ] **Step 3: Add the iframe ref, fullscreen state, and the `fullscreenchange` listener**

Find the existing state declarations block:

```tsx
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [openAssetTabs, setOpenAssetTabs] = useState<AssetTabEntry[]>([]);
  const [activeAssetTabId, setActiveAssetTabId] = useState<string | null>(null);
  const [dirtyAssetIds, setDirtyAssetIds] = useState<string[]>([]);
  const [jumpTarget, setJumpTarget] = useState<{ line: number; col: number } | null>(null);
  const [isTilemapModalOpen, setIsTilemapModalOpen] = useState(false);
```

Add two new lines directly after it:

```tsx
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [openAssetTabs, setOpenAssetTabs] = useState<AssetTabEntry[]>([]);
  const [activeAssetTabId, setActiveAssetTabId] = useState<string | null>(null);
  const [dirtyAssetIds, setDirtyAssetIds] = useState<string[]>([]);
  const [jumpTarget, setJumpTarget] = useState<{ line: number; col: number } | null>(null);
  const [isTilemapModalOpen, setIsTilemapModalOpen] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
```

Then find the existing `useEffect` calls (there are two, per the earlier grep — around where `openFileIds` is set up). Add a new `useEffect` for the `fullscreenchange` listener near them, e.g. directly after the second existing `useEffect` block closes. The exact placement relative to other effects doesn't matter (they're independent), but keep it grouped with the other top-level effects rather than buried deep in the component. Add:

```tsx
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPreviewFullscreen(document.fullscreenElement === previewIframeRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
```

- [ ] **Step 4: Add the toggle handler**

Near the other handler functions in the component (e.g. alongside `handleTabSelect`/`handleTabClose` or wherever similar small handlers are defined — place it in the same general area as the other UI-interaction handlers), add:

```tsx
  const toggleFullscreen = () => {
    if (document.fullscreenElement === previewIframeRef.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      previewIframeRef.current?.requestFullscreen().catch(() => {});
    }
  };
```

- [ ] **Step 5: Pass the ref to `Preview` and add the button via `previewHeaderActions`**

Find:

```tsx
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
```

Change to:

```tsx
      preview={
        isRunning ? (
          <ErrorBoundary
            key={project.id}
            fallback={<p className="p-4 text-ds-error text-sm">Preview failed to load.</p>}
          >
            <Preview ref={previewIframeRef} transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
      previewHeaderActions={
        isRunning ? (
          <button
            onClick={toggleFullscreen}
            className="text-ds-text-dim hover:text-ds-text transition-colors focus:outline-none focus:ring-2 focus:ring-ds-accent rounded"
            aria-label={isPreviewFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isPreviewFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isPreviewFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
          </button>
        ) : undefined
      }
```

- [ ] **Step 6: Type-check and build**

Run: `npx vite build`
Expected: builds cleanly, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/EditPage.tsx
git commit -m "feat: add fullscreen toggle button to the Editor Preview panel"
```

---

### Task 4: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server and open a project**

Start `npm run dev`, navigate to `/projects`, open any existing project (or create one), click Run.

- [ ] **Step 2: Verify the button appears and looks right**

Confirm a small icon button now appears in the Preview panel header, to the right of the "Preview" label, only while the game is running (stop the game and confirm the button disappears along with the rest of the Preview pane, matching the existing conditional-render behavior).

- [ ] **Step 3: Verify entering fullscreen**

Click the button. Confirm:
- The browser enters real fullscreen (monitor-filling, browser chrome hidden) — this is a genuine OS-level fullscreen transition, distinct from just resizing a div.
- The game canvas fills the entire screen (not just the iframe's old small box scaled awkwardly) — this proves `resizeTo: window` picked up the new size correctly.
- The game is still fully playable: keyboard input still works (e.g. move a sprite with arrow keys/WASD in whichever demo/project you're testing), mouse input still works if the game uses it.
- The button's icon has swapped to the "exit fullscreen" icon.

- [ ] **Step 4: Verify exiting fullscreen via the button**

Click the button again. Confirm the browser exits fullscreen, the Preview pane returns to its normal `2/5`-width sidebar size, and the icon swaps back to "enter fullscreen".

- [ ] **Step 5: Verify exiting fullscreen via Esc**

Enter fullscreen again (Step 3), then press Esc instead of clicking the button. Confirm the browser exits fullscreen (native behavior) AND the button's icon correctly swaps back to "enter fullscreen" — this specifically proves the `fullscreenchange` listener (not just click-driven state) is doing the state tracking correctly, per the design's explicit requirement that the button stay correct even when fullscreen is exited a way other than clicking it.

- [ ] **Step 6: Verify no regressions elsewhere**

Confirm the rest of the Editor page still works normally: switching files, the Files/Export/Tilemap-editor activity bar buttons, the bottom console panel — nothing else in `ProjectShell`'s layout should have shifted or broken, since Task 2's change is purely additive (an optional prop that renders nothing when absent).

- [ ] **Step 7: Report and stop**

Report the verification results. No automated test suite run is required for this task specifically (per the design doc's Testing section — Fullscreen API interactions aren't meaningfully testable via Vitest/jsdom or this project's existing Cypress conventions), but as a final sanity check, run `npx vitest run` once to confirm this UI-only change didn't accidentally break anything in the broader suite (it shouldn't — no engine or language code was touched), and report that result too.
