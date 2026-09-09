# Raycaster → `softRaycaster` first-party package

**Status:** approved in principle (user: 8 files, opt-in, don't worry about the
phase demos). Detail confirmation pending.

**Goal:** the `Rc*` library stops being hand-copied into every demo dir. It
becomes an opt-in first-party package like `softCore` / `softGfx`, so one edit
in one place reaches every consumer (demos and the user's own game projects).

## Decisions

1. **8 separate module files**, not one concat.
2. **Opt-in** — `softRaycaster` is a new `firstPartyPackages` entry, **not** in
   `DEFAULT_PACKAGE_IDS`. Consumers add `'softraycaster'` to `packageIds`
   (the app already has a package picker — `PackagesSection` / `AddPackageModal`).
3. **Phase demos `raycaster-p1…p8`: leave frozen, untouched.** They keep their
   own `Rc*` `.bas` copies as ordinary files and still transpile against
   softcore+softgfx. No sync, no package. Zero effort.

## Module files & order

Move `demo-src/raycaster/lib/*.bas` → `src/lib/Basic4WebGL/defs/`:

`RcConfig.bas`, `RcWorld.bas`, `RcCast.bas`, `RcMover.bas`, `RcLights.bas`,
`RcActor.bas`, `RcActors.bas`, `RcRender.bas`.

`softRaycaster.moduleNames` (dependency order — lib files are parsed in this
order, and typed fields / `Extends` need their target declared first):

```
['RcConfig', 'RcWorld', 'RcCast', 'RcMover', 'RcLights', 'RcActor', 'RcActors', 'RcRender']
```

**Merge into canonical `RcLights.bas` first:** the 6 `staticLight*` read
accessors currently appended only in `raycaster-lightpool-poc/RcLights.bas`
(`staticLightCount/X/Y/Z/Intensity/Radius`) — generically useful, additive.
Then the POC needs no `RcLights` override.

## Source changes

| File | Change |
|---|---|
| `src/lib/Basic4WebGL/defs/Rc*.bas` | new — moved from `demo-src/raycaster/lib/` |
| `src/constants/packageModules.ts` | 8 `import … from '../lib/Basic4WebGL/defs/Rc*.bas?raw'` + entries |
| `src/constants/firstPartyPackages.ts` | new `softRaycaster` package (id `softraycaster`, `isCore:false`, `isFirstParty:true`, the 8 module names in order) |
| `src/features/projects/importProject.ts` | `packageIds: json.project.packageIds ?? ['softcore', 'softgfx']` (was hardcoded) |
| `src/features/projects/exportProject.ts` | include `packageIds` in the export (drop "excluded — importer applies a fresh default") |
| `scripts/demoBuilder/packageDemo.ts` | `project: { name, packageIds }` — new optional arg |
| `scripts/buildDemo.ts` | optional 3rd CLI arg `pkgA,pkgB,…` (default `softcore,softgfx`) → passed to `packageDemo` |
| `scripts/demoBuilder/checkCompile.ts` | read the same package list (a `packages` file in the demo dir, or default) |

## Demos rewired (delete their `Rc*` copies, add `softraycaster`)

- `raycaster-p10-finale` → `FinaleScene.bas`, `Main.bas` only
- `raycaster-p9-bench` → `BenchScene.bas`, `Main.bas`, `StressData.bas`
- `survival-slice` → its scene files only (its `Rc*` snapshot dir goes)
- `raycaster-lightpool-poc` → keeps `RcRenderPool.bas` + `PoolScene.bas` +
  `Main.bas` (its own renderer); `RcCast/RcConfig/RcMover/RcWorld/RcLights`
  copies go, `softraycaster` supplies them.

Each demo's build invocation adds `softcore,softgfx,softraycaster`. Rebuild
every affected export. `demo-src/raycaster/lib/` is deleted.

## Tests

- **Delete** `raycasterDemoLibSync.test.ts` (nothing left to sync).
- New shared helper `tests/lib/Basic4WebGL/integration/_raycasterLib.ts`:
  exports `raycasterLibModules()` → `[{name,source}]` for the 8 `Rc*` defs,
  and `withRaycaster(baseLib)` → base + raycaster.
- The ~19 other raycaster test files: build `lib` = softcore+softgfx **+
  raycaster modules**, and stop pulling `Rc*` out of the demo dir into `files`
  (the dirs no longer contain them). Most share one `readdirSync(DIR)…` +
  `packageModules` shape — a sed-assisted pass + the helper.
- `raycasterDemoTranspile` / `raycasterDemoSmoke`: the `raycaster-p\d+` phase
  dirs still carry their own `Rc*` (frozen) and must keep passing unchanged;
  the 4 rewired demos now need `softraycaster` in their test `lib`.
- `generatedDefsInSync` — `Rc*` are hand-written, not descriptor-generated;
  unaffected. But `packageModules` / `firstPartyPackages` may have a coverage
  test (a module in `packageModules` must be in some package) — check and
  satisfy.

## Docs

- `CLAUDE.md`: the "copied-in library" / `raycasterDemoLibSync` guidance goes;
  replace with "edit `src/lib/Basic4WebGL/defs/Rc*.bas`, it's the
  `softRaycaster` package". The descriptor section is unaffected.
- `src/docs/guides/raycaster-library.md`: "enable the **softRaycaster**
  package" instead of "the library ships as the unlisted demos".
- `docs/raycaster/api-reference.md`: update the "source of truth / copy-sync"
  header.
- Any in-app package listing / docs page that enumerates first-party packages.

## Risk / verification

- Lib parse order: if the parser two-passes module symbols, order is moot;
  if not, the `moduleNames` order above must be right. Verify with the
  transpile tests early.
- `RcConfig` as a `const`-only module — precedent: `keyboard`, `controller`.
  Fine.
- Case: module key `RcWorld` vs user code `new RcWorld()` — softBASIC is
  case-insensitive; precedent `ObjectTransform` / `Keyframe` / `Emitter`.
- Full `npx vitest run` + `npx vite build` green; every rewired demo export
  rebuilt and its smoke/transpile test green.
