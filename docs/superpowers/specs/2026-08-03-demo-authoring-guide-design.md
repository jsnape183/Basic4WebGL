# Demo Authoring Guide — Design

**Status:** Approved
**Date:** 2026-08-03

## Problem

Basic4WebGL ships one demo (Wolfenstein-style Raycaster) as a `.b4wgl.json` project export + a `docs/demos/raycaster.md` write-up + a `demoRegistry.ts` entry. Ahead of BETA, several more demo games are planned. Three real problems have already surfaced from the one demo that exists:

1. **No documented process.** There's no checklist for turning a game idea into a shipped demo — what files need to exist, in what order, is undiscoverable except by reading the one example.
2. **No mandatory verification.** The Raycaster demo has zero Cypress e2e coverage — `cypress/e2e/tutorials.cy.ts` explicitly only covers tutorials 1–9 and 11, never demos.
3. **Building the Raycaster demo caused a real shipped bug.** Its `setDepth`/`drawing.drawImageStrip` functions were added by hand-editing `.bas` files directly instead of going through the descriptor+generator pipeline, which is exactly the drift class of bug fixed in `5c81ef6`.

This spec defines a guide (`docs/demo-authoring-guide.md`, linked from `CLAUDE.md`) that closes all three gaps, plus the supporting tooling and retrofit needed to make the guide's checklist actually followable from day one.

## Scope

In scope:
- The guide document itself.
- A new assembler script (`scripts/buildDemo.ts`) that packages hand-written `.bas` files + image assets into a `.b4wgl.json`, since one authoring path in the guide depends on it existing.
- A Cypress e2e spec retrofitted onto the existing Raycaster demo, so the new mandatory-testing bar applies retroactively, not just to future demos.
- A short CLAUDE.md update linking to the guide.

Out of scope (explicitly deferred to follow-up work that uses this guide once it exists):
- Actually authoring any of the new demo games themselves.
- Folder/subfolder nesting support in the assembler script — every demo today and every one currently planned is flat (a handful of `.bas` files, no nested folders), so v1 only supports a flat structure. Nesting can be added later if a demo genuinely needs it.

## The guide: `docs/demo-authoring-guide.md`

An internal contributor doc, alongside `docs/roadmap.md` and `docs/outstanding-issues.md` — not part of the in-app `/docs` site (that's for players; this is for whoever is building a demo, human or agent).

### Section 1: What a demo is

Recaps the four pieces that make up a shipped demo, using Raycaster as the worked example:
- `src/docs/demos/<Slug>.b4wgl.json` — the project export
- `src/docs/demos/<slug>.md` — the "how it works" write-up (required assets table, controls, full source)
- `src/features/demos/demoRegistry.ts` — the entry (`slug`, `name`, `tags`, `description`, `docsSlug`, `json`)
- `docs/manifest.ts` — the nav entry under the Demos group

### Section 2: Pre-production brief (ask before writing any code)

Before starting implementation of a new demo, the agent asks the user a fixed set of questions — live in chat, no written artifact required (a demo is lighter-weight than a full feature spec):

1. **Concept** — one or two sentences on the mechanic/feature being showcased.
2. **Assets required** — for each visual asset: name/purpose, and either
   - *static*: pixel dimensions, or
   - *animated*: frame dimensions, frame count, suggested fps, animation names (idle/walk/etc.)
   - plus any art-style/color notes worth flagging.
3. **Audio required** (if any) — sound effect vs. loop, rough description.
4. **Controls** — keys/mouse actions.
5. **New engine features** — does this need any function that doesn't exist yet? This changes scope: a new engine function means the full six-step process from CLAUDE.md's "Adding a new language feature or library module" (descriptor, engine JS, bootstrapper wiring, tests, docs, roadmap), not just writing a demo. Flag it upfront rather than discover it mid-build.

### Section 3: Syntax correctness

Points back to CLAUDE.md's existing "API cross-reference rule" rather than duplicating it — every softBASIC snippet must be checked against the relevant `.bas` def file or API reference markdown before being written, never from memory.

### Section 4: Two authoring paths

**Path A — build live in the app (recommended for anything with real interactivity, multiple files, or class-based state).** Create a project in the running app, write `.bas` files in Monaco, run frequently, use inline error underlining / autocomplete / hover as you go. Once it runs cleanly, use the app's own Export feature to produce the `.b4wgl.json`. Guarantees the shipped file is exactly what was tested.

**Path B — hand-write `.bas` + assets, then run the assembler script (recommended for small, simple, single-file demos).** Write `.bas` files and drop image assets into a source folder, run `scripts/buildDemo.ts` to produce the `.b4wgl.json` directly. Faster to iterate and diff in git for simple cases. **Still ends the same way as Path A**: load the result into the running app and click Run to verify zero console `ERR` entries before considering it done — the script only assembles the file, it doesn't prove the code is correct.

Guidance on choosing: default to Path A once a demo has more than one file, any class-based game object, or meaningful interactivity — the live compiler feedback loop catches mistakes far faster than writing blind and discovering syntax errors only after assembling and loading. Path B is for demos simple enough to hold entirely in your head as you write them.

### Section 5: Mandatory production checklist

Mirrors the numbered-list style of CLAUDE.md's "Adding a new language feature" section:

1. Working `.b4wgl.json`, verified to run in the app with zero `ERR` console entries.
2. `docs/demos/<slug>.md` write-up — required-assets table, controls, "how it works" explanation, full source. Use `raycaster.md` as the template.
3. `demoRegistry.ts` entry.
4. `docs/manifest.ts` nav entry under the Demos group.
5. **Cypress e2e spec — mandatory, no exceptions.** Add a `describe` block to `cypress/e2e/demos.cy.ts` (seed the `.b4wgl.json` into `localStorage`, click Run, assert zero `ERR` console entries — identical pattern to `tutorials.cy.ts`).
6. If the demo needed new engine functions: they go through the descriptor+generator pipeline if the module is descriptor-driven (see CLAUDE.md's "Descriptor-generated `.bas` files" section) — never a hand-edited `.bas` file. Docs (API reference + roadmap) ship in the same commit per the standing "docs are not optional" rule.

## Assembler script: `scripts/buildDemo.ts`

**Input:** a source directory, e.g. `demo-src/<slug>/`:
```
demo-src/<slug>/
  Main.bas
  Player.bas        (optional — any number of .bas files, flat, no subfolders)
  assets/
    wall.png
    enemy.png
    jump.wav
    ...
```

**Output:** `src/docs/demos/<Slug>.b4wgl.json`, matching the existing `ProjectExportJson` shape exactly:
- `project.name` — from a required CLI arg.
- `folders: []` — v1 has no folder nesting.
- `files` — one entry per `*.bas` file in the source dir root, `id` a fresh `uuidv4()`, `folderId: null`, `fullName` equal to `name`, `source` read verbatim.
- `assets` — one entry per file in `assets/`, `id` a fresh `uuidv4()`, `folderId: null`, `fullName` equal to filename, `content` a `data:<mime>;base64,...` string built from the file's bytes. MIME type is inferred from the extension using the same set the app already recognises in `getAssetType.ts` — images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`) and audio (`.mp3`, `.wav`, `.ogg`) — so a demo needing sound effects works the same way as one needing sprites. An unrecognised extension is a hard error, not a silent guess.
- `fileOrder` / `assetOrder` — both `{ ":root": [...ids...] }`, ids ordered to match the files/assets sorted alphabetically by name — matching the app's own existing A→Z file-tree convention, so the demo's file panel looks the same whether it was imported or built by hand in the UI.

**Invocation:** `npm run build:demo -- demo-src/<slug> <SlugName>`, run via `vite-node` (same pattern as `generateLibrary.ts`).

**Testing:** the core packaging logic (source dir → `ProjectExportJson`) is a plain, pure function importable both by the CLI script and by a unit test — same separation-of-concerns pattern used for `registry.ts` (shared between `generateLibrary.ts` and its regression test). The test covers: alphabetical ordering, correct base64 content-type inference from file extension, and that output validates against the `ProjectExportJson` shape.

## Raycaster retrofit

New `cypress/e2e/demos.cy.ts` (a separate file from `tutorials.cy.ts` — demos and tutorials are conceptually distinct, no reason to interleave them in one spec file). One `describe` block for Raycaster, following `tutorials.cy.ts`'s exact pattern: seed `Raycaster.b4wgl.json` into `localStorage` under `persist:softBASIC`, click Run, assert no `ERR` entries appear in the console panel. This becomes the copy-paste template every new demo's own `describe` block extends.

No changes to the Raycaster demo's code itself — this is purely adding the missing test.

## CLAUDE.md update

A new short section (near "Adding a new language feature or library module", since it's a sibling authoring workflow) pointing at `docs/demo-authoring-guide.md`. The existing "E2E tests (Cypress)" section gets a one-line addition noting `demos.cy.ts` exists alongside `tutorials.cy.ts`, with the same "not wired into CI, run manually" caveat.

## Testing

- `scripts/buildDemo.ts`'s core packaging function gets unit tests (alphabetical ordering, base64/content-type correctness, output shape).
- `cypress/e2e/demos.cy.ts` is added with Raycaster's spec, run manually per existing Cypress conventions (not wired into CI — there is none yet).
- The guide document itself isn't code, so no automated test for its content — its value is verified by whether the next demo actually follows it.
