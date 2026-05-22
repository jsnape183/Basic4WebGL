# softBASIC UI Redesign — Design Spec

**Date:** 2026-05-22
**Phase:** 3 of 3 — Visual redesign + deferred functional items
**Status:** Approved for implementation planning

---

## 1. Goal

Reshape the softBASIC React frontend into a professional browser-based IDE that looks and feels like a real tool. Phase 2 (architectural refactor) is complete — this phase is purely additive: new styles, new layout polish, and the deferred functional improvements from the Phase 1 audit. No state model changes.

---

## 2. Design Decisions (from brainstorming session)

| Decision | Choice | Notes |
|---|---|---|
| Overall layout | VS Code-style | Activity bar + collapsible sidebar + editor + optional preview |
| Console placement | Full-width tabbed bottom panel | Console tab + Problems tab, collapsible |
| Colour palette | Deep Space (indigo/violet) | Near-black base, indigo accents — see §4 |
| Projects page | Card grid | Coloured accent stripe per card, dashed "New" slot |
| Unsaved indicator | Dirty dot on file tab | `●` on modified tab, foundation for future VCS |
| Deferred items in scope | L1, L3, M2 | Accessibility, dirty indicator, Modal portal |

---

## 3. Component Breakdown

### 3.1 Projects Page (`/`)

- Full-screen layout with a minimal top nav bar (logo only, no nav links)
- `<main>` contains a page title ("My Projects") + project count + "New project" button
- Project cards in a responsive grid (`grid-cols-3` at desktop, `grid-cols-2` at tablet, `grid-cols-1` at mobile)
- Each card:
  - Coloured accent stripe at top (unique indigo/violet shade per project, derived from project ID)
  - Project name (bold)
  - File count + asset count + relative "last edited" timestamp
  - "Open →" button
  - Delete button visible on hover (already wired to `deleteProjectWithMainFile`)
- "New project" is a dashed-border empty card slot at the end of the grid — clicking it fires `createProjectWithMainFile`
- Empty state (zero projects): centred illustration placeholder + "Create your first project" CTA

### 3.2 IDE Shell (`/projects/:id/edit`) — built on `ProjectShell`

#### Top bar
- Left: softBASIC logo (bold, indigo tint)
- Centre: project name (muted) › active file name (bright) — breadcrumb style
- Right: Run button (indigo filled) / Stop button (red outlined) — switches on `isRunning`
- Height: 44px

#### Activity bar
- Narrow strip (40px wide) on the far left
- Two icons: **Files** (document icon), **Assets** (image icon)
- Active icon: indigo fill; inactive: muted gray
- Clicking toggles the sidebar panel open/closed; clicking the active icon collapses it
- No text labels — icons only, with `title` + `aria-label` for accessibility

#### Sidebar panel
- Appears to the right of the activity bar, 220px wide, collapsible
- Contains two sections rendered by `TreePanel`:
  - **Files** section: file list with `+` (new file) button, delete on hover (existing `FileTree`)
  - **Assets** section: asset list with upload button (existing `AssetTree`)
- Sections are independently collapsible (chevron toggle)
- Keyboard navigable file list (arrow keys, Enter to select)

#### Editor area
- **File tab bar:** one tab per open file (currently all project files are always "open")
  - Active tab: bright text + indigo bottom border
  - Inactive tab: muted text
  - **Dirty dot:** `●` shown on tab when file has been modified since last "save event" — dot disappears on debounced auto-save confirm (see §5.2)
  - Tab close button (`×`) on hover — removes file (guarded to prevent deleting last file)
- Monaco editor fills remaining height

#### Preview pane
- Slides in when `isRunning` is true, taking ~40% of the center+right area
- `Preview` component unchanged internally — just restyled outer container
- Labelled "PREVIEW" in a small muted header strip

#### Bottom panel
- Full-width, sits above the status bar
- Default height: 180px; user-resizable via drag handle (stretch goal — can be fixed height initially)
- Collapsible: clicking the panel header or a `▼` chevron collapses to just the tab bar
- **Console tab:** runtime `postMessage` output, timestamped, colour-coded by type:
  - `INFO` — muted gray
  - `OK` / `Notice` — green
  - `ERROR` — red
  - `OUTPUT` — default text colour
  - Badge on tab shows total log count
- **Problems tab:** compile diagnostics from `sessionSlice.logs` filtered to `LogItemType.Error`
  - Each entry shows filename, line:col, message
  - Badge on tab shows error count (red background when > 0)
  - Clicking an entry navigates Monaco to the relevant line (stretch goal)
- Clear button (×) in panel header clears current tab's content

#### Status bar
- 28px strip at the very bottom (already exists, just restyled)
- Left: cursor position (`Ln N, Col N`)
- Right: `Spaces: 2 | UTF-8 | LF`
- Background: slightly lighter than editor bg, indigo tint

---

## 4. Colour Design System

All colours defined as Tailwind CSS custom tokens in `tailwind.config.js` under a `ds` (design system) namespace.

### Base surfaces
| Token | Hex | Usage |
|---|---|---|
| `ds-bg` | `#0b0b18` | Page background, editor bg |
| `ds-surface` | `#12122a` | Cards, sidebar bg, panel bg |
| `ds-surface-2` | `#1a1a38` | Hover states, active list items |
| `ds-border` | `#2a2a55` | All borders and dividers |
| `ds-border-subtle` | `#1e1e44` | Inner dividers within surfaces |

### Text
| Token | Hex | Contrast on ds-bg | Usage |
|---|---|---|---|
| `ds-text` | `#e0e0f0` | 16:1 ✓ | Primary text, file names, code |
| `ds-text-muted` | `#8888bb` | 4.6:1 ✓ | Secondary labels, metadata |
| `ds-text-dim` | `#4a4a88` | 2.1:1 — decorative only | Placeholder text, disabled |

### Accent (indigo/violet)
| Token | Hex | Usage |
|---|---|---|
| `ds-accent` | `#6060dd` | Active tab underline, active icon, focus rings |
| `ds-accent-btn` | `#3030aa` | Run button background |
| `ds-accent-btn-text` | `#c8c8ff` | Run button label (4.6:1 on ds-accent-btn ✓) |
| `ds-accent-subtle` | `#1e1e44` | Selected sidebar item bg |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `ds-success` | `#40aa60` | OK/compiled log tag |
| `ds-success-bg` | `#0f2a1a` | OK tag background |
| `ds-error` | `#cc4466` | Error log tag, Problems badge |
| `ds-error-bg` | `#2a1020` | Error tag background |
| `ds-warning` | `#cc9933` | Warning log tag |
| `ds-warning-bg` | `#2a2010` | Warning tag background |

### Accessibility notes
- All body text uses `ds-text` or `ds-text-muted` — both pass WCAG AA 4.5:1 on `ds-bg`
- `ds-text-dim` is intentionally sub-AA and must never be used for readable text — decorative only
- `ds-accent` used as text must be on `ds-surface` or darker (3.5:1 on `ds-surface`); use for large/bold UI only
- All colour-coded log tags pair colour with a text label (never colour-only)
- Focus rings: 2px solid `ds-accent` with 2px offset — visible on all interactive elements

---

## 5. Functional Improvements (Deferred from Phase 1)

### 5.1 Accessibility (L1)

- All icon-only buttons get `aria-label` attributes (activity bar icons, file delete `×`, asset upload)
- `FileTree` list is keyboard navigable: `ArrowUp` / `ArrowDown` to move focus, `Enter` to select, `Delete` to delete (with confirmation)
- `ModalWithInput` rebuilt as a React Portal (see §5.3) with:
  - `aria-modal="true"`, `role="dialog"`, `aria-labelledby` pointing to the modal title
  - Focus trapped inside modal while open (Tab cycles through focusable elements)
  - `Escape` closes the modal
  - Focus returns to the trigger element on close

### 5.2 Dirty file indicator (L3)

Since all edits auto-save to Redux/localStorage, "dirty" means "modified in this render cycle but not yet confirmed by the debounced save". Implementation:

- `filesSlice` gets a `dirtyFileIds: string[]` field (not persisted)
- `updateFile` action adds the file ID to `dirtyFileIds`
- A new `useAutoSave` hook debounces 500ms after the last `updateFile` dispatch and removes the ID from `dirtyFileIds` (the data is already in Redux — this is UI-only)
- File tabs show `●` prefix when file ID is in `dirtyFileIds`
- Foundation for future VCS: `dirtyFileIds` can later be compared against a committed snapshot

### 5.3 Modal as React Portal (M2)

- `ModalWithInput` is rebuilt to render via `ReactDOM.createPortal` into `document.body`
- Fixes z-index stacking issues when modal is rendered inside deep component trees
- Adds focus trap and `Escape` handler (see §5.1)
- Existing `onSubmit` / `openText` / `saveText` / `closeText` / `title` prop API is unchanged

---

## 6. File Map

### New files
- `tailwind.config.js` — extended with `ds-*` colour tokens
- `src/components/Modal/ModalWithInput.tsx` — rebuilt with Portal + focus trap (replaces existing)
- `src/hooks/useAutoSave.ts` — debounced dirty-state clearer

### Modified files
- `src/features/files/filesSlice.ts` — add `dirtyFileIds: string[]` to state (not persisted)
- `src/components/ProjectShell/index.tsx` — full restyle, activity bar, bottom panel
- `src/pages/ProjectsPage.tsx` — card grid layout
- `src/components/Projects/index.tsx` — card component restyle
- `src/components/TreePanel/index.tsx` — integrated into activity bar sidebar
- `src/components/TreePanel/FileTree/index.tsx` — keyboard nav, dirty dot data
- `src/components/Preview/Console.tsx` — timestamped entries, colour tokens
- `src/pages/EditPage.tsx` — file tab bar with dirty dots, breadcrumb header
- `src/components/Editor/index.tsx` — remove fixed height, fill available space

### Tailwind config
All `gray-*` usages in existing components are migrated to `ds-*` tokens. No component should hardcode a hex colour.

---

## 7. Out of Scope

| Item | Reason |
|---|---|
| L4 — Cross-file undo history | Requires significant Monaco integration work; deferred to a future phase |
| Bottom panel resize handle | Nice-to-have; fixed height acceptable for Phase 3 |
| Clicking Problems entry to navigate Monaco | Stretch goal within Phase 3; implement only if time allows |
| Project emoji/icon customisation | Not raised as a requirement |
| Themes (light mode, etc.) | Single dark theme only for now |

---

## 8. Success Criteria

- [ ] All existing tests pass (217+) after restyling
- [ ] No new TypeScript errors
- [ ] WCAG AA contrast met for all text elements (verify with browser devtools)
- [ ] `ModalWithInput` focus trap works: Tab cycles, Escape closes, focus returns to trigger
- [ ] Dirty dot appears when typing and disappears ~500ms after last keystroke
- [ ] Activity bar correctly toggles sidebar open/closed
- [ ] Bottom panel collapses and expands; Console and Problems tabs switch correctly
- [ ] Projects card grid renders correctly at 1-column, 2-column, 3-column breakpoints
