# Instance registry aliasing across the `_sb` spread — design note

**Date:** 2026-08-04
**Status:** Shipped
**Scope:** Runtime engine (`engine/stage.js`, `engine/lifecycle.js`, `bootstrapper.html`). No compiler change, no softBASIC API surface change.

---

## Symptom

Every object instance added with `world.add()` / `hud.add()` silently stopped receiving its
own `onupdate(delta)` from the real per-frame loop, permanently, the first time any of
`world.remove()`, `hud.remove()`, `world.clear()`, `hud.clear()` ran — or a scene switch
happened, which calls the engine's internal `clear()`.

There was a second, opposite symptom from the same cause that the original report did not
mention: objects that were **removed** never *stopped* updating. `world.remove(enemy)`
detached the enemy's display handle, so it vanished from screen, but its `onupdate` kept
running every frame forever — an invisible zombie still burning CPU and still mutating game
state.

Both were completely silent: no compile diagnostic, no runtime error, no console output.
The objects still existed, still held correct `onupdate` methods, and still behaved
correctly when their `onupdate` was invoked directly. Only the engine's dispatch was wrong.

This breaks a documented guarantee — `src/docs/language-guide/lifecycle.md` states that
instance methods named `onupdate` "will be called by the engine on every active instance".

Practically every real project hits this immediately: any scene-based game switches scenes
at least once at startup, and that alone poisons instance updates for the rest of the run.

---

## Root cause

`softBasicEngine.js` builds the single global `_sb` by spreading every engine module into
one flat object:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  // …12 more modules
};
```

The modules are concatenated as raw text into the sandboxed iframe (`Runner/index.tsx`), so
this spread runs exactly **once**, at script-eval time. For a reference-typed property like
`_sbLifecycle._sbInstances` (an array), the spread copies the *reference* into a **second,
independent property slot** on `_sb`. After the spread there are two slots — `_sb._sbInstances`
and `_sbLifecycle._sbInstances` — that happen to point at one array.

Mutating that array through either slot is fine and both stay in agreement. **Reassigning
either slot silently detaches them**, and nothing in the codebase makes that visible.

`stage.js` was the only module that reassigned:

```js
// stage.js — before
removeFromWorld(obj) { _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(…); }
clearWorld()         { _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(…); }
removeFromHud(obj)   { _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(…); }
clearHud()           { _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(…); }
clear()              { _sbLifecycle._sbInstances = []; }
```

Five `filter`/`[]` reassignments, each writing the **module's** slot by hardcoded name. The
readers, meanwhile, all go through `_sb`:

- `_sb._update` resolves to `_sbScene._update` (the last spread module defining `_update`),
  which calls `_sbLifecycle._update.call(this, delta)` with `this` bound to `_sb`. Instance
  dispatch therefore reads `this._sbInstances` — i.e. **`_sb`'s** slot.
- `bootstrapper.html`'s `keydown`/`keyup` listeners read `_sb._sbInstances` directly, so
  instance-level `onkeydown`/`onkeyup` were broken by the same divergence.

So the instant any of those five lines ran, `_sbLifecycle`'s slot pointed at a fresh array
while `_sb`'s slot kept the original, now permanently orphaned one. Subsequent `addToWorld`
/`addToHud` pushed onto the new array (they also hardcoded `_sbLifecycle`), which the frame
loop never looked at again — while the orphaned array still held everything registered
before the first mutation, forever, explaining the zombie half.

The five lines were the *only* place in the entire engine that wrote to a hardcoded module
object's property. Every other module reads and writes its own state through `this`
(`camera.js`, `scene.js`, `input.js`, and `lifecycle.js`'s own `_deferredModuleBodies`),
which is safe because `this` is always `_sb` — the same slot the readers use.

### Why `this` is reliably `_sb` in `stage.js`

Every call site routes through `_sb`: the generated defs emit `_sb.addToWorld(...)`,
`_sb.clearWorld()`, `_sb.clear()` etc. (`world.bas`, `hud.bas`, `stage.bas`);
`_sbScene._applySwitch` calls `this.clear()` with `this` already `_sb`; and the deprecated
`addToStage`/`removeFromStage` aliases delegate via `this`. The decisive existing evidence
is that `clear()` already called `this._cameraReset()` — a method that lives in `camera.js`,
not `stage.js` — so `this` **had** to be the merged `_sb` for the pre-existing code to work
at all.

---

## Fix

Two components, both required, addressing the single root cause "the instance registry has
two aliasable slots and a writer that breaks the alias":

**1. One owner.** `stage.js` now accesses the registry through `this._sbInstances`, exactly
like every other engine module accesses its own state. There is no longer any writer to the
module's own slot, so the two can no longer disagree about which array is current.

**2. Stable array identity.** The registry is now only ever mutated in place, never replaced.
A new `_retainInstances(predicate)` helper on `lifecycle.js` (which owns `_sbInstances`)
does an in-place compaction, replacing all four `filter` reassignments; `clear()` uses
`this._sbInstances.length = 0`. Any holder of the reference — `_sbLifecycle`'s vestigial
slot, a closure, future code — therefore keeps seeing the live registry.

Component 1 alone fixes the bug; component 2 alone also fixes it. Both are kept because each
closes a *different* re-break path: 1 removes the offending write pattern and restores the
engine-wide `this` convention, 2 makes the by-reference alias unbreakable even if some future
code does reach for a module slot directly.

**3. Per-frame snapshot (required by 2).** In-place mutation introduced a hazard the old
reassign accidentally masked: `forEach` over the live array skips an element when an earlier
one is spliced out mid-iteration — i.e. an object calling `world.remove(self)` from inside
its own `onupdate` (the single most common pattern in a game: an enemy dying) would make a
sibling silently miss that frame. Instance dispatch now iterates `this._sbInstances.slice()`,
giving every object registered at the start of a frame exactly one update and deferring new
arrivals to the next frame. The same snapshot was applied to the bootstrapper's
`keydown`/`keyup` instance dispatch, which has the identical hazard.

### Rejected alternatives

- **Patch the five reassignments to in-place mutation, leaving the hardcoded `_sbLifecycle`
  name.** Works, but keeps two slots whose agreement rests on an implicit, ungreppable "never
  reassign this one property" rule, and leaves `stage.js` as the sole module violating the
  engine's `this` convention — so the next careless `= filter()` re-opens the bug.
- **Never spread `_sbInstances` by value: after building `_sb`, install an accessor
  (`Object.defineProperty(_sb, '_sbInstances', { get: () => _sbLifecycle._sbInstances })`).**
  This does make divergence structurally impossible, and it was the closest contender. Rejected
  because it (a) makes `_sb._sbInstances` non-writable, a behavioural change with no other
  motivation, (b) introduces accessor metaprogramming into an engine that is otherwise plain
  object literals, (c) is special-cased to one property and does not generalise, and crucially
  (d) *preserves* the authoring mistake that caused this — `stage.js` would still be reaching
  for another module's state by name, so the next module that does the same to a **different**
  property is still broken. The chosen fix removes the mistake instead of tolerating it.
- **Move the registry off `_sb` entirely into a closure-scoped module.** Correct in principle,
  but a much larger refactor of the runtime for no additional safety over the chosen fix.

---

## Audit for sibling instances of the same hazard

The bug class is: *any module property that is a mutable reference type, spread into `_sb`,
and later reassigned through the module's own name rather than `this`.* Every engine module
was checked.

- **`stage.js`'s five writes were the only occurrences in the whole engine.** A grep for
  writes of the form `_sbXxx.prop = …` across all 14 modules returns nothing else.
- The other hardcoded module references (`_sbAssets.get`, `_sbFile.fileRead/fileWrite`,
  `_sbLifecycle._update.call`) are **method** reads. Methods are never reassigned, so the
  spread-time copy stays correct — no hazard.
- All remaining module state (`camera.js`'s `_camX`/`_followTarget`/…, `scene.js`'s
  `_scenes`/`_activeScene`/`_pendingSwitch`, `input.js`'s `_keys`/`_justPressed`/…,
  `lifecycle.js`'s `_deferredModuleBodies`) is written exclusively through `this`, so writes
  and reads hit the same `_sb` slot and the module's own slot is simply vestigial.
- **`_sbClasses` confirmed unaffected**, as suspected. It is never written by a module: the
  transpiler emits `_sb._sbClasses = [...]` directly onto `_sb` (`terminationRules.ts`), and
  every reader uses `this._sbClasses` (bound to `_sb`) or `_sb._sbClasses`. Single slot in
  play. This is in fact the same "`_sb` owns the slot" shape the fix adopts, already working
  correctly in the sibling property of the very same module.

---

## Verification

- **`tests/components/Runner/stage.test.ts` (new, 19 tests).** Loads the 14 real engine
  module sources plus the real `softBasicEngine.js` and evaluates them in one scope, so the
  actual production spread is exercised rather than a hand-rolled stand-in — which matters,
  since the bug lived entirely in that seam. **15 of the 19 failed before the fix (4 passed incidentally).** Covers
  the identity invariant after each of the five triggers, dispatch after each trigger, that
  removals still genuinely remove, and the mid-iteration mutation semantics.
- **`cypress/e2e/instanceUpdateRegistry.cy.ts` (new, 4 specs).** The load-bearing proof: this
  bug is about object identity across the real async iframe boot and many real frames of
  `app.ticker`, which Vitest cannot speak to. Covers all four trigger points (scene switch,
  `world.remove()`, `world.clear()`, `hud.clear()`). **Confirmed non-vacuous by reverting the
  engine fix and re-running: all 4 failed, all 4 pass with it.** Each test asserts both
  directions — a line that must appear *and* a line that must not — so the zombie half is
  caught too, and each drives a **module**-level `onupdate` counter as a control, since module
  hooks dispatch through `_sbClasses`, a path this bug never touched. That control proves
  frames really ran, so a missing instance line is a genuine dispatch failure rather than a
  game that never started.
- The snapshot in component 3 was separately confirmed necessary: with it removed, two of the
  mid-iteration tests fail — i.e. the in-place fix would have introduced a new frame-skip bug
  without it.
- Full `npx vitest run`: **1114 passed, 1 skipped**. `npx vite build`: clean.
- Full `npx cypress run`: **32 passed across 7 specs**, every pre-existing spec unmodified
  (`tutorials`, `demos`, `save-load`, `oninit`, `objectInstanceScoping`, `selfArrayFieldAccess`).

---

## Why this survived this long

Nothing in the Vitest suite loaded the engine modules *together* — `lifecycle.test.ts` loads
`lifecycle.js` alone, so the spread that creates the second slot never existed in any test.
The Cypress suite ran real games in a real browser but asserted only "no `ERR` appears", and
this bug produces no error of any kind. The shipped tutorials that use scenes drive their
motion from the **scene's** `onupdate` (see Tutorial 13's `GameScene`) rather than from
per-object `onupdate` — the scene path dispatches via `_activeScene`, which is unaffected.
Instance-level `onupdate` on world objects is documented and supported, but the first thing
in the repo to lean on it heavily was the coins-platformer demo.
