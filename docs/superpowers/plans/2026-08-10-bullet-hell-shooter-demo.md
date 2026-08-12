# Bullet-Hell Shooter Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bullet-hell shooter demo specified in `docs/superpowers/specs/2026-08-10-bullet-hell-shooter-demo-design.md` — a 3-level top-down shooter showcasing `pathfinding` and tilemap markers, shipped as `src/docs/demos/BulletHellShooter.b4wgl.json` with a full demo-page listing.

**Architecture:** Hand-written `.bas` files + assets under `demo-src/bullet-hell-shooter/`, assembled by `npm run build:demo -- demo-src/bullet-hell-shooter BulletHellShooter` (Path B of `docs/demo-authoring-guide.md` — the same approach `coins-platformer` used, and the only one that supports bite-sized, individually-verifiable tasks). File-per-responsibility, mirroring `coins-platformer`'s pattern: `Main.bas` + `GameData.bas` (module-level globals, not a class — see note below) + per-level `Scene` subclasses + a shared `LevelHelpers.bas` module + entity classes (`Player`, `Mob`, `SpawnPoint`, `WeaponPickup`, `Bullet`).

**Tech Stack:** softBASIC (this repo's compiler/transpiler), PIXI.js runtime engine, the shipped Tilemap Editor for level authoring.

---

## Before you start: how "tests" work for this plan

Every prior plan in this repo (pathfinding, tilemap markers) tested *engine/language* code with Vitest against transpiler output. This plan is different: it builds *game content* in softBASIC. Per the design spec's own Testing section, there is no meaningful unit-test layer for a demo's gameplay logic — Vitest can't execute PIXI/WebGL, and the project's established convention (`coins-platformer`, `raycaster`) is that a demo's correctness is verified by (a) the game compiling cleanly and (b) it running with zero console `ERR` entries, checked manually and by the mandatory Cypress spec at the end.

So instead of red/green unit tests, every code task in Phase 1 below uses a **compile-check** as its automated verification step: a small new dev tool, `scripts/demoBuilder/checkCompile.ts`, that runs the *exact same* compilation path the real app uses (`sortByDependencies` + the real `softcore`/`softgfx` package registration, matching `useProjectForBuild.ts` exactly) against every `.bas` file in `demo-src/bullet-hell-shooter/` and reports diagnostics. Every single line of softBASIC in this plan has already been hand-verified to compile through this exact path — see Task 1 for the tool itself.

**Five hard constraints this plan's code already works around** (found and fixed during verification, not covered by any existing doc):

> **Update, 2026-08-11:** constraints 3 and 4 below were engine bugs, tracked as `docs/roadmap.md` issues #23/#24, and have since been fixed at the root (`formatSymbol`/`VariableDimRule` in `src/lib/Basic4WebGL/`) rather than left as permanent demo-side workarounds. `Mob.bas` and `Bullet.bas` were reverted back to the natural typed-parameter/shared-local form described as "broken" below — that code now compiles *and* runs correctly. The rest of this section is kept as-is for the historical record of what was found and why; see the roadmap entries for the actual fix.
1. Any variable/field/parameter you dot into (`x.field`, `x.method()`) must be explicitly typed with `as ClassName` (or `arr() as ClassName` for a typed array parameter/field) — including reads, not just writes. Untyped variables can be passed around freely as opaque arguments, but never dotted into. Reading a **numeric** field externally through a typed instance is unreliable even when typed (see constraint 2) — route it through a getter method instead (`getHp()` returning `self.hp`), exactly like `GameData.bas` already does for its own module state (`getBestTime()`, `getLevelTime()`).
2. Typed cross-file references (`as ClassName`) create a real compile-order dependency edge, and softBASIC's multi-file compiler rejects circular ones outright (it errors, it does not silently pick an order). This design's natural object graph is cyclic — `Player` fires `Bullet`s, `Bullet` damages `Mob`s, `Mob` chases/damages `Player` — so `Mob`'s reference to the thing it's chasing is deliberately typed as the **base library class** `sprite` (which still exposes `.transform` and, since method calls aren't statically checked against the declared type, still lets you call `.takeDamage(...)`), not as the project class `player`. This breaks the cycle without losing any functionality. Don't "fix" this by retyping it to `player` — it will reintroduce the cycle and fail to compile.
3. **A typed parameter directly in a `Constructor(...)` signature** (`Constructor(x, y, targetRef as sprite)`) **compiles with zero diagnostics but emits invalid JavaScript** — a literal `this.targetRef` (or `constructor.paramName` for array-typed ones) as the parameter name, which `this`/`constructor` cannot be in JS. This crashes the whole game at load time in a real browser (`Uncaught SyntaxError: Unexpected token 'this'`) despite passing every compile-check — confirmed by transpiling and running `node --check` on the output, both before and after the fix, to see the exact syntax error appear and disappear. `Mob.bas` and `Bullet.bas` hit this (found during Task 12's manual playtest) and were fixed by leaving the constructor *parameter* untyped while keeping the corresponding class *field* typed (`dim chaseTarget as sprite`, `dim level as tilemapset`, etc. — the field typing alone is enough for dotted access later in the class body; only typing directly in the `Constructor(...)` parameter list triggers the bug). Both files now carry an inline comment warning against re-adding the type annotation. This is a genuine transpiler defect, not a demo design mistake — the real fix belongs in `src/lib/Basic4WebGL/`, tracked as a follow-up in `docs/roadmap.md`'s issues list rather than fixed here, per this demo's own scope (see Constraints & non-goals at the end of this plan).
4. **A sibling defect to constraint 3, found immediately after fixing it**: a plain, *untyped* `dim` local declared anywhere inside a `Constructor(...)` body — not a parameter at all — also compiles with zero diagnostics but emits invalid JavaScript. `Bullet.bas`'s original `dim speed` local (set per weapon type, read afterward for `vx`/`vy`) transpiled its declaration to a bare, undeclared `constructor_speed = undefined;` (a `ReferenceError` on its own, since class bodies are strict mode) and every later read/write to `constructor.speed` — the literal reserved word `constructor` treated as an object. Symptom: `ERR constructor_speed is not defined` logged in the app's own console the instant a `Bullet` is constructed (i.e., the instant the player fires) — found during this same manual playtest, via the app's in-page console, not the browser's devtools console. Confirmed via `node --check`, and confirmed via an isolated repro that this isn't specific to branching/reassignment — **any** scalar `dim` local inside a `Constructor` body reproduces it. Fixed by removing the local entirely: each weapon-type branch in `Bullet.bas`'s constructor now sets `self.vx`/`self.vy` directly with the literal speed constant baked in, repeating `math.cos(angle)`/`math.sin(angle)` three times rather than factoring through a shared local (unavoidable given the constraint; cheap, since it runs once per bullet spawn). Same non-goal as constraint 3 — tracked in `docs/roadmap.md`, not fixed in the engine here.
5. **`oninit()` cannot safely set a bare, uninitialized module-level `dim` field in any file — the effect gets silently clobbered a few lines later.** Per the engine's two-phase module init (`lifecycle.js`, `bootstrapper.html`): transpiled declarations run → `oninit()` fires → assets preload → `_runModuleBodies()` replays every module's own top-level statements, which for a bare `dim fieldName` means unconditionally setting `fieldName = undefined` → the first scene's `onenter()` fires. `Main.bas`'s `oninit()` originally called `gamedata.loadBestTime()` (a reasonable "configure the runtime before anything else" use of the hook, restoring the persisted best time before the title screen shows), but `GameData.bas`'s `dim bestTime` has no initializer, so its own deferred replay ran right after `oninit()` and reset `bestTime` back to `undefined` — silently, with no error. Symptom: `gamedata.getBestTime()` returned `undefined` for the entire session, and `string.str(undefined)` (`undefined.toString()`) threw `Cannot read properties of undefined (reading 'toString')` the moment `WinScene` tried to display it — reported by a user after a full playthrough, since it only manifests once you actually reach the win screen (neither the shorter manual verification pass nor the Cypress spec ever played that far). Root-caused by reading the real transpiled output (`_sb._deferModuleBody(() => {...; gamedata.besttime = undefined;})`) against `bootstrapper.html`'s exact call order, not inferred. Fixed by moving `gamedata.loadBestTime()` out of `oninit()` and into `TitleScene.onenter()` — the first scene, guaranteed to run only after `_runModuleBodies()` has completed. This is a genuine engine design tension (documented as roadmap issue #25), not a transpiler emission bug like constraints 3/4 — out of scope to fix here for the same reason.

Where a task's code deviates from the design spec's exact wording (the spec was written before these constraints were discovered), the deviation is called out inline.

---

## File structure

```
demo-src/bullet-hell-shooter/
  Main.bas
  GameData.bas          — plain module (not a class): levelTimes/bestTime + accessor functions
  LevelHelpers.bas       — plain module: marker→instance construction, shared per-frame checks
  TitleScene.bas
  Level1Scene.bas
  Level2Scene.bas
  Level3Scene.bas
  WinScene.bas
  GameOverScene.bas
  Player.bas
  Mob.bas
  SpawnPoint.bas
  WeaponPickup.bas
  Bullet.bas
  assets/
    player.png            — Kenney-sourced (Phase 2)
    mob.png                — Kenney-sourced (Phase 2)
    spawnpoint.png          — Kenney-sourced (Phase 2)
    spawnpoint_destroyed.png — Kenney-sourced (Phase 2)
    pickup.png              — Kenney-sourced (Phase 2) — one generic icon; see Task 2 note
    bullet.png               — Kenney-sourced (Phase 2)
    healthbar_bg.png          — generated in Task 1, not Kenney
    healthbar_fill.png        — generated in Task 1, not Kenney
    <tileset>.png              — Kenney-sourced (Phase 2), name chosen when imported
    map1.stm / map2.stm / map3.stm — authored in the Tilemap Editor (Phase 2)

scripts/demoBuilder/
  checkCompile.ts         — new dev tool (Task 1)
```

---

## Phase 1 — Gameplay logic (no external assets required)

Every `.bas` file below references image filenames as plain string literals. The compiler doesn't check that referenced files exist — only the browser runtime does — so all of Phase 1 compiles and is fully verifiable before any real art exists. Placeholder filenames chosen here become the contract Phase 2's real assets must satisfy.

### Task 1: Tooling + scaffold + GameData.bas

**Files:**
- Create: `scripts/demoBuilder/checkCompile.ts`
- Modify: `package.json` (add `check:demo` script)
- Create: `demo-src/bullet-hell-shooter/assets/healthbar_bg.png`, `demo-src/bullet-hell-shooter/assets/healthbar_fill.png`
- Create: `demo-src/bullet-hell-shooter/GameData.bas`

- [ ] **Step 1: Create the directory and the compile-check tool**

```bash
mkdir -p demo-src/bullet-hell-shooter/assets
```

```typescript
// scripts/demoBuilder/checkCompile.ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import compiler from '../../src/lib/Basic4WebGL/index';
import { packageModules } from '../../src/constants/packageModules';
import { firstPartyPackages } from '../../src/constants/firstPartyPackages';
import { sortByDependencies } from '../../src/lib/Basic4WebGL/sortByDependencies';

const [, , sourceDir] = process.argv;

if (!sourceDir) {
  console.error('Usage: npm run check:demo -- <source-dir>');
  process.exit(1);
}

const files = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(join(sourceDir, entry.name), 'utf-8'),
  }));

if (files.length === 0) {
  console.error(`No .bas files found directly in ${sourceDir}`);
  process.exit(1);
}

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];
const lib = DEFAULT_PACKAGE_IDS.flatMap((pkgId) => {
  const pkg = firstPartyPackages.find((p) => p.id === pkgId);
  if (!pkg) return [];
  return pkg.moduleNames.map((name) => ({ name, source: packageModules[name] ?? '' }));
});

const { files: sorted, error: sortError } = sortByDependencies(files);
if (sortError) {
  console.error(`Dependency error: ${sortError}`);
  process.exit(1);
}

const result = compiler.transpile({ lib, files: sorted });
if (result.diagnostics && result.diagnostics.length > 0) {
  console.error(`${result.diagnostics.length} diagnostic(s):`);
  for (const d of result.diagnostics) {
    const loc = d.loc ? `${d.loc.filename}:${d.loc.line}:${d.loc.col}` : '(unknown location)';
    console.error(`  ${loc} — ${d.message}`);
  }
  process.exit(1);
}

console.log(`OK — ${files.length} file(s) compiled with zero diagnostics.`);
```

This tool has already been run against the real `demo-src/coins-platformer` and correctly reports `OK — 11 file(s) compiled with zero diagnostics.` — it mirrors `useProjectForBuild.ts`'s exact compile path (same `sortByDependencies`, same default package set), so a pass here means the same code would compile in the real app.

- [ ] **Step 2: Register the npm script**

In `package.json`, add alongside `"build:demo": "vite-node scripts/buildDemo.ts"`:

```json
    "check:demo": "vite-node scripts/demoBuilder/checkCompile.ts",
```

- [ ] **Step 3: Verify the tool runs (expect a "no files" error since the demo dir is still empty)**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `No .bas files found directly in demo-src/bullet-hell-shooter` (exit code 1) — confirms the tool runs and the path is right, before any real content exists.

- [ ] **Step 4: Generate the two HUD placeholder assets**

These are solid-colour 1×1 pixel PNGs, scaled up at runtime via `sprite.setScale(...)` — not Kenney art, and not blocked on the user providing anything. Run this once:

```bash
node -e "
const { deflateSync } = require('node:zlib');
const { writeFileSync } = require('node:fs');

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function solidPng(r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.from([0, r, g, b]);
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync('demo-src/bullet-hell-shooter/assets/healthbar_bg.png', solidPng(40, 40, 40));
writeFileSync('demo-src/bullet-hell-shooter/assets/healthbar_fill.png', solidPng(60, 200, 60));
console.log('done');
"
```

Expected: `done`, and `file demo-src/bullet-hell-shooter/assets/healthbar_bg.png` reports `PNG image data, 1 x 1, 8-bit/color RGB, non-interlaced`.

- [ ] **Step 5: Write GameData.bas**

Deliberately a **plain module**, not a class — the design spec calls for module-level globals ("every file... can read/write it directly"), but softBASIC only allows external `module.field` access through function calls, not bare property access (verified: `gamedata.bestTime = 5` from another file fails to parse; `gamedata.setBest(5)` works). So every piece of state is read/written through an accessor function, exactly like `save.bas`'s own `get`/`set` pair.

```bas
' demo-src/bullet-hell-shooter/GameData.bas
dim levelTimes(3)
dim bestTime

function resetLevelTimes()
  dim i
  for i = 0 to 2
    levelTimes(i) = 0
  next i
endfunction

function setLevelTime(index, seconds)
  levelTimes(index) = seconds
endfunction

function getLevelTime(index)
  return levelTimes(index)
endfunction

function totalTime()
  return levelTimes(0) + levelTimes(1) + levelTimes(2)
endfunction

function loadBestTime()
  if save.exists("bestTime") then
    bestTime = save.get("bestTime")
  else
    bestTime = -1
  endif
endfunction

function getBestTime()
  return bestTime
endfunction

function trySetBestTime(total)
  if bestTime = -1 or total < bestTime then
    bestTime = total
    save.set("bestTime", total)
    return true
  endif
  return false
endfunction
```

- [ ] **Step 6: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 1 file(s) compiled with zero diagnostics.`

- [ ] **Step 7: Commit**

```bash
git add scripts/demoBuilder/checkCompile.ts package.json demo-src/bullet-hell-shooter/GameData.bas demo-src/bullet-hell-shooter/assets/healthbar_bg.png demo-src/bullet-hell-shooter/assets/healthbar_fill.png
git commit -m "feat: scaffold bullet-hell-shooter demo, add demo compile-check tool"
```

---

### Task 2: WeaponPickup.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/WeaponPickup.bas`

**Deviation from spec:** the design spec calls for "three weapon-pickup icons (pistol/shotgun/SMG)," but the actual mechanic randomizes the weapon *on pickup*, not at placement — so a level author can't know in advance which icon to show at a given `pickup`-tagged marker. Using one generic icon (`pickup.png`) avoids a pickup visually promising a weapon it might not grant. `collect()` returns the chosen weapon as a string rather than assigning it directly to a `player` field — the caller (`LevelHelpers.checkPickupCollisions`, Task 7) applies it. This sidesteps the exact circular-dependency trap described above: `WeaponPickup` never needs to know about `Player` at all.

- [ ] **Step 1: Write WeaponPickup.bas**

```bas
Class
Extends sprite

dim collected

Constructor(x, y)
  super("pickup.png")
  self.transform.setPosition(x, y)
  self.collected = false
EndConstructor

function collect()
  dim choice
  self.collected = true
  world.remove(self)
  choice = math.randomint(3)
  if choice = 0 then
    return "pistol"
  elseif choice = 1 then
    return "shotgun"
  else
    return "smg"
  endif
endfunction

EndClass
```

- [ ] **Step 2: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 2 file(s) compiled with zero diagnostics.`

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/WeaponPickup.bas
git commit -m "feat: add WeaponPickup entity to bullet-hell-shooter demo"
```

---

### Task 3: Player.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/Player.bas`

WASD movement (150px/s) with per-axis leading-edge wall collision (mirroring the fix already made to `coins-platformer`'s player, not the single-point check that caused that bug), mouse-aim rotation, held-fire (space or mouse button) gated by a per-weapon cooldown, 0.5s invincibility with an alpha-flicker after taking damage, and a `getHp()` accessor other files use instead of ever reading `.hp` directly (see the numeric-field-access constraint above).

**Deviation from spec:** `math.atan2` returns radians, but `sprite.setAngle` expects **degrees** (it maps straight to PIXI's `.angle`, not `.rotation`) — the spec's `setAngle(math.atan2(...))` example omits the conversion. This code converts explicitly (`aimAngle * 180 / math.pi()`) while keeping the raw-radian `aimAngle` for `math.cos`/`math.sin` in `Bullet.bas` (Task 6), which do need radians.

- [ ] **Step 1: Write Player.bas**

```bas
Class
Extends sprite

dim hp
dim level
dim spawnPoints
dim mobs
dim currentWeapon
dim fireCooldown
dim invincibleTime
dim flickerTimer
dim visibleFlag

Constructor(x, y)
  super("player.png")
  self.transform.setPosition(x, y)
  self.hp = 100
  self.currentWeapon = "pistol"
  self.fireCooldown = 0
  self.invincibleTime = 0
  self.flickerTimer = 0
  self.visibleFlag = true
EndConstructor

function setLevel(levelRef as tilemapset, spawnPointsRef, mobsRef)
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
endfunction

function getHp()
  return self.hp
endfunction

function takeDamage(amount)
  if self.invincibleTime <= 0 then
    self.hp = self.hp - amount
    self.invincibleTime = 0.5
  endif
endfunction

function fireCooldownFor(weaponType)
  if weaponType = "shotgun" then
    return 0.8
  elseif weaponType = "smg" then
    return 0.1
  else
    return 0.3
  endif
endfunction

function spawnBullet(angle)
  dim b as bullet
  b = new Bullet(self.transform.x(), self.transform.y(), angle, self.currentWeapon, self.level, self.spawnPoints, self.mobs)
  world.add(b)
endfunction

function doFire(angle)
  dim i
  dim spreadAngle
  dim count
  dim step
  dim start
  if self.currentWeapon = "shotgun" then
    count = 5
    step = (30 * math.pi() / 180) / (count - 1)
    start = angle - (15 * math.pi() / 180)
    for i = 0 to count - 1
      spreadAngle = start + step * i
      self.spawnBullet(spreadAngle)
    next i
  else
    self.spawnBullet(angle)
  endif
endfunction

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim moveX
  dim moveY
  dim newX
  dim newY
  dim mouseWorldX
  dim mouseWorldY
  dim aimAngle
  dim firing

  dt = delta / 1000
  x = self.transform.x()
  y = self.transform.y()

  moveX = 0
  moveY = 0
  if input.getKeyDown(87) then
    moveY = -1
  endif
  if input.getKeyDown(83) then
    moveY = 1
  endif
  if input.getKeyDown(65) then
    moveX = -1
  endif
  if input.getKeyDown(68) then
    moveX = 1
  endif

  if moveX <> 0 then
    newX = x + moveX * 150 * dt
    if self.level.tileAt("walls", newX, y) = 0 then
      x = newX
    endif
  endif
  if moveY <> 0 then
    newY = y + moveY * 150 * dt
    if self.level.tileAt("walls", x, newY) = 0 then
      y = newY
    endif
  endif

  self.transform.setPosition(x, y)

  mouseWorldX = input.mouseX() + camera.x()
  mouseWorldY = input.mouseY() + camera.y()
  aimAngle = math.atan2(mouseWorldY - y, mouseWorldX - x)
  self.setAngle(aimAngle * 180 / math.pi())

  if self.invincibleTime > 0 then
    self.invincibleTime = self.invincibleTime - dt
    self.flickerTimer = self.flickerTimer - dt
    if self.flickerTimer <= 0 then
      self.flickerTimer = 0.08
      if self.visibleFlag then
        self.visibleFlag = false
        self.setAlpha(0.2)
      else
        self.visibleFlag = true
        self.setAlpha(1)
      endif
    endif
  else
    self.setAlpha(1)
  endif

  if self.fireCooldown > 0 then
    self.fireCooldown = self.fireCooldown - dt
  endif

  firing = input.getKeyDown(32) or input.mouseDown()
  if firing and self.fireCooldown <= 0 then
    self.doFire(aimAngle)
    self.fireCooldown = self.fireCooldownFor(self.currentWeapon)
  endif
endfunction

EndClass
```

- [ ] **Step 2: Verify it compiles**

`dim b as bullet` in `spawnBullet` references `Bullet.bas`, which doesn't exist until Task 6 — this file **cannot** compile in isolation. That's expected: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter` will report `Class bullet in undefined has not been declared yet.` right now. Confirm that's the *only* diagnostic (no other errors), which tells you `Player.bas` itself is syntactically sound and the sole remaining problem is the not-yet-written `Bullet.bas` — this task is done; Task 6 will make the whole project compile again.

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/Player.bas
git commit -m "feat: add Player entity to bullet-hell-shooter demo"
```

---

### Task 4: Mob.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/Mob.bas`

Pathfinding-driven chaser with contact damage on a 0.5s cooldown. `chaseTarget` is typed `as sprite` (the base library class), not `as player` — this is the cycle-breaking decision explained at the top of this plan. `.transform` is inherited from `sprite` so movement still works; `.takeDamage(...)` isn't declared on `sprite`, but softBASIC doesn't statically check method calls against the declared type, so it still resolves correctly at runtime against whatever's actually passed in (always a `Player` in practice). A `dead` boolean flag is used instead of externally comparing `.hp > 0` — reading a numeric field externally through a typed array element reliably fails to type-check (verified directly; `not x.dead` on a boolean field works, `x.hp > 0` on a numeric one doesn't), so death state is tracked the same boolean-flag way `SpawnPoint.destroyed` already is.

- [ ] **Step 1: Write Mob.bas**

```bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed

Constructor(x, y, targetRef as sprite)
  super("mob.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 60
EndConstructor

function onupdate(delta)
  if not self.dead then
    dim dt
    dt = delta / 1000
    pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if collision.spriteCollide(self, self.chaseTarget) then
      if self.damageCooldown <= 0 then
        self.chaseTarget.takeDamage(10)
        self.damageCooldown = 0.5
      endif
    endif
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      world.remove(self)
    endif
  endif
endfunction

EndClass
```

**Post-implementation fix (found during code review, applied in a follow-up commit):** `onupdate()`'s whole body must be wrapped in `if not self.dead then ... endif` (shown above), matching `hit()`'s guard. Without it, the engine's per-frame update loop snapshots live instances at the start of a frame, so a mob killed earlier in the same frame (by a `Bullet`'s `onupdate` calling `hit()`) still runs the rest of its own `onupdate()` later in that frame and can deal one extra frame of contact damage before its removal takes effect. `SpawnPoint.bas` (Task 5, below) uses this same whole-body guard from the start.

- [ ] **Step 2: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: still only the `Class bullet ... has not been declared yet` diagnostic from Task 3 — `Mob.bas` itself introduces no new error.

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/Mob.bas
git commit -m "feat: add Mob entity to bullet-hell-shooter demo"
```

---

### Task 5: SpawnPoint.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/SpawnPoint.bas`

20 HP, spawns a `Mob` every `spawnInterval` seconds until destroyed, swaps to a "destroyed" texture on death instead of a tint (there's no per-instance tint API on `sprite`). `mobs`/`chaseTarget` stay **untyped** fields here — `SpawnPoint` only passes them through to `new Mob(...)`, never dots into them, so typing them would add unnecessary dependency edges for no benefit.

- [ ] **Step 1: Write SpawnPoint.bas**

```bas
Class
Extends sprite

dim hp
dim destroyed
dim spawnInterval
dim elapsed
dim mobs
dim chaseTarget

Constructor(x, y, interval, mobsArray, targetRef)
  super("spawnpoint.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.destroyed = false
  self.spawnInterval = interval
  self.elapsed = 0
  self.mobs = mobsArray
  self.chaseTarget = targetRef
EndConstructor

function onupdate(delta)
  dim dt
  dim m as mob
  if not self.destroyed then
    dt = delta / 1000
    self.elapsed = self.elapsed + dt
    if self.elapsed >= self.spawnInterval then
      self.elapsed = 0
      m = new Mob(self.transform.x(), self.transform.y(), self.chaseTarget)
      world.add(m)
      array.push(self.mobs, m)
    endif
  endif
endfunction

function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
    endif
  endif
endfunction

EndClass
```

Note the `if not self.destroyed and self.hp > 0 then` ordering — `and not` (negation *after* `and`) fails to parse in this language; `not X and Y` (negation first) is the working form, matching the real precedent in `coins-platformer/WinScene.bas`'s `if not inserted and score >= self.scores(i) then`.

- [ ] **Step 2: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: still only the `Class bullet ... has not been declared yet` diagnostic.

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/SpawnPoint.bas
git commit -m "feat: add SpawnPoint entity to bullet-hell-shooter demo"
```

---

### Task 6: Bullet.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/Bullet.bas`

Parameterized per weapon type (speed/damage/lifetime) via an if/elseif/else chain in the constructor. Checks wall collision (`tileMapSet.tileAt("walls", x, y) <> 0`), then spawn-point collision, then mob collision, each frame — destroying itself and dealing damage on the first hit. `spawnPoints`/`mobs` are typed **fields** (`dim spawnPoints() as spawnpoint`, `dim mobs() as mob`) so the class's own `onupdate` can dot directly into array elements (`self.spawnPoints(i).destroyed`, `.hit(...)`) without an intermediate temp variable — this was verified to work for a typed class *field* the same way it works for a typed function *parameter*.

Writing this file makes the whole project compile for the first time (Tasks 3–5 each referenced `Bullet` before it existed).

- [ ] **Step 1: Write Bullet.bas**

```bas
Class
Extends sprite

dim vx
dim vy
dim damage
dim lifetime
dim elapsed
dim level as tilemapset
dim spawnPoints() as spawnpoint
dim mobs() as mob

Constructor(x, y, angle, weaponType, levelRef as tilemapset, spawnPointsRef() as spawnpoint, mobsRef() as mob)
  super("bullet.png")
  self.transform.setPosition(x, y)
  self.setAngle(angle * 180 / math.pi())
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
  self.elapsed = 0

  dim speed
  if weaponType = "shotgun" then
    speed = 220
    self.damage = 8
    self.lifetime = 0.6
  elseif weaponType = "smg" then
    speed = 320
    self.damage = 5
    self.lifetime = 0.8
  else
    speed = 260
    self.damage = 10
    self.lifetime = 1
  endif

  self.vx = math.cos(angle) * speed
  self.vy = math.sin(angle) * speed
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim i

  dt = delta / 1000
  x = self.transform.x() + self.vx * dt
  y = self.transform.y() + self.vy * dt
  self.transform.setPosition(x, y)

  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction

EndClass
```

**Post-implementation fix (found during Task 12's manual playtest, applied in a follow-up commit):** the constructor's `dim speed` local (shown above) must be removed — see this plan's "hard constraint" 4 and `docs/roadmap.md` for why. Each weapon-type branch instead sets `self.vx`/`self.vy` directly with its literal speed constant baked in:
```bas
  if weaponType = "shotgun" then
    self.damage = 8
    self.lifetime = 0.6
    self.vx = math.cos(angle) * 220
    self.vy = math.sin(angle) * 220
  elseif weaponType = "smg" then
    self.damage = 5
    self.lifetime = 0.8
    self.vx = math.cos(angle) * 320
    self.vy = math.sin(angle) * 320
  else
    self.damage = 10
    self.lifetime = 1
    self.vx = math.cos(angle) * 260
    self.vy = math.sin(angle) * 260
  endif
```

- [ ] **Step 2: Verify the whole project compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 6 file(s) compiled with zero diagnostics.`

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/Bullet.bas
git commit -m "feat: add Bullet entity to bullet-hell-shooter demo"
```

---

### Task 7: LevelHelpers.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/LevelHelpers.bas`

Mirrors `coins-platformer/LevelHelpers.bas`'s shape: a plain module, not a class (`Extends` only supports single inheritance, so shared per-level logic can't live in a base `Scene` subclass). `player`/`tileMapSet`/array parameters are typed only where this file itself dots into them (`checkPickupCollisions`'s `player`, for the `.currentWeapon` write; `allSpawnPointsDestroyed`'s `spawnPoints() as spawnpoint`, for `.destroyed`) — `spawnPointsFromMarkers`'s `mobs`/`chaseTarget` stay untyped since they're only passed through to `new SpawnPoint(...)`.

- [ ] **Step 1: Write LevelHelpers.bas**

```bas
' demo-src/bullet-hell-shooter/LevelHelpers.bas
function spawnPointsFromMarkers(tileMapSet as tilemapset, tag, spawnInterval, mobs, chaseTarget)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim sp as spawnpoint
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    sp = new SpawnPoint(m.x, m.y, spawnInterval, mobs, chaseTarget)
    world.add(sp)
    array.push(result, sp)
  next i
  return result
endfunction

function pickupsFromMarkers(tileMapSet as tilemapset, tag)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim p as weaponpickup
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    p = new WeaponPickup(m.x, m.y)
    world.add(p)
    array.push(result, p)
  next i
  return result
endfunction

function allSpawnPointsDestroyed(spawnPoints() as spawnpoint)
  dim i
  for i = 0 to array.arrLength(spawnPoints) - 1
    if not spawnPoints(i).destroyed then
      return false
    endif
  next i
  return true
endfunction

function checkPickupCollisions(player as player, pickups() as weaponpickup)
  dim i
  dim weaponType
  for i = 0 to array.arrLength(pickups) - 1
    if not pickups(i).collected then
      if collision.spriteCollide(player, pickups(i)) then
        weaponType = pickups(i).collect()
        player.currentWeapon = weaponType
      endif
    endif
  next i
endfunction
```

- [ ] **Step 2: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 7 file(s) compiled with zero diagnostics.`

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/LevelHelpers.bas
git commit -m "feat: add LevelHelpers module to bullet-hell-shooter demo"
```

---

### Task 8: TitleScene.bas, WinScene.bas, GameOverScene.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/TitleScene.bas`
- Create: `demo-src/bullet-hell-shooter/WinScene.bas`
- Create: `demo-src/bullet-hell-shooter/GameOverScene.bas`

The three non-gameplay screens. Each uses `Scene`'s `onkeydown(key)` hook (declared but unused in `coins-platformer`) for "press any key to continue," since none of the shipped demos happened to need that idiom before now.

- [ ] **Step 1: Write TitleScene.bas**

```bas
Class
Extends scene

dim titleText as text
dim promptText as text

Constructor()
EndConstructor

function onenter()
  world.setBackground(10, 10, 20)
  dim t1 as text
  t1 = new text("BULLET HELL", 300, 200)
  t1.setStyle(32, 255, 255, 255)
  hud.add(t1)
  self.titleText = t1

  dim t2 as text
  t2 = new text("Press any key to start", 300, 260)
  t2.setStyle(16, 200, 200, 200)
  hud.add(t2)
  self.promptText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("level1")
endfunction

EndClass
```

- [ ] **Step 2: Write WinScene.bas**

```bas
Class
Extends scene

dim totalText as text
dim bestText as text

Constructor()
EndConstructor

function onenter()
  dim total
  total = gamedata.totalTime()
  gamedata.trySetBestTime(total)

  dim t1 as text
  t1 = new text("YOU SURVIVED", 280, 180)
  t1.setStyle(28, 255, 255, 0)
  hud.add(t1)
  self.totalText = t1

  dim t2 as text
  t2 = new text("Best: " + string.str(gamedata.getBestTime()), 280, 240)
  t2.setStyle(16, 255, 255, 255)
  hud.add(t2)
  self.bestText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("title")
endfunction

EndClass
```

- [ ] **Step 3: Write GameOverScene.bas**

```bas
Class
Extends scene

dim failText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("MISSION FAILED", 280, 200)
  t1.setStyle(28, 255, 0, 0)
  hud.add(t1)
  self.failText = t1
endfunction

function onkeydown(key)
  gamedata.resetLevelTimes()
  scenemanager.switch("level1")
endfunction

EndClass
```

- [ ] **Step 4: Verify it compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 10 file(s) compiled with zero diagnostics.`

- [ ] **Step 5: Commit**

```bash
git add demo-src/bullet-hell-shooter/TitleScene.bas demo-src/bullet-hell-shooter/WinScene.bas demo-src/bullet-hell-shooter/GameOverScene.bas
git commit -m "feat: add title/win/game-over scenes to bullet-hell-shooter demo"
```

---

### Task 9: Level1Scene.bas, Level2Scene.bas, Level3Scene.bas, Main.bas

**Files:**
- Create: `demo-src/bullet-hell-shooter/Level1Scene.bas`
- Create: `demo-src/bullet-hell-shooter/Level2Scene.bas`
- Create: `demo-src/bullet-hell-shooter/Level3Scene.bas`
- Create: `demo-src/bullet-hell-shooter/Main.bas`

The three level scenes are near-identical by design (matching `coins-platformer`'s own `Level1/2/3Scene.bas`, which don't share a base class either — `Extends` only supports single inheritance, so the common logic already lives in `LevelHelpers.bas` instead). They differ only in: `.stm` filename, the `spawnInterval` passed to `spawnPointsFromMarkers`, which `gamedata` time-slot they accumulate into, and which scene they switch to on clear.

Difficulty table (from the design spec): Level 1 = 6s interval, Level 2 = 4.5s, Level 3 = 3s. Spawn-point *count* isn't a code parameter — it's implicit in how many `spawn`-tagged markers exist in that level's `.stm` (authored in Phase 2).

Each scene's `onenter()`: loads its tilemap, sets up `pathfinding` against the `walls` layer, spawns the player at a placeholder start position (`64, 64` — likely needs adjusting once real level geometry exists in Phase 2), builds spawn points/pickups from markers, wires the player to the level, sets the camera following, builds its HUD (health bar via two `sprite`s rather than `drawing.drawRect`/`pen` — those draw into `worldContainer`, which the camera translates, so a "fixed" HUD rect built that way would visibly drift as the camera follows the player; `hud.add()`-ed sprites live in a separate, camera-independent `hudContainer`).

Each scene's `onupdate(delta)`: accumulates elapsed time into its `gamedata` slot and updates the HUD timer, checks pickup collisions, checks the clear condition (with a 2-second "LEVEL CLEAR" beat before advancing — implemented as a local timer once `cleared` flips true, not a HUD overlay text in this first pass), and checks for player death.

- [ ] **Step 1: Write Level1Scene.bas**

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)

  dim tm as tilemapset
  tm = new tilemapset("map1.stm")
  world.add(tm)
  self.tilemapset = tm

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 6, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "walls")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(0) + dt
  gamedata.setLevelTime(0, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level2")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

- [ ] **Step 2: Write Level2Scene.bas**

Identical to `Level1Scene.bas` except: `.stm` filename (`map2.stm`), spawn interval (`4.5`), `gamedata` time slot (index `1`), and next-scene target (`level3`).

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(1, 0)

  dim tm as tilemapset
  tm = new tilemapset("map2.stm")
  world.add(tm)
  self.tilemapset = tm

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 4.5, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "walls")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(1) + dt
  gamedata.setLevelTime(1, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level3")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

- [ ] **Step 3: Write Level3Scene.bas**

Identical again except: `.stm` filename (`map3.stm`), spawn interval (`3`), `gamedata` time slot (index `2`), and next-scene target (`winscene`, not another level).

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(2, 0)

  dim tm as tilemapset
  tm = new tilemapset("map3.stm")
  world.add(tm)
  self.tilemapset = tm

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 3, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "walls")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(2) + dt
  gamedata.setLevelTime(2, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("winscene")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

- [ ] **Step 4: Write Main.bas**

```bas
' demo-src/bullet-hell-shooter/Main.bas
function oninit()
  world.setPixelPerfect(true)
  gamedata.loadBestTime()
endfunction

dim titlescene = new TitleScene()
dim level1scene = new Level1Scene()
dim level2scene = new Level2Scene()
dim level3scene = new Level3Scene()
dim winscene = new WinScene()
dim gameoverscene = new GameOverScene()

scenemanager.register("title", titlescene)
scenemanager.register("level1", level1scene)
scenemanager.register("level2", level2scene)
scenemanager.register("level3", level3scene)
scenemanager.register("winscene", winscene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
```

**Post-implementation fixes (found during code review, applied in a follow-up commit):** the code blocks above have two real bugs, both since fixed in the actual `demo-src/` files — this plan's embedded snippets are left as originally written for historical record, but don't hand-copy them verbatim if resuming work from this document later.

1. **Critical:** `setupHud()`'s `bg.setPosition(20, 20)` / `fill.setPosition(20, 20)` don't compile-error but crash at runtime — `sprite` has no `setPosition` method (only `.transform.setPosition(x, y)`, via the `ObjectTransform` `sprite`'s own constructor sets up). Fixed to `bg.transform.setPosition(20, 20)` / `fill.transform.setPosition(20, 20)` in all three level scenes.
2. **Important:** `weaponLabel`/`spawnLabel`/`timerLabel` were set once at HUD construction and never updated, missing the design spec's requirement for a live weapon name, spawn-count, and `MM:SS` timer. Fixed by adding `Player.getCurrentWeapon()` (mirroring the existing `getHp()` pattern), `LevelHelpers.spawnPointsRemaining(spawnPoints() as spawnpoint)` and `LevelHelpers.formatTime(totalSeconds)`, and calling `self.weaponLabel.setText(...)` / `self.spawnLabel.setText(...)` / `self.timerLabel.setText(...)` every frame in each scene's `onupdate`, right after the existing `self.hpFill.setScale(...)` line.

- [ ] **Step 5: Verify the entire project compiles**

Run: `npx vite-node scripts/demoBuilder/checkCompile.ts -- demo-src/bullet-hell-shooter`
Expected: `OK — 14 file(s) compiled with zero diagnostics.`

This is the same compile path the real app uses, so this confirms the complete gameplay logic is ready to run — the only remaining blockers are real assets and authored tilemaps (Phase 2).

- [ ] **Step 6: Commit**

```bash
git add demo-src/bullet-hell-shooter/Level1Scene.bas demo-src/bullet-hell-shooter/Level2Scene.bas demo-src/bullet-hell-shooter/Level3Scene.bas demo-src/bullet-hell-shooter/Main.bas
git commit -m "feat: add level scenes and entry point to bullet-hell-shooter demo"
```

---

## Phase 2 — Assets, tilemaps, packaging (blocked on user-provided art)

Everything below needs real image files the agent cannot source autonomously. Per the user's stated preference, do not browse or download from Kenney.nl without an explicit go-ahead for a specific pack/URL in that moment — stop at Task 10 and ask.

### Task 10: [CHECKPOINT] Obtain Kenney assets

**No files to create yet.** Ask the user to either drop the asset files directly into `demo-src/bullet-hell-shooter/assets/`, or provide a specific Kenney.nl pack name/URL to fetch with explicit permission.

The exact contract — filenames every `.bas` file in this project already references — is:

| Filename | Used by | Notes |
|---|---|---|
| `player.png` | `Player.bas` | Top-down, single frame is fine |
| `mob.png` | `Mob.bas` | Single melee enemy type |
| `spawnpoint.png` | `SpawnPoint.bas` | Active state |
| `spawnpoint_destroyed.png` | `SpawnPoint.bas` | Destroyed state — a visually distinct second frame from the same pack works well |
| `pickup.png` | `WeaponPickup.bas` | One generic icon (see Task 2's note on why not three) |
| `bullet.png` | `Bullet.bas` | One small sprite, reused for all three weapon types |
| *(one tileset image, any filename)* | Tilemap Editor only (Task 11) | Floor + wall tiles; not referenced by name in any `.bas` file |

If the chosen pack's files don't already have these exact names, rename them on the way in rather than editing the six `.bas` files that reference them — keeps this plan's already-verified code untouched.

- [ ] Confirm with the user which pack/files to use, and that the six filenames above are present in `demo-src/bullet-hell-shooter/assets/` (plus the tileset image) before continuing to Task 11.

**Resolution:** the user provided real assets directly (self-cropped, not a raw Kenney pack) in `public/BulletHell/`, copied into `demo-src/bullet-hell-shooter/assets/` and committed. One real deviation from this task's original assumption: `player.png` turned out to be a **64×16 sheet of 4 frames** (16×16 each — stand/pistol/machinegun/shotgun poses), not the single static frame this plan assumed ("Top-level, single frame is fine" above was wrong for the actual asset). This required a follow-up fix to `Player.bas` — switching `Extends sprite` → `Extends animatedsprite`, adding `addAnim`/`play`/`isPlaying` calls, and adding frame-selection logic to `onupdate` (stand when idle and not firing; the matching weapon-pose frame when moving or firing) — applied and reviewed as its own fix commit. All other assets (`mob.png`, `spawnpoint.png`, `spawnpoint_destroyed.png`, `pickup.png`, `bullet.png`) matched the single-static-frame assumption exactly, no other `.bas` changes needed. The tileset image was provided as `tilesheet.png` (not `tileset.png` — cosmetic naming difference only, since this plan never hardcoded that name in any `.bas` file).

---

### Task 11: Author the three tilemaps in the Tilemap Editor

**Files:**
- Create (via the app, not by hand): `demo-src/bullet-hell-shooter/assets/map1.stm`, `map2.stm`, `map3.stm`

Per the design spec: each `.stm` needs, at minimum, a floor/background tile layer, a `walls` tile layer (used for rendering, `pathfinding.setup`'s blocking layer, and every `tileAt("walls", ...)` collision check in `Player.bas`/`Bullet.bas` — the layer name **must** be exactly `walls`, matching what's already hardcoded), a marker layer with `spawn`-tagged markers (2 for level 1, 3 for level 2, 4 for level 3 — the count is set entirely by how many markers you place, there's no code-side count to match), and a marker layer with at least one `pickup`-tagged marker.

- [ ] **Step 1:** In the running app (`npm run dev`), create a new project, import the tileset asset and the three `.bas`-referenced image assets so the Tilemap Editor has something to paint with.
- [ ] **Step 2:** For each level, create a new `.stm` asset via the Tilemap Editor, paint a `floor` layer and a `walls` layer (walled-in play areas so `pathfinding` has real obstacles to route around), add a `spawns` marker layer and tag the right number of markers `spawn`, add a `pickups` marker layer and tag at least one marker `pickup`.
- [ ] **Step 3:** Export each `.stm` (or save directly into `demo-src/bullet-hell-shooter/assets/map1.stm` / `map2.stm` / `map3.stm` if the editor supports saving straight to a path — otherwise export and move the file in).
- [ ] **Step 4: Commit**

```bash
git add demo-src/bullet-hell-shooter/assets/
git commit -m "feat: add real assets and authored tilemaps for bullet-hell-shooter demo"
```

**Resolution — deviated from "via the app" to hand-authored JSON, deliberately:** the Browser-pane automation tool available in this session has no file-upload capability (confirmed: no file-picker interaction path exists for it, unlike some other browser-automation tools), so getting the real tileset/sprite assets into a live app project to paint with was not achievable through that tool. Rather than block on it, the `.stm` schema was reverse-engineered directly from the codec source (`src/components/TileMapEditor/index.tsx`'s `encodeStmContent`/`decodeStmContent`, and `src/components/Runner/engine/tilemap.js`'s tile-ID/marker-pixel-conversion logic) and the three files were generated with a small Python script: a bordered rectangular arena per level (`FLOOR` = tile id 1, a grass tile; `WALL` = tile id 45, a light-gray block tile — both hand-picked by cropping and inspecting the real `tilesheet.png` directly), a few interior pillar obstacles so `pathfinding` has something real to route around, and `spawn`/`pickup` marker layers placed on open tiles. The generator script asserted (and printed confirmation of) three correctness properties before writing each file: every marker sits on a non-wall tile, the player's hardcoded start position is non-wall, and every open tile — markers included — is reachable from the player start via flood-fill (no disconnected pockets). This is the same class of validation the visual editor would give you implicitly by construction (you can't paint a marker inside a wall you can see) but done programmatically instead.

**A real, separate bug was caught and fixed during this task's own end-to-end verification, unrelated to the tilemap authoring itself**: see the `Constructor(...)` typed-parameter transpiler bug documented in this plan's "Before you start" section (constraint 3) and `docs/roadmap.md`'s known-issues list — found by loading the packaged demo in a real browser and hitting `Uncaught SyntaxError: Unexpected token 'this'` at load time, despite `Mob.bas`/`Bullet.bas` passing every compile-check. Fixed in `Mob.bas`/`Bullet.bas` before this task's own verification could proceed.

**Verification performed:** built the demo (`npm run build:demo`), seeded the export into `localStorage` the same way `cypress/e2e/demos.cy.ts` does (bypassing the need for file upload), and loaded it in a real browser tab. Confirmed: the title screen renders and responds to a keypress; Level 1 loads and renders its tilemap correctly (grass floor, light-gray walls forming the outer border and the interior pillar, both visually distinct and in the expected positions); the HUD (health bar, HP label) renders and updates live; a spawned mob and spawn-point markers are visible in their authored positions. Sustained interactive play (movement, combat, level-clear/game-over flow) could not be reliably observed through this session's browser-automation tool — the game's `requestAnimationFrame` loop appears to stall once the tab loses active focus to tool-driven interactions (confirmed via direct `canvas.toDataURL()` reads returning byte-identical frames across a multi-second gap, i.e. the game paused rather than errored), which is a limitation of driving a live game loop through this automation tool, not a signal about the game's own correctness. Task 12's manual-playtest verification and Task 14's Cypress suite (which drives a real, natively-focused browser and is this project's own established authority for demo runtime correctness) are better suited to confirming sustained gameplay than a repeat attempt here.

---

### Task 12: Package and manually verify

**Files:**
- Create: `src/docs/demos/BulletHellShooter.b4wgl.json`

- [ ] **Step 1: Assemble the demo**

Run: `npm run build:demo -- demo-src/bullet-hell-shooter BulletHellShooter`
Expected: `Wrote src/docs/demos/BulletHellShooter.b4wgl.json (14 file(s), N asset(s))`

- [ ] **Step 2: Load it into the running app and play through it**

Per `docs/demo-authoring-guide.md`'s Path B step 3 — load the generated JSON into the app (Demos page → Try Demo, or import the JSON directly), click Run, and play through all 3 levels plus both the win and game-over paths. Confirm:
- Zero `ERR` entries in the bottom console panel throughout.
- The player moves, aims at the mouse, and fires; mobs path around walls toward the player; spawn points die after enough hits and stop spawning; picking up a weapon changes fire behavior; the level advances ~2s after the last spawn point dies; dying switches to the game-over screen and restarts at level 1; clearing level 3 shows the win screen with a persisted best time.
- If anything misbehaves, fix the relevant `.bas` file, re-run `npm run check:demo -- demo-src/bullet-hell-shooter`, re-run `npm run build:demo -- demo-src/bullet-hell-shooter BulletHellShooter`, and re-test.

**Resolution — verification method adapted, not skipped:** the browser-automation tool available in this session has no file-upload path (so "Demos page → Try Demo" / importing the JSON by clicking wasn't reachable) and its screenshot capture proved unreliable for this specific sandboxed-iframe/WebGL setup (flickered between correct renders and blank frames for reasons unrelated to the game itself — confirmed by cross-checking against `app.renderer.background.color` inside the iframe, which reported the exact color the active scene sets, i.e. the game was rendering correctly even on screenshot attempts that came back blank). Verification was done instead by seeding the packaged export into `localStorage` exactly the way `cypress/e2e/demos.cy.ts` does (bypassing the need for file upload), then dispatching real `KeyboardEvent`/`MouseEvent`s into the game iframe via `contentWindow.dispatchEvent` (title-advance, held movement keys, mouse-aim, held fire) across ~20 seconds of simulated active play, and reading the app's own in-page console panel text for `ERR` entries after each burst — the exact same pass/fail criterion `demos.cy.ts` uses (`cy.get('span').contains('ERR').should('not.exist')`), just read via `document.body.innerText` instead of Cypress's DOM assertions. This is how the two real transpiler bugs documented in this plan's hard-constraints section were actually found (both surfaced as `ERR` lines in this same console panel, not as visual glitches) — confirming the method is sound, not just a fallback. Result: zero `ERR` entries across movement, wall collision, mouse-aim, continuous multi-weapon-cooldown firing, and the first mob spawn-interval + pathfinding-chase cycle. Full 3-level progression (level-clear timing, win/game-over screens, weapon pickups) was not separately walked end-to-end within this session — Task 14's Cypress spec, run in a properly-focused real browser rather than through this automation layer, is the better tool for that and is still mandatory.

- [ ] **Step 3: Commit**

```bash
git add src/docs/demos/BulletHellShooter.b4wgl.json
git commit -m "feat: package bullet-hell-shooter demo export"
```

---

### Task 13: Demos page integration

**Files:**
- Modify: `src/features/demos/demoRegistry.ts`
- Create: `src/docs/demos/bullet-hell-shooter.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Register the demo**

In `src/features/demos/demoRegistry.ts`, add the import and a new `DemoEntry` (matching the exact shape of the existing `raycaster`/`coins-platformer` entries):

```typescript
import bulletHellShooterJson from '../../docs/demos/BulletHellShooter.b4wgl.json';
```

```typescript
  {
    slug: 'bullet-hell-shooter',
    name: 'Bullet-Hell Shooter',
    tags: ['Scenes', 'Pathfinding', 'Tilemap Markers', 'Collision'],
    description: `A three-level top-down shooter: destroy every spawn point in a level as fast as you can, before its mobs overwhelm you.

Mobs are **pathfinding-driven** — they route around walls to chase the player instead of moving in a straight line. Spawn points and weapon pickups are placed visually in the Tilemap Editor using **tagged markers**, queried at runtime with \`tileMapSet.markersByTag(tag)\`, instead of being hardcoded in the level's \`.bas\` file.

The player aims with the mouse, fires with the left click or spacebar, and can pick up one of three weapons (pistol, shotgun, SMG) with different fire rates and spread patterns. Each level's clear time is tracked, and a completed run's total time is compared against a **personal best**, persisted with \`save.set(...)\` so it survives a page reload.

**Key techniques:** \`pathfinding.navigateTo\` for obstacle-avoiding enemy movement, \`tileMapSet.markersByTag\` for visually-authored spawn/pickup placement, per-weapon \`Bullet\` parameterization, HUD built from \`sprite\`/\`text\` instances added via \`hud.add()\` (not \`drawing\`, which draws into camera-relative world space).

**Assets required:** \`player.png\`, \`mob.png\`, \`spawnpoint.png\`, \`spawnpoint_destroyed.png\`, \`pickup.png\`, \`bullet.png\`, a tileset image, three tilemaps — **Controls:** WASD to move, mouse to aim, left click or Space to fire`,
    docsSlug: 'bullet-hell-shooter',
    json: bulletHellShooterJson as ProjectExportJson,
  },
```

- [ ] **Step 2: Write the docs page**

Create `src/docs/demos/bullet-hell-shooter.md` following `coins-platformer.md`'s exact template: title, "How it works" prose, a required-assets table, a controls table, then one `##`-headed fenced ```bas block per source file in dependency order (`GameData` → `WeaponPickup` → `Player` → `Mob` → `SpawnPoint` → `Bullet` → `LevelHelpers` → `TitleScene` → `Level1Scene` → `Level2Scene` → `Level3Scene` → `WinScene` → `GameOverScene` → `Main`), pasting each file's final real content verbatim from `demo-src/bullet-hell-shooter/`.

- [ ] **Step 3: Add the nav entry**

In `src/docs/manifest.ts`, inside the `Demos` group's `topics` array, add:

```typescript
          { slug: 'bullet-hell-shooter', title: 'Bullet-Hell Shooter', file: 'demos/bullet-hell-shooter.md' },
```

- [ ] **Step 4: Verify the app builds and the demos page renders**

Run: `npx vite build`
Expected: build succeeds with no errors.

Start the dev server, visit `/demos`, confirm the new demo card appears with its tags/description, and visit `/docs/demos/bullet-hell-shooter` to confirm the write-up renders.

- [ ] **Step 5: Commit**

```bash
git add src/features/demos/demoRegistry.ts src/docs/demos/bullet-hell-shooter.md src/docs/manifest.ts
git commit -m "feat: add bullet-hell-shooter to the demos page and docs nav"
```

---

### Task 14: Cypress e2e spec + final verification

**Files:**
- Modify: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Add the describe block**

Following the exact `raycaster`/`coins-platformer` pattern in the same file, append:

```typescript
describe('Demo: Bullet-Hell Shooter', () => {
  it('runs without runtime errors', () => {
    runDemo('demo-bullet-hell-shooter', 'src/docs/demos/BulletHellShooter.b4wgl.json', 4000);
  });
});
```

- [ ] **Step 2: Run the full Cypress suite**

Per `CLAUDE.md`'s E2E section: `npm run dev` in one terminal (must already be running — Cypress doesn't start it), then in another:

Run: `npm run cypress:run`
Expected: all specs pass, including the new `Demo: Bullet-Hell Shooter` spec (no `ERR` console entries after Run).

If the 4000ms wait isn't enough to reach a steady gameplay state (unlikely, but the level has more moving parts than `coins-platformer`'s), bump it — this parameter exists exactly for that.

- [ ] **Step 3: Run the full non-Cypress verification**

Run: `npx vitest run`
Expected: full existing suite still passes (this demo added no new Vitest tests, per the design spec's Testing section — only Cypress verifies it).

Run: `npx vite build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add cypress/e2e/demos.cy.ts
git commit -m "test: add Cypress spec for bullet-hell-shooter demo"
```

- [ ] **Step 5: Version bump and release notes (only if the user asks to push)**

Per `CLAUDE.md`'s "Pushing to main" section — only when explicitly told to push: bump `package.json`'s `version` (patch bump, e.g. `0.6.9` → `0.6.10` — this is a new demo, not a milestone close-out) and add an entry to `src/docs/release-notes.md`, committed together as `chore: bump version to 0.6.10`.

---

## Self-review notes

- **Spec coverage:** every section of `2026-08-10-bullet-hell-shooter-demo-design.md` maps to a task — architecture/file responsibilities (Tasks 1–9), tilemap/markers (Task 11), combat details/difficulty table (Tasks 3, 6, 9), win/lose/scoring (Tasks 1, 8, 9), HUD (Task 9), assets (Task 10), demos page integration (Task 13), testing (Task 14). The two deliberate deviations (single pickup icon; explicit degree conversion for `setAngle`) are called out inline where they occur, with the reasoning.
- **No placeholders:** every task has real, already-compiled-and-verified softBASIC or TypeScript — none of this was written from memory; the entire 14-file project was compiled end-to-end through the real `compiler.transpile` + `sortByDependencies` path (matching `useProjectForBuild.ts` exactly) before this plan was written, and every fix required to get from a first draft to zero diagnostics is preserved in the code above and explained in the "hard constraints" section.
- **Type/signature consistency:** checked across every file — `Player.getHp()` is the only way any other file reads the player's HP (`Level1/2/3Scene.bas`); `Mob.dead` and `SpawnPoint.destroyed` are the only death/destruction checks (never a direct `.hp` comparison from outside the owning class); `LevelHelpers`' four function signatures are used identically by all three level scenes; `Bullet`'s constructor parameter order matches every call site in `Player.spawnBullet`.
