# Basic4WebGL — Claude Code Project Guide

## What this project is

A browser-based IDE for writing 2D games in **softBASIC**, a custom BASIC-like language that compiles to JavaScript and runs in a WebGL canvas (via PIXI.js). The project is a TypeScript/React frontend. There is no backend.

---

## Commands

| Task | Command |
|------|---------|
| Run tests | `npm test` (interactive) or `npx vitest run` (single pass) |
| Run tests with coverage | `npm run test:ci` |
| Build for verification | `npx vite build` |
| Dev server | `npm run dev` |

### IMPORTANT: verification command

**Use `npx vite build` (or `npm run build`) to verify the project builds.** Do NOT use:
- `tsc --noEmit` — has pre-existing TypeScript env issues unrelated to our code (`tsconfig.node.json` composite mode expects declaration files that don't exist)

---

## Repository conventions

- **Branch:** Work directly on `main`. No feature branches unless explicitly requested.
- **Commits:** Frequent, small, imperative-style messages (`feat:`, `fix:`, `docs:`).
- **Tests:** All tests live in `tests/` mirroring `src/`. Run the full suite before committing any compiler/transpiler changes.

### Pushing to main — required extra step

**When explicitly told to push**, update `src/docs/release-notes.md` with a summary of the changes and bump the `version` field in `package.json` appropriately (patch for fixes/docs, minor for new features). Commit both together with a `chore: bump version to x.y.z` message, then push. Do not update release notes or version unless the user asks you to push.

---

## TypeScript / React

- **Always include `import React from 'react'`** at the top of every `.tsx` file. The project does not use the JSX transform shortcut.
- **Design tokens:** Never use raw colours. Use the `ds-*` CSS variables defined in the theme:
  - Backgrounds: `ds-bg`, `ds-surface`
  - Borders: `ds-border`
  - Text: `ds-text`, `ds-text-muted`, `ds-text-dim`
  - Accent: `ds-accent`, `ds-accent-btn`, `ds-accent-btn-text`
  - Status: `ds-error`, `ds-error-bg`

---

## Architecture

```
src/
  lib/Basic4WebGL/       # Compiler: lexer, parser, transpiler, nodes, rules
  lib/CompilerLib/       # Shared compiler infrastructure
  lib/Basic4WebGL/defs/  # .bas definition files — the softBASIC standard library API
  components/Runner/engine/  # JS engine modules that run at game runtime (PIXI-based)
  components/Runner/softBasicEngine.js  # Engine bootstrapper — wires all engine modules together
  components/Docs/       # Docs section React components
  docs/                  # Markdown content for the docs section
  docs/manifest.ts       # Single source of truth for docs navigation
  pages/                 # Top-level page components
  features/              # Redux slices
tests/                   # All tests, mirroring src/ structure
```

---

## Adding a new language feature or library module

Every new softBASIC module/class requires **six steps**:

1. **`.bas` definition file** (`src/lib/Basic4WebGL/defs/<name>.bas`) — defines the API surface as softBASIC function/class declarations that call through to `_sb.*` engine methods.
2. **Engine JS file** (`src/components/Runner/engine/<name>.js`) — implements the actual runtime behaviour using PIXI.js and browser APIs.
3. **Bootstrapper wiring** (`src/components/Runner/softBasicEngine.js`) — registers the new engine module so it is available at runtime.
4. **Tests** (`tests/lib/Basic4WebGL/unit/transpiler/<name>.test.ts` and/or integration tests) — written first (TDD). Tests verify the transpiler output, not runtime behaviour.
5. **Docs** — add or update in-app documentation to cover the new feature (see Docs section below). New modules get an API Reference page; changes to existing language behaviour must be reflected in the relevant Language Guide topic.
6. **Roadmap docs** — if the feature closes out (fully or partially) an item tracked in `docs/roadmap.md` or `docs/language/library-roadmap.md`, update those files in the same commit: mark the item done, replace open questions with how they were actually resolved, and note any real gap left behind (e.g. a deferred sub-feature) as a new tracked item rather than silently dropping it. These two roadmap files have gone stale before — pulled from `origin/main`, matched against the actual shipped code, but not updated — because this step didn't exist yet. Don't rely on `src/docs/roadmap.md` (the public-facing summary) as the source of truth for this; it's a separate file that must also be kept current, not a substitute.

---

## Docs section

**Documentation is not optional.** Any change that adds, removes, or alters softBASIC behaviour — new functions, changed signatures, new modules, new language constructs — must be accompanied by a docs update in the same commit or PR. Code ships with its docs.

Docs live at `/docs` and are built from markdown files in `src/docs/`.

### Navigation manifest

`src/docs/manifest.ts` is the single source of truth. Two section types:
- **Flat sections** (Language Guide): `topics: DocTopic[]`
- **Grouped sections** (API Reference): `groups: DocGroup[]` with `topics: []`

Use `getSectionTopics(section)` from `manifest.ts` whenever you need a flat list of topics — never access `section.topics` directly in components.

### Writing style for API docs

- **Audience:** Beginners — no prior coding experience assumed beyond the Language Guide.
- **No JS internals:** Never reference JavaScript, `this`, PIXI, handles, or internal implementation details.
- **Parameter types:** Use `number`, `string`, `true` or `false` (not boolean), `object`, `array`.
- **Structure per function:** one-sentence description → parameter table → `**Returns:**` line (omit for void) → `.bas` code example.
- **Examples:** Use game-like scenarios (players, enemies, scores, inventory). No abstract `foo`/`bar`.
- **Classes** (sprite, animatedsprite, text, tilemap, ObjectTransform): start with a `## Constructor` section.

### API cross-reference rule

**Before writing any softBASIC code snippet in docs or tutorials, verify the exact call syntax against the relevant `.bas` def file in `src/lib/Basic4WebGL/defs/` or the corresponding API reference markdown in `src/docs/api-reference/`.** Never write from memory.

Critical points confirmed by the def files:
- **Module functions require the module prefix** — `string.str()`, `array.push()`, `math.floor()`, `math.clamp()`, `math.randomint()` etc. Never bare `str()`, `push()`, `floor()`.
- **Array declaration** uses `dim arr(N)` — not `arr = []`. An empty dynamic array is `dim arr(0)`.
- **Array indexing** uses parentheses — `arr(i)`, not `arr[i]`.
- **Array length** is `array.arrLength(arr)`.
- **Drawing** calls need two module prefixes: `pen.setFillColor()`, `pen.setLineColor()`, `pen.setLineWidth()` for styles; `drawing.drawRect()`, `drawing.drawCircle()`, `drawing.drawLine()` for shapes.

### Key gotchas
- `text` does not have a `.transform` property — position is set via `setPosition(x, y)` directly.
- `assetmanager.loadImage` is a cache retrieval, not a loader. Assets are pre-loaded automatically at game start.
- `drawRect(x, y, ...)` — x, y is the **centre** of the rectangle (engine sets pivot at width/2, height/2).
- `math.random(max)` takes one arg (upper limit, exclusive). `math.randomint(max)` takes one arg (returns 0 to max-1).

---

## Docs superpowers workflow

Plans live in `docs/superpowers/plans/`, specs in `docs/superpowers/specs/`. Follow the standard brainstorm → plan → subagent-driven execution cycle for non-trivial features.
