# `oninit` Lifecycle Hook Design

> Date: 2026-08-04

## Goal

Give softBASIC a way to run user code **before game assets are preloaded**.

Every lifecycle hook that exists today (`onenter`, `onupdate`, `onexit`,
`onkeydown`, `onkeyup`) fires after asset preload has completed. There is no
"init" phase at all — the earliest a single line of user code can run is
after every image and sound in the project has already been decoded into a
texture. That makes it impossible to configure anything that must be set
*before* textures exist.

The trigger was a concrete need (nearest-neighbour texture filtering for a
pixel-art platformer demo — PIXI applies the scale mode at texture-creation
time, so setting it after preload is too late), but the gap is general: any
global renderer/runtime option that has to be in place before assets load is
currently unreachable from softBASIC.

This spec adds `oninit` — a module-level hook that fires on every module
before asset preloading begins.

## Verified diagnosis

Confirmed by dumping real transpiler output (`compiler.transpile` on a
representative multi-file project: three library modules, a base class, a
subclass, and a `Main.bas` with top-level statements).

**Where hooks fire today** — `src/components/Runner/bootstrapper.html`:

```
app.init(...) → _sb._initMouse() → _sb._initStage()
  → //${inlineAssets}; await preloadFromLocalStorage(); await preloadAudioFromLocalStorage()
  → //${transpiled};      ← defines every module/class AND runs all top-level statements
  → _sb._applySwitch()    ← fires the active scene's onenter (scene.js)
  → keydown/keyup listeners registered
  → app.ticker.add(...)
  → _sb._sbClasses.forEach(c => c.symbol.onenter?.())
```

**Why this is not a bootstrapper reorder.** `_sb._sbClasses` — the list the
`onenter`/`onkeydown`/`onkeyup` loops iterate — is emitted as the *last*
statement of `//${transpiled}` by
`src/lib/Basic4WebGL/transpilerRules/terminationRules.ts`, built from
`table.getAll('Module')`. It cannot exist before `//${transpiled}` has run.

**Why `//${transpiled}` cannot simply move earlier.** `formatRoot`
(`transpilerRules/jsRules/helpers/transpilerHelpers.ts`) emits a module's
function *declarations* and its own top-level *executable statements* into
one undifferentiated statement list. Real output for a `Main.bas`:

```js
const main = {};
    main.score = 0;;;main.m = new _sb_menuscene();;;scenemanager.register("menu",main.m);;
    scenemanager.switch("menu");;;main.oninit = () => { ... };;;main.onupdate = (onupdate_delta) => { ... };
```

`main.score = 0` and `scenemanager.register(...)` are executable and may
touch assets (`dim hero = new sprite("hero.png")` is the obvious case);
`main.onupdate = ...` is an inert property assignment. Nothing in the
compiler distinguishes them.

Class roots have the same shape — the class declaration itself is inert, but
class-scope `dim` emits executable prototype assignments:

```js
class _sb_player{ constructor() {this.health = 50;} }
    _sb_player.prototype.health = 100;;_sb_player.prototype.name = undefined;;
    _sb_player.prototype.hit = function(hit_amount) { ... };
```

`_sbClasses` also confirmed to contain **modules only** — the probe emitted
`[math, scenemanager, stage, main]` and no classes. So the existing `onenter`
loop is already a module-level-only dispatch; classes receive `onenter` only
through `SceneManager` (`engine/scene.js`), never through this loop.

## Design: two-phase module initialisation

Split every transpiled root into two phases, distinguished by whether a
statement is **inert** (a declaration) or **executable**.

**Phase 1 — declarations.** Emitted inline exactly where the transpiled block
sits today, and provably side-effect-free:
- `let _globalVar = null;` (already emitted separately by `symbolRules`)
- `const <module> = {};`
- `class _sb_<name> [extends _sb_<parent>] { <constructor> }`
- `<module>.<fn> = (...) => {...}` / `_sb_<name>.prototype.<m> = function(){}`
- `_sb._sbClasses = [...]` (termination rule)

**Phase 2 — module bodies.** Every other root child is collected per-root and
wrapped in a deferred callback registered with the engine:

```js
_sb._deferModuleBody(() => { <that root's top-level statements> });
```

Roots are transpiled in file order, so the callbacks are registered in file
order and replayed in file order by `_sb._runModuleBodies()`.

Consequently the whole `//${transpiled}` block moves **before** asset
preload, because after the split it only *declares* things.

### New bootstrapper sequence

```
app.init(...) → _sb._initMouse() → _sb._initStage()
  → //${transpiled};        ← phase 1 + deferred registrations + _sbClasses
  → _sb._fireInit()         ← NEW: oninit on every module
  → //${inlineAssets}; await preloadFromLocalStorage(); await preloadAudioFromLocalStorage()
  → _sb._runModuleBodies()  ← phase 2, in file order
  → _sb._applySwitch()
  → keydown/keyup listeners, ticker start
  → onenter loop            ← unchanged
```

### Why this is zero-behaviour-change for projects without `oninit`

The constraint is that all 12 tutorials, the Raycaster demo and the save/load
e2e spec keep passing untouched. The argument:

1. **Phase 1 is inert.** Object literal creation, class declaration, and
   function-property assignment have no observable effect beyond binding
   names. Running them earlier is unobservable. (`class B extends A` does
   evaluate `A`, but declaration order within phase 1 is preserved, and
   `sortByDependencies` already guarantees a class file precedes its users.)
2. **Statement order among statements is unchanged.** Today: `[A decls][A
   stmts][B decls][B stmts]`. After: `[A decls][B decls][A stmts][B stmts]`.
   The subsequence of executable statements is byte-for-byte identical in
   order.
3. **The only cross-order change is decl-before-stmt, which is strictly more
   permissive.** A statement in file A referencing a function declared in
   file B previously hit a TDZ/undefined error; now it resolves. Nothing that
   worked stops working.
4. **`_sbClasses` moves earlier** but no user code can read or write it, and
   every consumer (key listeners, ticker, `onenter` loop) still runs after
   phase 2.
5. **Failure mode is unchanged.** A throwing top-level statement previously
   aborted `//${transpiled}`, leaving `_sbClasses` unset and the game dead
   with a console error. Now it throws inside `_runModuleBodies()`, still
   inside the same outer `try`, still surfacing via `_throwError`.

Point 2 is the load-bearing one and is what the Cypress suite exists to
falsify empirically.

## Resolved open questions

### 1. Does `oninit` fire on every module, or is it scoped differently?

**Every module, unconditionally, mirroring the existing `onenter` loop.**

`_sbClasses` is a module list, and the `onenter` loop already walks all of it
firing on whichever modules define the hook. `oninit` uses the identical
dispatch, so it reads as a sibling rather than a special case. Library
modules are in that list too (`math`, `stage`, …); none define `oninit`, and
the `if (c.symbol.oninit)` guard makes that free.

Rejected: scoping to `Main.bas` only. It would be a novel, unexplained
restriction — no other hook works that way — and would break the natural
pattern of a self-contained module configuring itself.

### 2. Do class instances need `oninit`?

**No — `oninit` is module-level (file-level) only.**

Reasoning from `onenter` as the baseline: `_sbInstances` is populated by
`stage.add`/`world.add`/`hud.add` (`engine/stage.js`), i.e. only once an
instance exists and has been added to the display list. At the moment
`oninit` fires, *no user statement has executed at all* — phase 2 hasn't run,
so no `new` has been evaluated and `_sbInstances` is necessarily empty. There
is no set of instances to dispatch to. This is not a limitation to work
around; it is what "before anything has happened" means.

Corollary: `oninit` is deliberately **not** added to `Scene.bas` as an
overridable stub. Scene classes are instantiated in phase 2, so a scene-level
`oninit` could never fire, and shipping a stub would advertise a hook that
silently does nothing.

### 3. Guard against asset use inside `oninit`, or document it as a pitfall?

**A narrow runtime guard at the single asset choke point, plus docs.**

`engine/assets.js` already tracks a `_ready` flag and funnels every texture
lookup through `get(name)`. Today `_ready` is *always* `true` by the time any
user code runs, so `get()` can never currently be reached with `_ready ===
false` — which makes adding a distinct message on that branch provably
zero-regression, and makes it precisely diagnostic once `oninit` exists.

`get()` gains, ahead of its existing not-found error:

```
Assets are not loaded yet — "<name>" cannot be used inside oninit().
Assets finish loading after oninit() runs; create sprites in onenter() instead.
```

This covers `sprite`, `animatedsprite`, `tilemap` and `drawing.drawImageStrip`
in one place, since all of them resolve textures through the asset cache.

Rejected: a **compile-time** ban on asset-touching calls inside `oninit`. The
compiler has no concept of which library functions touch assets, and any
call-graph analysis would be defeated by one level of indirection while
adding a whole new class of false positives. Rejected: no guard at all —
`Asset "hero.png" not found. Make sure the filename is correct` actively
misleads here, since the filename *is* correct.

Not guarded (documented only): module-level `dim` variables are phase-2
statements, so they are still `undefined` during `oninit`. Guarding this
would require distinguishing "declared but not yet initialised" from
"legitimately unset" at runtime for every module property — disproportionate.
Documented as the one real pitfall.

## Scope

**In:** the `oninit` hook (transpiler phase split, engine dispatch,
bootstrapper reorder), the asset-readiness error message, editor keyword
registration, Language Guide docs, unit tests, Cypress e2e ordering proof.

**Out:** the nearest-neighbour / pixel-art texture-filtering API that
motivated this. `oninit` is the missing *mechanism*; the rendering option is a
separate library addition and is being handled alongside the demo it belongs
to. Tracked as a follow-up in `docs/language/library-roadmap.md`.

## Files

| File | Change |
|---|---|
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts` | partition children into declarations vs. statements |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts` | `formatRoot` emits phase-1 inline + phase-2 wrapped in `_sb._deferModuleBody` |
| `src/components/Runner/engine/lifecycle.js` | `_deferModuleBody`, `_runModuleBodies`, `_fireInit` |
| `src/components/Runner/engine/assets.js` | not-ready message in `get()` |
| `src/components/Runner/bootstrapper.html` | new boot sequence |
| `src/lib/Basic4WebGL/keywords.ts` | `oninit` in `SOFTBASIC_LIFECYCLE_EVENTS` |
| `src/docs/language-guide/lifecycle.md` | document `oninit` |
| `cypress/e2e/oninit.cy.ts` | firing-order proof + no-regression |
| `docs/roadmap.md`, `docs/language/library-roadmap.md` | record the capability |

No `.bas` def file: like `onenter`, `oninit` is a language construct the
engine calls by name, not a library function.
