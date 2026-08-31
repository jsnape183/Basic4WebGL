# Demo Authoring Guide

Internal guide for creating a new softBASIC demo game (`src/docs/demos/`) — a hand-picked, ready-to-run project that shows off what softBASIC can build. This is for whoever is *building* the demo (human or agent), not the player — it's not part of the in-app `/docs` site.

## What a demo actually is

Four pieces, all required:

1. `src/docs/demos/<Slug>.b4wgl.json` — the project export (files, assets, folders — see `ProjectExportJson` in `src/features/projects/exportProject.ts`).
2. `src/docs/demos/<slug>.md` — the "how it works" write-up: required-assets table, controls, explanation, full source. See `raycaster.md` for the template.
3. `src/features/demos/demoRegistry.ts` — one `DemoEntry`: `slug`, `name`, `tags`, `description`, `docsSlug`, `file`. The `file` field is the basename of the `.b4wgl.json` under `src/docs/demos/`; entries no longer carry inline `json`. `loadDemoJson(slug)` dynamic-imports the export on demand, so each demo's JSON is its own lazy chunk rather than being bundled into the main app.
4. `src/docs/manifest.ts` — a nav entry in the `Demos` group: `{ slug, title, file: 'demos/<slug>.md' }`.

## Step 1: Pre-production brief

Before writing any code, work through these questions with whoever requested the demo — live in chat, no written artifact needed (a demo is lighter-weight than a full feature spec):

1. **Concept** — one or two sentences on the mechanic/feature being showcased.
2. **Assets required** — for each visual asset: name/purpose, and either
   - *static*: pixel dimensions, or
   - *animated*: frame dimensions, frame count, suggested fps, animation names (idle/walk/etc.)
   - plus any art-style/colour notes worth flagging.
3. **Audio required** (if any) — sound effect vs. loop, rough description.
4. **Controls** — keys/mouse actions.
5. **New engine features** — does this need any function that doesn't exist yet? If yes, that's a full "Adding a new language feature or library module" job (see `CLAUDE.md`) *before* this demo can be finished — flag it now, not mid-build.

## Step 2: Syntax correctness

Follow the API cross-reference rule (`CLAUDE.md`'s "Docs section"): check every softBASIC snippet against the actual `.bas` def file in `src/lib/Basic4WebGL/defs/` or the API reference markdown in `src/docs/api-reference/` before writing it. Never from memory.

## Step 3: Build it

Two paths — pick based on complexity.

**Path A — build live in the app.** Default choice: use this for anything with more than one file, class-based game objects, or real interactivity.

1. Create a new project in the running app; add the assets from the brief.
2. Write `.bas` files in Monaco. Run frequently — use inline error underlining, autocomplete, and hover as you go, rather than writing blind and debugging after the fact.
3. Once it runs cleanly with zero console `ERR` entries, use the app's own **Export** feature to produce the `.b4wgl.json`. This guarantees the shipped file is exactly what was tested — no hand-crafted JSON that might not match what actually ran. Export downloads the file to the browser's Downloads folder — move (rename if needed) it into `src/docs/demos/<Slug>.b4wgl.json` in the repo; it isn't saved there automatically.

**Path B — hand-write `.bas` + assets, then run the assembler script.** Use this for small, single-file demos simple enough to hold entirely in your head.

1. Create `demo-src/<slug>/` with your `.bas` file(s) at its root and an `assets/` subfolder for any images or audio.
2. Run `npm run build:demo -- demo-src/<slug> <SlugName>` — produces `src/docs/demos/<SlugName>.b4wgl.json`.
3. **Still required, exactly like Path A's last step:** load the result into the running app (Demos page → Try Demo, or import the JSON directly) and click Run to verify zero console `ERR` entries. The script only assembles the file — it doesn't prove the code is correct.
4. Commit `demo-src/<slug>/` to git alongside the generated `.b4wgl.json` — it's the maintainable plain-text source for that demo (easier to edit and diff than the opaque JSON blob), not a throwaway scratch folder.

## Step 4: Production checklist (mandatory, no exceptions)

- [ ] `.b4wgl.json` verified to run with zero `ERR` console entries.
- [ ] `src/docs/demos/<slug>.md` write-up — required-assets table, controls, how-it-works explanation, full source. See `raycaster.md` for the template.
- [ ] `demoRegistry.ts` entry (with a `file` basename — not an inline `json` blob).
- [ ] `docs/manifest.ts` nav entry under `Demos`.
- [ ] `cypress/e2e/demos.cy.ts` — add an entry to the `DEMOS` array (slug, title, waitMs). Each demo is seeded through the dev/Cypress-only `window.__seedDemo(slug)` hook (registered in `src/pages/DemosPage.tsx`), which runs the app's real `loadDemoJson(slug) → importProject → putAssetBlob` path — the same thing clicking "Try Demo" does. Assets and persisted state now live in IndexedDB, so there is no `localStorage['persist:softBASIC']` key to hand-write; the hook is the only sane seed path. The shared helper `cypress/support/seedProject.ts` (`seedProject` / `seedAndRun`, backed by `window.__seedProject` in `src/devSeed.ts`) covers the non-demo specs the same way. **Mandatory — a demo isn't done without this.**
- [ ] If the demo needed new engine functions: they went through the full six-step "Adding a new language feature or library module" process from `CLAUDE.md`, including the descriptor+generator pipeline if the module is descriptor-driven (see `CLAUDE.md`'s "Descriptor-generated `.bas` files" section) — never a hand-edited `.bas` file.

## The assembler script: `scripts/buildDemo.ts`

Packages a `demo-src/<slug>/` folder into a `.b4wgl.json`. Input layout:

```
demo-src/<slug>/
  Main.bas
  Player.bas        # optional — any number of .bas files, flat, no subfolders
  assets/
    wall.png
    jump.wav
```

- Every `.bas` file directly in the source folder becomes one project file, sorted alphabetically.
- Every file in `assets/` becomes one project asset, sorted alphabetically, base64-encoded with its MIME type inferred from its extension — images (`.png .jpg .jpeg .gif .webp .svg .bmp`), audio (`.mp3 .wav .ogg`), and `.json` (data assets such as tilemap layouts, loaded via `tilemap.load()`) — the same "image / audio / text" split `src/components/AssetPreview/getAssetType.ts` recognises, with `.json` mapped to `application/json` (matching what the browser's own `FileReader.readAsDataURL` assigns when a `.json` file is dragged into the asset panel by hand). An unrecognised extension is still a hard error, not a silent guess — extend `MIME_TYPES` in `scripts/demoBuilder/packageDemo.ts` if a future demo needs another `getAssetType.ts`-recognised "text" extension.
- No folder nesting in v1 — every demo so far is flat. Extend `packageDemo` in `scripts/demoBuilder/packageDemo.ts` if a future demo genuinely needs subfolders.

Run: `npm run build:demo -- demo-src/<slug> <SlugName>`.
