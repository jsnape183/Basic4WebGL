# softBASIC — Internal Product Roadmap

> Internal document. Not for publication. Last updated: 2026-07-31.

---

## Versioning model

**Trunk-based development.** All work lands on `main`. Patch bumps (`0.x.Y`) are continuous — any fix, doc update, or small feature that ships independently. Minor bumps (`0.X.0`) mark milestone completions, each representing a discrete capability step. Currently at `v0.3.0`.

Milestones 1–5 are fully defined. Milestones 6–13 are intentionally loose — trajectory markers only. Each will be fully scoped and planned before implementation begins, so detail accumulates just-in-time rather than speculating years ahead.

---

## Current state (v0.3.0)

Shipped and working:
- Full softBASIC compiler (lexer → parser → transpiler → PIXI.js runtime)
- Sprite, animatedsprite, tilemap, text, drawing, audio, collision, input modules
- Scene management (`Scene` base class + `SceneManager`), camera (`camera` module), and world/HUD layers (`world` + `hud`, replacing the deprecated `stage` module) — closes out Milestone 1, see below
- Typed collections, class inheritance, `new` keyword, dependency-ordered multi-file builds
- Folder system, asset panel, import/export, package registry
- Landing page with live game preview
- Demos page, launched with a Wolfenstein-style raycaster tech demo

Known deferred issues (low risk, to be resolved as patches within Milestone 2):
1. Delegation-only parser rules (BoolTermRule, ExpressionRule, ModuleFactorRule) not verified for loc propagation — may produce imprecise error locations
2. Stray `}` and typo "occured" in `UnexpectedError` message template (`src/lib/CompilerLib/errors.ts`)
3. No test for `PrintNode.validate()` throw path (unreachable in practice)
4. `new Tree()` direct construction bypasses loc — should prefer `node()` factory; add JSDoc warning
5. `camera.shake(intensity, duration)` not implemented — named as a hard prerequisite in the (design-only, not yet built) "COMPOUND" top-down-shooter demo spec
6. No visual spritesheet editor/slicer in the asset panel — defining frame dimensions in code is the only option

---

## ~~Milestone 1 — Language complete~~ **[DONE — shipped as v0.3.0, 2026-06-24]**

**Goal:** Close out the planned softBASIC runtime modules.

### ~~Scene management~~ **[DONE]**
Shipped as a `Scene` base class + `SceneManager` module. Open questions resolved: scenes are softBASIC classes extending `Scene` (not top-level declarations), overriding only the lifecycle hooks they need (`onenter`, `onupdate(delta)`, `onexit`, `onkeydown(key)`, `onkeyup(key)`). Stage state transfer is **automatic** — the stage clears between `onexit` and `onenter` on every switch; anything that should persist across scenes is re-added in the new scene's `onenter`. Switching is deferred/queued (applied at end of tick), not immediate.

### ~~Spritesheets~~ **[DONE]**
Shipped as an extended `animatedsprite` constructor (`AnimatedSprite(imagePath, frameW, frameH)` slices the image into a frame grid) rather than a separate class — resolves the "new class vs. extended constructor" open question in favour of extension. `setSpriteSheet()` and `stop()` were added alongside it. The asset-panel visual slicer question was resolved as **not in scope** — still code-only (see deferred issue #6 above).

### ~~Camera / viewport~~ **[DONE]**
Shipped as `camera` + `world` + `hud` modules, deprecating `stage`. Open questions resolved: **no culling** in this milestone (deferred, off-screen sprites still render); world size is **explicit and optional** via `camera.setBounds(width, height)` — without it the camera is unbounded.

---

## Milestone 2 — Professional editor (minor bump)

**Now the current focus.**

**Goal:** Make the editor credible for sustained use. Full intellisense backed by the existing `.bas` definition files.

### Deliverables
- **Autocomplete** — module function names, class methods, variable names in scope
- **Hover documentation** — function signature and description on hover, sourced from `.bas` def files
- **Parameter hints** — inline signature help as arguments are typed (current argument highlighted)
- **Error underlining** — surface compile diagnostics inline in the editor, not just in the bottom panel

### Technical decisions to make before sprint starts
- **Editor component:** Current editor is a basic textarea. This milestone requires replacing it with Monaco Editor or CodeMirror 6. Monaco gives VS Code parity (better intellisense API); CodeMirror 6 is lighter and more embeddable.
- **Completion provider:** A full LSP is overkill. The `.bas` definition files already encode the complete API surface — a static completion provider built from those is sufficient. Dynamic symbol resolution (user-defined functions, class names) should also be included.
- **Incremental parsing for error underlining:** The current batch compiler is not designed for keystroke-level feedback. May need a lightweight incremental mode or debounced re-compile.

---

## Milestone 3 — User accounts (minor bump)

**Goal:** Optional account layer. localStorage remains the primary store. Accounts add cloud sync and are the prerequisite for Milestone 4 and all monetisation work.

### Architecture
- **Backend:** Node.js API server. Framework, ORM, and hosting TBD.
- **Auth:** Email/password + OAuth (GitHub at minimum). JWT-based sessions.
- **localStorage stays:** All projects work without an account. Signing in unlocks sync.
- **Sync model:** On sign-in, offer to import existing localStorage projects. Per-project opt-in to sync.
- **Free tier limit:** 3 synced projects. Unlimited local-only projects.

### Deliverables
- Node API: auth endpoints, project CRUD, asset storage
- Sign-in / sign-up UI
- Guest → account migration flow (one-click import of localStorage projects)
- Sync status indicators in the project list
- Free tier enforcement at project 4 with upgrade prompt

### Additional work in this milestone
- **Observability:** Integrate error tracking (Sentry or equivalent) before user traffic scales. The current iframe `window.onerror` handler pipes runtime errors to the IDE console; production JS errors outside the iframe are currently uncaptured.
- **GDPR groundwork:** Cookie consent, privacy policy, right-to-erasure endpoint. Must ship with or before accounts — cannot be deferred after.

### Open questions
- Database: Postgres (most likely), hosted where?
- Asset storage: S3-compatible object storage for images and audio.

---

## Milestone 4 — Cloud storage, project sharing, and game gallery (minor bump)

**Goal:** Cloud-synced projects become shareable and publishable. A public game gallery provides a growth and discovery mechanic.

### Deliverables
- **Project sharing:** Public read-only URL for any synced project. Recipients can view code and play the game in a sandboxed player without an account.
- **Published games:** One-click "publish" creates a persistent play URL with clean chrome-free player page.
- **Game gallery:** Browseable index of published games. Discoverable without an account.
- **Free tier storage limits:** Asset storage quota per account (images, audio). Soft limit with notification; hard limit prevents new uploads.
- **Project forking:** "Remix this project" on a shared URL creates a copy in the viewer's account.

### Moderation
Public content requires at minimum a report + takedown mechanism. Even a simple "Report this game" form and manual review queue is enough to start. This must be in scope for M4, not deferred.

### Open questions
- CDN strategy for published game assets (images, audio served at low latency globally)
- Gallery curation: algorithm, recency, or manual featuring?
- Moderation tooling: who reviews reports and how?

---

## Milestone 5 — Package ecosystem (minor bump → v1.0)

**Goal:** Third-party or first-party packages that extend the softBASIC runtime. The Redux package registry and `.bas` definition file architecture already provide the foundation. v1.0 is tagged on completion of this milestone — it represents softBASIC as a genuine, open platform.

### Key decisions to make before sprint starts
- **Scope:** First-party packages only (published by the softBASIC team), or open third-party community publishing? First-party is strongly recommended for v1.0 — third-party introduces trust, discovery, and security complexity that is better addressed post-1.0.
- **Package format:** How are packages distributed? Bundled at build time, loaded from a registry, or user-uploaded?
- **Discovery:** In-editor package browser, or docs-based listing?
- **Versioning:** SemVer per package, or monorepo-style with softBASIC itself?

---

## Milestones 6–13 — Trajectory (to be scoped before each milestone begins)

The milestones below are intentional direction-setters, not specifications. Each will be fully designed before implementation starts. What follows is enough context to understand the ordering rationale.

### Milestone 6 — AI-assisted development (first phase)
Claude API integration in the editor. First phase is deliberately constrained: single-file edits only, not a full code generator. Likely includes inline error explanation for beginners and assisted function writing. Requires M3 account infrastructure for per-user rate limiting and token budgets to be in place before this can ship responsibly.

Key questions to answer when firming this up: Which Claude model per task type? What context is sent (current file, relevant `.bas` defs, error list)? What are the free tier token allowances? How is prompt injection from user game code mitigated?

### Milestone 7 — Paid tier
Stripe billing, server-side feature flags, and expanded limits for paying users. The free tier already has enforcement points from M3/M4 (synced project limit, storage quota, AI token budget) — this milestone converts those into a real subscription product.

Unlocks: more synced projects, more storage, more AI usage, more published games. Pricing TBD.

### Milestone 8 — Game export to desktop executable (paid tier only)

User-initiated export that bundles a finished game project into a standalone installable — Windows `.exe` and macOS `.app` at minimum.

This is a significant infrastructure and planning undertaking. The bundle must include:
- PIXI.js runtime (currently CDN — must be local for offline distribution)
- The softBASIC runtime engine modules
- All transpiled game code
- All game assets (images, audio)
- A host shell (Electron or Tauri — decision needed)

Additionally requires:
- Code signing for both platforms to avoid OS security warnings (Windows Authenticode, macOS Apple Developer ID — both require certificates and provisioning)
- Asset pipeline to package and reference local assets correctly
- Build server or CI integration to run the packaging process

**Note:** M8 and M13 (desktop IDE) share the same underlying shell technology decision. That choice should be made once, here, not independently at M13.

### Milestone 9 — Mobile touch support
Touch input in the runtime already partially exists. This milestone makes it first-class: touch events mapped to softBASIC input functions, responsive canvas sizing, and IDE usability on tablet (not necessarily phone).

### Milestone 10 — Sprite editor
In-app pixel art / sprite editor. Removes the dependency on external tools for basic sprite creation. Scope and format TBD — could range from a minimal pixel canvas to a layered editor.

### Milestone 11 — Tilemap editor
Visual tilemap editor integrated with the existing `tilemap` module. Paint tiles onto a grid, configure tile properties, export to a format the runtime can load. Scope TBD.

### Milestone 12 — Music editor
Basic in-app music / sequencer tool. Scope TBD — likely tracker-style given the beginner audience. Tied to the existing audio module.

### Milestone 13 — Desktop app (IDE as installable)
The softBASIC editor itself packaged as a native desktop application. Shares the Electron/Tauri decision made at M8. Enables offline use of the full IDE, local file system access for assets, and potentially better performance than the browser version.

---

## Perpetual parking lot

Items that don't fit cleanly into the milestone sequence but should be revisited periodically:

- **Multiplayer / real-time co-editing** — requires account infrastructure (M3) as a prerequisite. Significant complexity beyond that.
- **Spritesheet editor** — may be pulled into M10 (sprite editor) depending on scope decisions there.
- **Team / organisation tier** — shared projects, multiple seats. Natural extension after paid tier (M7).
- **Game embedding** — embed a published game in an external site via `<iframe>`. Possible extension of M4 sharing infrastructure.
