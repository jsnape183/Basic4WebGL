# `oninit` Lifecycle Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `oninit` — a module-level lifecycle hook that fires on every softBASIC module *before* asset preloading begins — with zero behaviour change for any project that does not define it.

**Architecture:** Split each transpiled root into two phases. Inert declarations (`const m = {}`, `class _sb_x{}`, function/method property assignments) stay inline; each root's executable top-level statements are wrapped in `_sb._deferModuleBody(() => {...})` and replayed in file order later. That makes the whole `//${transpiled}` block declaration-only, so it can move ahead of asset preload in `bootstrapper.html`, where `_sb._fireInit()` then dispatches `oninit` over the (now populated) `_sb._sbClasses`. Module bodies run after preload via `_sb._runModuleBodies()`, immediately before `_applySwitch()`.

**Tech Stack:** TypeScript compiler (transpiler rules), plain-JS engine modules, Vitest, Cypress.

Spec: `docs/superpowers/specs/2026-08-04-oninit-lifecycle-hook-design.md`

---

### Task 1: Engine lifecycle dispatch

**Files:** Modify `src/components/Runner/engine/lifecycle.js`; test `tests/components/Runner/lifecycle.test.ts` (new)

- [ ] Add `_deferredModuleBodies: []`, `_deferModuleBody(fn)`, `_runModuleBodies()`, `_fireInit()` to `_sbLifecycle`.
- [ ] `_fireInit()` walks `this._sbClasses` and calls `c.symbol.oninit()` when defined, wrapping each in `try/catch → _throwError(e)`, matching `_update`'s existing shape.
- [ ] `_runModuleBodies()` drains the queue in registration order (and clears it, so a re-run cannot double-execute).
- [ ] Tests: bodies replay in registration order; `_fireInit` skips modules without `oninit`; `_fireInit` fires every module that has one.

### Task 2: Transpiler phase split

**Files:** Modify `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts`, `.../helpers/transpilerHelpers.ts`; test `tests/lib/Basic4WebGL/unit/transpiler/oninit.test.ts` (new)

- [ ] `RootRule` partitions `node.children` into declarations (`nodeTypes.FunctionDecl`; `ConstructorDecl` already handled separately) and statements (everything else), generating each list separately.
- [ ] `formatRoot` takes both lists and emits declarations inline, then — only when the statement list is non-empty — `_sb._deferModuleBody(() => { <statements> });`.
- [ ] Tests: a module with top-level statements emits them inside `_sb._deferModuleBody`; its function declarations stay outside; a declaration-only module emits no wrapper; class prototype `dim` assignments are deferred while `class`/`prototype.<method>` declarations are not; `_sbClasses` is still emitted last.

### Task 3: Bootstrapper reorder

**Files:** Modify `src/components/Runner/bootstrapper.html`; test `tests/components/Runner/bootstrapper.test.ts`

- [ ] Move `//${transpiled};` above `//${inlineAssets}` / the two `preload*FromLocalStorage` awaits.
- [ ] Insert `_sb._fireInit();` directly after `//${transpiled};`.
- [ ] Insert `_sb._runModuleBodies();` directly after the preload awaits and before `_applySwitch()`.
- [ ] Update the stale comment above the key listeners (it explains why they sit after the transpiled code).
- [ ] Test: assert the boot sequence's relative ordering by index within the file, so a future reorder fails loudly.

### Task 4: Asset-not-ready diagnostic

**Files:** Modify `src/components/Runner/engine/assets.js`; test `tests/components/Runner/assets.test.ts` (new)

- [ ] In `get(name)`, when `!_ready`, throw the oninit-specific message ahead of the existing not-found error.
- [ ] Test: not-ready path names `oninit()` and points at `onenter()`; ready-but-missing path keeps today's wording.

### Task 5: Editor + docs

**Files:** Modify `src/lib/Basic4WebGL/keywords.ts`, `src/docs/language-guide/lifecycle.md`, `tests/lib/Basic4WebGL/keywords.test.ts`

- [ ] Add `'oninit'` to `SOFTBASIC_LIFECYCLE_EVENTS` (first, since it fires first) so Monaco highlights/completes it.
- [ ] Language Guide: new `## oninit()` section ahead of `onenter()`, covering when it fires, that it is module-level only, what is safe in it, and the two pitfalls (no assets, module-level `dim` not yet assigned).
- [ ] Extend the keywords test to cover `oninit`.

### Task 6: Roadmap docs

**Files:** Modify `docs/roadmap.md`, `docs/language/library-roadmap.md`

- [ ] Record the capability and note the deferred follow-up (pixel-art/nearest-neighbour texture filtering API) as a tracked item rather than dropping it.

### Task 7: Verification

- [ ] `npx vitest run` — full suite green.
- [ ] `npx vite build` — clean.
- [ ] `npm run dev` + `npx cypress run` — `tutorials.cy.ts`, `demos.cy.ts`, `save-load.cy.ts` unmodified and green (the real zero-regression proof), plus a new `cypress/e2e/oninit.cy.ts` proving `oninit` runs before preload and before `onenter`.
