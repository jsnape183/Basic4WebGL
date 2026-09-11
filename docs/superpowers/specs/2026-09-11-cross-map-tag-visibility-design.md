# Cross-map tag visibility — design

**Date:** 2026-09-11
**Status:** Approved, ready for planning
**Scope:** In the tilemap editor's paint palette (marker layers), show tags used
by *other* tilemaps in the same project, so a name can be reused instead of
reinvented. Read-only visibility, adopting a tag reuses the exact existing
"type a new tag" code path. No shared/global registry, no `.stm` format
change, no change to any of the resize / multi-tag-paint / delete-tag work
already shipped.

## Problem

Each tilemap's tag registry (`StmDoc.tags`) is private to that `.stm` file.
Working on a second map, there's no way to see what tags already exist
elsewhere in the project — so names drift (`enemy` vs `enemy_easy` vs
`baddie`) or get retyped with a typo, adding to exactly the mess the previous
feature (delete-an-in-use-tag) was built to clean up.

## Explicitly rejected: a shared/global tag registry

A single project-wide tag list every map reads from would need a new storage
location (no natural home — not part of any one `.stm`), a migration for every
existing map's embedded `tags`, and would turn "delete this tag" and "remove
everywhere" (just shipped) into project-wide operations instead of per-map
ones. That's a much bigger, riskier change for a want that's really just
"let me see what's out there." Visibility-only avoids all of it.

## Design

### `src/components/TileMapEditor/stmTags.ts` (new, pure)

```ts
/**
 * The effective tag list a raw .stm JSON string carries: whatever is in its
 * `tags` field, plus any tag actually used by a marker (covers a legacy file
 * saved before the tag registry existed). Malformed JSON or a missing field
 * yields an empty list, never throws.
 *
 * Deliberately NOT shared with decodeStmText's near-identical logic in
 * index.tsx — this is a small, standalone read for an additive, read-only
 * feature, kept separate so it cannot affect the decode path every other
 * editor feature depends on.
 */
export function extractTagsFromStmJson(raw: string): string[]
```

### `src/components/TileMapEditor/useCrossMapTags.ts` (new hook)

```ts
export type CrossMapTag = { tag: string; sources: string[] }; // sources = other maps' asset names, e.g. "level1.stm"

/**
 * Every tag used by another tilemap asset in the same project (excluding
 * `excludeAssetId`, the map currently open). Re-scans when the project's set
 * of tilemap asset ids changes, not on every render. A blob that fails to
 * load or parse is skipped, not thrown.
 */
export function useCrossMapTags(projectId: string | undefined, excludeAssetId: string): CrossMapTag[]
```

Implementation sketch: select `Object.values(state.assets.byId)` filtered to
`projectId` match, `getAssetType(name) === 'tilemap'`, and `id !== excludeAssetId`
(same filtering style already used in `NewTilemapDialog`/`TilemapChooserModal`).
For each, `getAssetBlob(id)` → `.text()` → `extractTagsFromStmJson`. Aggregate
into `tag -> Set<assetName>`, return sorted by tag name (sources sorted too,
for stable test output).

### `TagPicker.tsx` (paint branch only)

- New prop `crossMapTags?: CrossMapTag[]`.
- Filter out any tag already in `tags` (this map's own registry) — so nothing
  is ever shown twice.
- If any remain, render a **"Seen in other maps"** section below the existing
  chip row: one chip per tag, label = tag name, small muted trailing hint —
  `(level1.stm)` when `sources.length === 1`, `(N maps)` otherwise — full
  comma-joined list in the `title` tooltip.
- `aria-label={`Use tag ${tag} from another map`}`.
- **Clicking a chip calls the existing `onToggleTag` prop** — the same
  callback the regular chips use. No new callback, no new state anywhere.
  This is deliberate: adopting a cross-map tag is byte-for-byte the same
  action as typing that name into "+ new tag name..." today (`registerTag` +
  load into the brush), so none of the delete/rename/paint logic needs to
  know this feature exists.

### `index.tsx`

- One new line calling the hook: `const crossMapTags = useCrossMapTags(asset.projectId, asset.id);`
- One new prop on the existing `<TagPicker>` element: `crossMapTags={crossMapTags}`.
- Nothing else changes. `handleTogglePaintTag`, `registerTag`, `markerTags`,
  the delete-tag flow — all untouched.

## Testing (high level — exact tests specified in the plan)

- `stmTags.test.ts`: stored `tags` returned as-is; a legacy doc with markers
  but no `tags` field falls back to used tags; malformed JSON → `[]`; a
  non-string entry in `tags` is dropped.
- `useCrossMapTags.test.ts`: excludes the current asset; excludes non-tilemap
  assets; excludes other projects' tilemaps; aggregates one tag used by two
  other maps into one entry with two sources; a corrupt/missing blob for one
  asset doesn't prevent the others' tags from showing.
- `TagPicker.test.tsx`: the section doesn't render with no cross-map tags, or
  when every cross-map tag is already in `tags`; renders one chip per new
  tag; clicking it calls `onToggleTag` with that tag name.
- `TileMapEditor.test.tsx`: seed a second tilemap asset in the same project
  with a tag the open map doesn't have; render the editor on a marker layer;
  the chip appears; clicking it, then painting and saving, produces that tag
  on the open map exactly as if it had been typed fresh.

## Docs & release

Editor-only, read-only, no `.stm` format change, no softBASIC surface → no
API/Language-Guide update. Release-notes entry + patch version bump on push.

## Out of scope

- A shared/global tag registry (rejected above).
- Renaming/deleting a tag across multiple maps at once.
- Any UI in the Select tool / cell inspector.
- Searching/filtering the "seen in other maps" list if it grows long — YAGNI
  until it's actually a problem for a real project.
