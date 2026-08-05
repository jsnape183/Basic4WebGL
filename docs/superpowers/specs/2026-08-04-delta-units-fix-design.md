# `onupdate(delta)` units fix — design

**Status:** implemented, 2026-08-04
**Type:** runtime engine defect (no compiler or API-surface change)

## Problem

Every softBASIC game ran roughly **16.67x slower** than its own documented contract.

`bootstrapper.html` wired the per-frame loop as:

```js
app.ticker.add((ticker) => _sb._update(ticker.deltaTime));
```

PIXI's `Ticker` exposes two different numbers:

| property | meaning | value at 60fps |
|---|---|---|
| `deltaTime` | frame-count **normalised** — 1.0 == "one 60fps frame" | ~1.0 |
| `deltaMS` | the same quantity in **milliseconds** | ~16.67 |

The loop used `deltaTime`. That number flowed unmodified through
`_sb._update(delta)` (`engine/lifecycle.js`) into every module-level and every
instance `onupdate(delta)`, and into `_cameraUpdate(delta)` via `engine/scene.js`.

The documented contract is milliseconds, in three independent places:

- `src/docs/language-guide/lifecycle.md` — "`delta` is the elapsed time in
  milliseconds since the last frame".
- `src/docs/api-reference/scene.md` — "Time since last frame in milliseconds".
- Every tutorial doing frame-rate-independent movement writes
  `speed * delta / 1000`, i.e. treats `delta` as milliseconds
  (`04-motion.md`, `05-keyboard.md`, `14-camera.md`, …).

So `dt = delta / 1000` computed ~0.001 instead of ~0.01667.

Tutorial 7 makes the discrepancy concrete: it accumulates `timer = timer + delta`
and claims the score "ticks up by one every second" at `timer >= 1000`. In
reality it ticked once every ~16.7 seconds.

## Root cause confirmation

Reproduced independently by live instrumentation in the running app, not taken
on trust:

1. **At the contract boundary.** Wrapping the real `_sb._update` over 859 real
   frames: wall clock 14318.3 ms, sum of the deltas handed to `onupdate` 858.99.
   Ratio **16.67**.
2. **PIXI's own semantics**, on a fresh `PIXI.Ticker` unrelated to the app's
   wiring: `deltaTime` 1.002 while `deltaMS` 16.7 on the same frame. Across
   every sampled frame `deltaMS / deltaTime` was **exactly** `1000/60`
   (16.666667), with zero variance.
3. **User-visible symptom.** A module accumulating `timer + delta` over 120
   frames (≈2000 ms of real time) printed `119.9`.

Point 2 is what makes `deltaMS` the provably correct replacement rather than
merely a closer one: it is `deltaTime` scaled by a constant, so it carries the
*identical* `ticker.speed` scaling and `minFPS` clamping. Swapping them is a
pure unit conversion with no behavioural side effects. `elapsedMS` was rejected
for exactly that reason — it is the raw unclamped measurement and would drop
both the speed scaling and the large-gap clamp (e.g. a backgrounded tab).

## Fix

Two sites, both a unit conversion.

**1. `src/components/Runner/bootstrapper.html`** — the source of the value:

```js
app.ticker.add((ticker) => _sb._update(ticker.deltaMS));
```

**2. `src/components/Runner/engine/camera.js`** — a consumer that had been
written *against* the wrong units, and so had to change in step:

```js
this._shakeElapsed += (delta || 0) / 1000;   // was: / 60
```

`camera.shake(intensity, duration)` documents `duration` in **seconds**.
`delta / 60` produced seconds only while `delta` was ~1.0 per frame. Left
unchanged, the fix would have made every camera shake finish ~16.67x too early
— a 0.5s shake completing in 2 frames. Nothing in the existing suite covered
shake duration, so this would have shipped silently.

## Blast radius — what was checked

A full sweep of `src/components/Runner/` for delta consumers found exactly four:

| site | verdict |
|---|---|
| `bootstrapper.html` | **fixed** — the source |
| `engine/lifecycle.js` | passes `delta` straight to user code, no unit assumption |
| `engine/scene.js` | passes `delta` straight through, no unit assumption |
| `engine/camera.js` | **fixed** — `_shakeElapsed` assumed frame-normalised units |

Two near-misses that were checked and are genuinely unaffected:

- **`engine/animatedSprite.js`** — `handle.animationSpeed = def.fps / 60` looks
  like the same mistake but is not. PIXI's `AnimatedSprite` defaults to
  `autoUpdate = true` and drives itself from `PIXI.Ticker.shared`, which is a
  *different ticker object* from `app.ticker` (verified in the browser:
  `app.ticker === PIXI.Ticker.shared` is `false`). Its `animationSpeed` is
  measured against that ticker's own frame-normalised `deltaTime`, so it is
  independent of this change. The engine never calls `handle.update(delta)`.
- **`camera.follow(target, speed)`** — documented as a per-frame "lerp factor
  0–1" and never reads `delta` at all. Unchanged.

## Tests

**`cypress/e2e/deltaUnits.cy.ts`** (4 specs) is the load-bearing proof — only a
real browser can drive a real `PIXI.Ticker`:

1. module `onupdate` receives ms-scale deltas;
2. instance `onupdate` does too (a separate dispatch path, via `_sbInstances`);
3. accumulated delta matches real elapsed wall-clock time, measured by wrapping
   `_sb._update` in the runner iframe and comparing against `performance.now()`
   over the same window — this pins the *units* and cannot be satisfied by any
   fixed constant;
4. the documented tutorial-7 once-per-second accumulator actually fires ~once
   per second.

Non-vacuity measures: every spec prints a frame-count checkpoint driven by a
counter independent of delta's *value*, so a game that never booted fails there
rather than passing silently; every delta assertion is two-sided, so an
accidental over-scaling is rejected too.

**`tests/components/Runner/camera.test.ts`** (3 tests) covers shake duration in
seconds against a millisecond delta, including fade-out behaviour.

**`tests/components/Runner/bootstrapper.test.ts`** (+3 tests) is a cheap static
guard asserting the wiring reads `deltaMS` and not `deltaTime`. It extracts the
`app.ticker.add` line with comments stripped, because the surrounding comment
deliberately names `deltaTime` to explain why it is wrong.

## Verification

- Vitest **1120 passed**, 1 skipped (baseline before this work: 1114).
- `npx vite build` clean.
- Full Cypress suite **36/36** across all 8 specs.
- Revert-and-confirm-red, in the same environment: with the fix stashed, all 4
  `deltaUnits` specs fail with messages naming the actual bug (`delta averaged
  1.017 per frame`, `ratio 0.0603`, `accumulator fired 0 times`) while their
  control assertions still pass. Both static guards go red too. The camera tests
  go red showing the shake completing in 2 frames.
- Pre-fix baseline of the whole suite: 32/32 existing specs passed *with the bug
  present*, confirming no existing spec was calibrated around the slow speed and
  none needed adjusting.

## Why it survived undetected

Confirmed by reading the specs rather than assumed: `cypress/e2e/tutorials.cy.ts`
and `cypress/e2e/demos.cy.ts` contain exactly one assertion each —
`cy.get('span').contains('ERR').should('not.exist')`. They never inspect motion,
position, or printed values, and this bug emits no error.

Nothing else could have caught it either. Vitest cannot instantiate a
`PIXI.Ticker`, so no unit test ever saw a real frame delta. And the symptom is
uniquely un-alarming: a moving sprite that travels slowly looks like a sprite
with a low `speed` constant, not like a broken engine. An author's natural fix
is to raise `speed` until it looks right, which silently bakes the 16.67x error
into their game and removes the evidence.

The bug was introduced by the fix for "Bug 1 — `onupdate()` never fires"
(`docs/language/library-roadmap.md`), which correctly connected `_update` to the
ticker and picked the wrong one of its two delta properties. Because `onupdate`
went from *never firing* to *firing*, the change read as a clear success and the
units were never questioned.

The Cypress specs plus the static guard now cover both the units and the camera
consumer.
