# softBASIC — Internal Product Roadmap

> Internal document. Not for publication. Last updated: 2026-06-19.

---

## Versioning model

**Trunk-based development.** All work lands on `main`. Patch bumps (`0.x.Y`) are continuous — any fix, doc update, or small feature that ships independently. Minor bumps (`0.X.0`) mark milestone completions, each representing a discrete capability step. Currently at `v0.2.4`.

The P-list milestone closes out the language and runtime layer and targets `v1.0`. All subsequent milestones are post-1.0.

---

## Current state (v0.2.4)

Shipped and working:
- Full softBASIC compiler (lexer → parser → transpiler → PIXI.js runtime)
- Sprite, animatedsprite, tilemap, text, drawing, audio, collision, input modules
- Typed collections, class inheritance, `new` keyword, dependency-ordered multi-file builds
- Folder system, asset panel, import/export, package registry
- Landing page with live game preview

Known deferred issues (low risk, to be resolved as patches within the P-list milestone):
1. Delegation-only parser rules (BoolTermRule, ExpressionRule, ModuleFactorRule) not verified for loc propagation — may produce imprecise error locations
2. Stray `}` and typo "occured" in `UnexpectedError` message template (`src/lib/CompilerLib/errors.ts`)
3. No test for `PrintNode.validate()` throw path (unreachable in practice)
4. `new Tree()` direct construction bypasses loc — should prefer `node()` factory; add JSDoc warning

---

## Milestone 1 — Language complete (v0.3 → v1.0)

**Goal:** Close out the planned softBASIC runtime modules. Each module ships as a minor version bump with patch work in between.

### v0.3 — Scene management
A `scene` module letting developers define named game states (menu, game, game-over) with individual `onenter` / `onupdate` / `onexit` lifecycle hooks. Avoids requiring users to hand-roll state machines in global variables.

Key deliverables:
- `scene.bas` definition file
- `scene.js` engine module wired into bootstrapper
- `scene.switch(name)` runtime method
- Transpiler support for multi-scene files or scene class pattern
- Tests + docs

Open questions:
- Are scenes defined as softBASIC classes extending a `scene` base, or as top-level declarations?
- How does `stage` state (background, sprites) transfer between scenes — explicit teardown or automatic?

### v0.4 — Spritesheets
Extend the existing `animatedsprite` to support spritesheet slicing (define frame grid by tile size, or individual frame rects). Separate from the existing frame-sequence animation which requires individual image files.

Key deliverables:
- `spritesheet.bas` or extended `animatedsprite.bas`
- Engine support for `PIXI.Spritesheet` or manual UV slicing
- Asset panel preview for spritesheet frames
- Tests + docs

Open questions:
- New class (`spritesheet`) or extended constructor on `animatedsprite`?
- Does the asset panel need a spritesheet editor/slicer, or is defining frame dimensions in code sufficient for v0.4?

### v0.5 — Camera / viewport
A `camera` module for scrolling worlds larger than the canvas. Moves the PIXI stage container rather than individual sprites.

Key deliverables:
- `camera.bas` definition file
- `camera.js` engine module
- `camera.follow(sprite)` for automatic tracking
- `camera.setPosition(x, y)` / `camera.move(dx, dy)` for manual control
- Tests + docs

Open questions:
- Does camera clip rendering at canvas bounds (culling) in v0.5 or is that deferred?
- World size vs viewport size — does the developer define a world size explicitly?

### v1.0 — Language milestone
Tagged when all P-list modules are complete and deferred technical issues (above) are resolved. Represents a stable, feature-complete softBASIC runtime. No breaking changes after this point without a major version bump.

---

## Milestone 2 — Professional editor (v1.1)

**Goal:** Make the editor credible for sustained use. Full intellisense backed by the existing `.bas` definition files.

### Deliverables
- **Autocomplete** — module function names, class methods, variable names in scope
- **Hover documentation** — show function signature and description on hover, sourced from `.bas` def files
- **Parameter hints** — inline signature help as arguments are typed (argument count, current argument highlighted)
- **Error underlining** — surface compile diagnostics inline in the editor, not just in the bottom panel

### Technical decisions to make
- **Editor component:** Current editor is a basic `<textarea>`-equivalent. This milestone requires replacing it with Monaco Editor or CodeMirror 6. Monaco gives VS Code parity (better intellisense API); CodeMirror 6 is lighter and more embeddable. Decision needed before sprint starts.
- **Language server vs in-editor:** A full LSP is overkill at this stage. The `.bas` definition files already encode the complete API surface — a static completion provider built from those is sufficient for v1.1. Dynamic (in-project) symbol resolution (user-defined functions, class names) should also be included.
- **Incremental parsing:** Error underlining ideally runs on every keystroke. The current batch compiler is not designed for this. May need a lightweight incremental parse mode or debounced re-compile.

---

## Milestone 3 — User accounts (v1.2)

**Goal:** Optional account layer. localStorage remains the primary store. Accounts add cloud sync and are the foundation for future monetisation and AI features.

### Architecture
- **Backend:** Node.js API server. Stack (framework, ORM, hosting) TBD.
- **Auth:** Email/password + OAuth (GitHub at minimum). JWT-based sessions.
- **localStorage stays:** All projects remain usable without an account. Signing in unlocks sync.
- **Sync model:** On sign-in, offer to import existing localStorage projects. Ongoing sync is opt-in per project ("Sync this project to cloud").
- **Free tier limit:** 3 synced projects. Unlimited local-only projects.

### Deliverables
- Node API: auth endpoints, project CRUD, asset storage
- Sign-in / sign-up UI (modal or dedicated page)
- Guest → account migration flow (one-click import of localStorage projects)
- Sync status indicators in the project list ("Synced", "Local only", "Unsaved changes")
- Free tier enforcement (sync blocked at project 4 with upgrade prompt)

### Additional work in this milestone
- **Observability:** Integrate error tracking (Sentry or equivalent) before user traffic scales. The current iframe `window.onerror` handler pipes runtime errors to the IDE console; production JS errors outside the iframe are currently uncaptured.
- **GDPR groundwork:** Cookie consent, privacy policy, right-to-erasure endpoint. Required the moment personal data is stored. Must ship with or before the account feature, not after.

### Open questions
- Database: Postgres (most likely), hosted where?
- Asset storage: S3-compatible object storage for images/audio
- Will unauthenticated users still be able to use the app fully? (Yes — localStorage remains)

---

## Milestone 4 — AI-assisted development (v1.3)

**Goal:** Claude API integration in the editor. Primary adoption differentiator. Available on free tier with rate limits; expanded on paid tier.

### Proposed interaction model
- **Sidebar assistant:** Chat panel alongside the editor. User describes what they want; AI generates or modifies softBASIC code.
- **Inline actions:** Right-click or shortcut to "explain this", "fix this error", "complete this function".
- **Error explanation:** When a compile error appears, offer "Explain this error" which gives a plain-English description targeted at beginners.

### Rate limiting and abuse prevention
- **Per-user token budget:** Daily/monthly token allowance tracked server-side (not client-side). Free tier gets a meaningful but bounded allowance; paid tier gets a larger one.
- **Request rate limiting:** Max N requests per minute per user, enforced at the API layer.
- **Prompt injection mitigation:** User code is sent to Claude as part of the context. Must sanitise or clearly delimit user content so malicious game code cannot alter the system prompt or extract secrets. Use Claude's system prompt to enforce output format (softBASIC only, no explanations of unrelated topics).
- **Cost cap per user:** Hard server-side spend cap per user per billing period. Beyond cap, AI features gracefully degrade with a clear message.
- **Unauthenticated users:** AI features require sign-in (prevents trivial abuse via anonymous sessions).

### Technical decisions to make
- Which Claude model? Haiku for speed/cost on autocomplete-style tasks; Sonnet for generation and explanation.
- Streaming responses: yes, for responsiveness in the sidebar.
- Context window strategy: include current file, relevant `.bas` definitions, compiler error list. Exclude all other files by default to keep context small.

---

## Milestone 5 — Cloud storage and project sharing (v1.4)

**Goal:** Projects stored in the cloud are shareable and publishable.

### Deliverables
- **Project sharing:** Generate a public read-only URL for any synced project. Recipients can view code and run the game in a sandboxed player — no account required to play.
- **Published games:** Optional one-click "publish" that creates a persistent shareable URL with a clean play page (no editor chrome). Acts as a growth mechanic.
- **Free tier storage limits:** Storage quota on assets (images, audio) per account. Soft limit with notification; hard limit prevents new asset uploads.
- **Project forking:** "Remix this project" on a shared project URL creates a copy in the viewer's account.

### Open questions
- Asset CDN: need object storage + CDN for published game assets (images, audio served at low latency)
- Is there a gallery/discovery page for published games? (Likely v1.5 or later)

---

## Milestone 6 — Paid tier (v1.5)

**Goal:** Monetisation. Paid tier unlocks higher limits and premium features.

### Tier structure (draft)
| Feature | Free | Paid |
|---------|------|------|
| Local projects | Unlimited | Unlimited |
| Synced projects | 3 | Unlimited |
| Asset storage | 100 MB | 2 GB |
| AI requests | Limited daily budget | Expanded monthly budget |
| Published games | 1 | Unlimited |
| Priority support | — | Yes |

### Deliverables
- Stripe integration (subscription billing, webhook handling)
- Feature flag system (server-side, not client-side — client-side flags are trivially bypassed)
- Upgrade prompt UX at limit boundaries (not paywalled up-front — earned through use)
- Billing management page (cancel, change plan, download invoices)

### Open questions
- Price point TBD
- Annual billing discount?
- Team/organisation tier (shared projects, multiple seats)? Likely post-v1.5.

---

## Items not on the milestone list (to revisit)

- **Package ecosystem:** Third-party packages contributed by users. Architecture exists (package registry in Redux) but discovery, publishing, and trust model are undefined.
- **Mobile/touch support:** The editor is desktop-only. Touch input in the runtime exists but the IDE itself is not usable on mobile.
- **Multiplayer:** Real-time co-editing. Not on the near-term roadmap but the account infrastructure in v1.2 is a prerequisite.
- **Game gallery / discovery:** Browse published games. Natural extension of v1.4 sharing.
- **Spritesheet editor:** Visual frame slicer in the asset panel. Deferred from v0.4 if frame-dimension-in-code is sufficient.
