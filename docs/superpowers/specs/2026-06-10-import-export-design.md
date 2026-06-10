# Project Import/Export Design

## Goal

Allow users to export a single project as a self-contained JSON file and import it back — creating a new project or overwriting an existing one.

---

## JSON Schema

Exported filename: `{project.name}.b4wgl.json`

```json
{
  "version": 1,
  "project": { "name": "My Game" },
  "folders": [
    { "id": "f1", "name": "Classes", "parentId": null, "section": "files" }
  ],
  "files": [
    { "id": "file1", "name": "Main", "source": "...", "folderId": null, "fullName": "Main.bas" },
    { "id": "file2", "name": "Player", "source": "...", "folderId": "f1", "fullName": "Player.bas" }
  ],
  "assets": [
    { "id": "a1", "name": "sprite", "content": "data:image/png;base64,...", "folderId": null, "fullName": "sprite.png" }
  ],
  "fileOrder":  { ":root": ["file1"], ":f1": ["file2"] },
  "assetOrder": { ":root": ["a1"] }
}
```

**Key decisions:**
- `fileOrder`/`assetOrder` keys are stored without the `projectId:` prefix (e.g. `":root"`, `":folderId"`). The prefix is stripped on export and re-added on import with the new project ID.
- Asset `content` is stored as-is (already a base64 data URL string in Redux state).
- `version: 1` field allows future schema migrations; import rejects unknown versions with an error.

---

## Export Flow

**Entry points:**
1. "Export" button on each project card in the Projects list (appears on hover, left side of the card footer near "Open →")
2. Export icon in the editor's left activity bar (second icon, below "Files")

**Implementation — `src/features/projects/exportProject.ts`:**
1. Read project, folders, files, and assets from Redux state for the given `projectId`
2. Filter `state.files.fileOrder` and `state.assets.assetOrder` to keys starting with `projectId:`, rewrite to strip the prefix
3. Assemble the JSON object (version 1 schema above)
4. Create a `Blob` from `JSON.stringify`, create an object URL, programmatically click a temporary `<a download="...">` element, then revoke the URL

No Redux state changes — export is a pure read + browser side-effect.

---

## Import Flow

**Entry point:** "Import" button in the Projects page header (right side of the "My Projects" heading row).

**Steps:**
1. Clicking "Import" triggers a hidden `<input type="file" accept=".json">` file picker
2. Parse the selected file as JSON; if `version !== 1`, show an alert and abort
3. Check if a project with the same `project.name` already exists in Redux state:
   - **No match** → proceed to step 5
   - **Match** → show overwrite confirmation modal (same name-input pattern as Delete: user must type the project name exactly); on confirm, dispatch `deleteProjectWithMainFile` for the existing project first
4. Dispatch `importProject(json)` thunk:
   - Generate a new `projectId` (nanoid)
   - For each folder: generate a new `folderId`, build `oldId → newId` map
   - For each file: generate a new `fileId`, remap `folderId` via the folder map
   - For each asset: generate a new `assetId`, remap `folderId` via the folder map
   - Rewrite `fileOrder` keys: prepend `newProjectId:`, swap old folder ID segments for new ones; rewrite values (arrays of file IDs) to use new file IDs
   - Rewrite `assetOrder` the same way using new asset IDs
   - Dispatch: `addProject` → `addFolder` (each) → `addFile` (each) → `addAsset` (each) → `reorderFiles` → `reorderAssets`

**Implementation — `src/features/projects/importProject.ts`:** Single async thunk encapsulating steps 4+.

---

## UI Changes

### Projects page (`src/components/Projects/index.tsx`)

**`ProjectList` header:**
- Add "Import" text button to the right of the "My Projects" heading
- Hidden `<input type="file" accept=".json">` wired to the button via `ref`
- After file is picked: parse JSON, check version, check name collision
  - If collision: render overwrite modal (same portal + name-input pattern as the existing delete modal)
  - If no collision: dispatch `importProject` directly

**`ProjectCard`:**
- Add "Export" button appearing on hover, in the bottom row left side (near "Open →")
- Clicking dispatches `exportProject(project.id)`

### Editor (`src/components/ProjectShell/index.tsx` + `src/pages/EditPage.tsx`)

**`ActivitySection` type extension:**
```ts
export type ActivitySection = {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  content?: React.ReactNode; // optional when onAction is set
  onAction?: () => void;     // fires instead of toggling the sidebar
};
```

When `onAction` is present on a section, clicking its icon button calls `onAction()` and does not toggle the sidebar panel.

**`EditPage`:** Add a second entry to `activitySections`:
```tsx
{
  id: 'export',
  icon: <ExportIcon />,
  ariaLabel: 'Export project',
  onAction: () => dispatch(exportProject(project.id)),
}
```

A simple download/arrow-out SVG icon (`ExportIcon`) is defined inline in `ProjectShell`, following the `FilesIcon`/`AssetsIcon` pattern.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Selected file is not valid JSON | `JSON.parse` throws — catch and `alert('Invalid file: not valid JSON')` |
| `version` field is not `1` | `alert('Unsupported export version')` and abort |
| Overwrite declined by user | Modal closes, nothing changes |
| Export with no assets | `assetOrder` is `{}`, `assets` array is `[]` — handled naturally |
