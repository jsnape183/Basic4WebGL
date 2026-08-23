# Sprite Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `attachTo(parent)` / `detach()` instance methods to `sprite` and `animatedsprite`, letting one sprite automatically follow another's position and rotation by reparenting its PIXI display object — replacing Dungeon Explorer's hand-built circular-keyframe sword-swing workaround.

**Architecture:** A new stateless-per-frame engine module (`attach.js`) holds a `Map` from a sprite's PIXI handle to the container it lived in before its first `attachTo()` call. `attachTo`/`detach` just call `PIXI.Container.addChild` to move the handle between containers — PIXI's own transform stack then makes position/angle relative to whichever container currently holds the handle, with zero per-frame engine work required. The two new methods are added to `sprite` via its descriptor (regenerated `.bas`) and hand-duplicated onto `animatedsprite.bas`, following this codebase's existing convention for methods shared between the two non-inheriting classes.

**Tech Stack:** TypeScript (compiler/descriptor generator), plain JS engine scripts (PIXI.js), Vitest, softBASIC (`.bas`) demo source, Cypress (manual verification only).

**Spec:** `docs/superpowers/specs/2026-08-23-sprite-attachment-design.md`

---

### Task 1: `attach.js` engine module

**Files:**
- Create: `src/components/Runner/engine/attach.js`
- Test: `tests/components/Runner/attach.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/attach.js is a plain script (not an ES module) — same loading
// technique tests/components/Runner/tween.test.ts uses for engine/tween.js,
// since it declares a bare `const _sbAttach` that the runner concatenates
// into the sandboxed iframe rather than importing.
function loadAttach() {
  const src = readFileSync('src/components/Runner/engine/attach.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbAttach;`);
  return factory();
}

function makeContainer(name: string) {
  return {
    name,
    children: [] as unknown[],
    parent: null as unknown,
    addChild(child: { parent: unknown }) {
      if (child.parent && (child.parent as { children: unknown[] }).children) {
        const siblings = (child.parent as { children: unknown[] }).children;
        const i = siblings.indexOf(child);
        if (i !== -1) siblings.splice(i, 1);
      }
      this.children.push(child);
      child.parent = this;
    },
  };
}

function makeHandle(initialParent: ReturnType<typeof makeContainer>) {
  const handle = { parent: initialParent as unknown };
  initialParent.addChild(handle as unknown as { parent: unknown });
  return handle;
}

describe('attachSprite / detachSprite', () => {
  test('attachSprite reparents the child under the parent handle', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentHandle = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentHandle });

    expect(childHandle.parent).toBe(parentHandle);
    expect(world.children).not.toContain(childHandle);
  });

  test('detachSprite restores the container the child lived in before its first attachTo', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentHandle = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentHandle });
    attach.detachSprite(childHandle);

    expect(childHandle.parent).toBe(world);
    expect(world.children).toContain(childHandle);
  });

  test('re-attaching to a different parent preserves the ORIGINAL container for eventual detach', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);
    const parentA = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };
    const parentB = { parent: world as unknown, children: [] as unknown[], addChild(c: { parent: unknown }) { this.children.push(c); c.parent = this; } };

    attach.attachSprite(childHandle, { _handle: parentA });
    attach.attachSprite(childHandle, { _handle: parentB }); // switch parents mid-attachment
    expect(childHandle.parent).toBe(parentB);

    attach.detachSprite(childHandle);
    expect(childHandle.parent).toBe(world); // not parentA — the ORIGINAL container
  });

  test('detachSprite on a sprite that was never attached is a no-op', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);

    expect(() => attach.detachSprite(childHandle)).not.toThrow();
    expect(childHandle.parent).toBe(world);
  });

  test('attachSprite does nothing given a missing child handle or parent object', () => {
    const attach = loadAttach();
    const world = makeContainer('world');
    const childHandle = makeHandle(world);

    expect(() => attach.attachSprite(null, { _handle: {} })).not.toThrow();
    expect(() => attach.attachSprite(childHandle, null)).not.toThrow();
    expect(() => attach.attachSprite(childHandle, {})).not.toThrow(); // parentObj._handle missing
    expect(childHandle.parent).toBe(world); // untouched
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/attach.test.ts`
Expected: FAIL — `src/components/Runner/engine/attach.js` does not exist (`ENOENT`).

- [ ] **Step 3: Write the implementation**

```javascript
const _sbAttach = {
  // childHandle -> the PIXI container it lived in before its first attachTo() call
  _originalParents: new Map(),

  attachSprite(childHandle, parentObj) {
    if (!childHandle || !parentObj || !parentObj._handle) return;
    if (!this._originalParents.has(childHandle)) {
      this._originalParents.set(childHandle, childHandle.parent);
    }
    parentObj._handle.addChild(childHandle);
  },

  detachSprite(childHandle) {
    const originalParent = this._originalParents.get(childHandle);
    if (!originalParent) return;
    originalParent.addChild(childHandle);
    this._originalParents.delete(childHandle);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/attach.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/attach.js tests/components/Runner/attach.test.ts
git commit -m "feat: add attach engine module for sprite reparenting"
```

---

### Task 2: Wire `attach.js` into the engine bootstrapper and runner

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/index.tsx`
- Modify: `tests/components/Runner/stage.test.ts`

- [ ] **Step 1: Add the import and spread entry to the bootstrapper**

In `src/components/Runner/softBasicEngine.js`, add `..._sbAttach,` to the spread (alongside the other modules — order doesn't matter since `attach.js` has no cross-module dependencies):

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
  ..._sbPathfinding,
  ..._sbTween,
  ..._sbAttach,
};
```

- [ ] **Step 2: Add the import and concatenation entry in the runner**

In `src/components/Runner/index.tsx`, add the import near the other engine imports:

```typescript
import sbAttach from './engine/attach.js?raw';
```

And add `sbAttach` to the join array (after `sbTween`, matching import order):

```typescript
[sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbPathfinding, sbTween, sbAttach, sbScene, sbCamera, softBasicEngine].join('\n')
```

- [ ] **Step 3: Add `attach` to `stage.test.ts`'s `ENGINE_MODULES` list and teach `FakeContainer` to track `.parent`**

`tests/components/Runner/stage.test.ts` concatenates every real engine module (including `attach.js` once wired) against a `FakeContainer` stand-in for `PIXI.Container`. That fake currently doesn't set `.parent` on `addChild`, which `attach.js` needs (it reads `childHandle.parent` to remember the original container). Update both:

In `tests/components/Runner/stage.test.ts`, add `'attach'` to `ENGINE_MODULES` (after `'tween'`, matching the real load order):

```typescript
const ENGINE_MODULES = [
  'lifecycle',
  'input',
  'assets',
  'file',
  'save',
  'audio',
  'drawing',
  'stage',
  'sprites',
  'animatedSprite',
  'tilemap',
  'collision',
  'pathfinding',
  'tween',
  'attach',
  'scene',
  'camera',
];
```

And update `FakeContainer` to track `.parent`, mirroring real `PIXI.Container` behavior:

```typescript
class FakeContainer {
  children: unknown[] = [];
  sortableChildren = false;
  parent: FakeContainer | null = null;
  scale = { set: () => {} };
  position = { set: () => {} };
  addChild(c: FakeContainer) {
    if (c.parent) c.parent.removeChild(c);
    this.children.push(c);
    c.parent = this;
  }
  removeChild(c: FakeContainer) {
    const i = this.children.indexOf(c);
    if (i !== -1) this.children.splice(i, 1);
  }
  removeChildren() {
    this.children = [];
  }
}
```

- [ ] **Step 4: Run the full test suite to confirm nothing broke**

Run: `npx vitest run`
Expected: PASS — all existing tests still pass (in particular `tests/components/Runner/stage.test.ts` and `tests/components/Runner/bootstrapper.test.ts`, which load the full concatenated engine).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/softBasicEngine.js src/components/Runner/index.tsx tests/components/Runner/stage.test.ts
git commit -m "feat: wire attach engine module into the bootstrapper and runner"
```

---

### Task 3: `sprite.attachTo` / `sprite.detach`

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`
- Modify: `src/lib/Basic4WebGL/defs/sprite.bas` (regenerated, not hand-edited)
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`

- [ ] **Step 1: Write the failing transpiler tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`:

```typescript
describe('sprite — attachTo / detach', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim child as Sprite("sword.png")',
      '  dim par as Sprite("player.png")',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.attachSprite( and _sb.detachSprite(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim child as Sprite("sword.png")',
      '  dim par as Sprite("player.png")',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.attachSprite(');
    expect(result.code).toContain('_sb.detachSprite(');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`
Expected: FAIL — `attachTo`/`detach` are not recognized members of `Sprite` (undefined-method diagnostic).

- [ ] **Step 3: Add the two methods to `sprite.descriptor.ts`**

In `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`, add to the `methods` array (after `isBlockedRight`):

```typescript
    {
      name: 'attachTo',
      params: ['parent'],
      body: (p, self) => `_sb.attachSprite(${self._handle}, ${p.parent})`,
    },
    {
      name: 'detach',
      params: [],
      body: (_p, self) => `_sb.detachSprite(${self._handle})`,
    },
```

- [ ] **Step 4: Regenerate the library defs**

Run: `npm run generate:library`
Expected output includes: `Generated sprite.bas`

This rewrites `src/lib/Basic4WebGL/defs/sprite.bas` — do not hand-edit it. Confirm the two new functions appear at the end of the generated file, before `EndClass`:

```bas
function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`
Expected: PASS

- [ ] **Step 6: Confirm the descriptor/`.bas` sync regression test still passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts src/lib/Basic4WebGL/defs/sprite.bas tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts
git commit -m "feat: add sprite.attachTo / sprite.detach"
```

---

### Task 4: `animatedsprite.attachTo` / `animatedsprite.detach`

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/animatedsprite.bas` (hand-written — not descriptor-generated)
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`

- [ ] **Step 1: Write the failing transpiler tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`:

```typescript
// ─── attachTo / detach ──────────────────────────────────────────────────────────

describe('AnimatedSprite — attachTo / detach', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim child as AnimatedSprite("hero.png", 48, 48)',
      '  dim par as AnimatedSprite("mount.png", 48, 48)',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.attachSprite( and _sb.detachSprite(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim child as AnimatedSprite("hero.png", 48, 48)',
      '  dim par as AnimatedSprite("mount.png", 48, 48)',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.attachSprite(');
    expect(result.code).toContain('_sb.detachSprite(');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`
Expected: FAIL — `attachTo`/`detach` are not recognized members of `AnimatedSprite`.

- [ ] **Step 3: Hand-add the two methods to `animatedsprite.bas`**

`animatedsprite.bas` is hand-written (not in `registry.ts`'s descriptor list), so edit it directly. Add before `EndClass`, after the existing `setDepth` method:

```bas
function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/animatedsprite.bas tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts
git commit -m "feat: add animatedsprite.attachTo / animatedsprite.detach"
```

---

### Task 5: API reference docs

**Files:**
- Modify: `src/docs/api-reference/sprite.md`
- Modify: `src/docs/api-reference/animatedsprite.md`

- [ ] **Step 1: Add the "Attaching sprites" section to `sprite.md`**

Append to the end of `src/docs/api-reference/sprite.md`:

```markdown

## attachTo(parent)

Makes this sprite follow another sprite's position and rotation automatically, like a weapon glued to a character's hand. Once attached, calling `setPosition` and `setAngle` on this sprite sets its offset and rotation **relative to the parent** — as the parent moves or spins, this sprite moves and spins along with it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| parent    | object | The sprite (or `animatedsprite`) to attach to. |

```bas
sword.attachTo(player)
sword.transform.setPosition(0, 0)  ' centred on the player
sword.setAngle(90)                 ' held out to the side, rotates with the player
```

A few things to know:

- **Position and angle become relative to the parent.** While attached, this sprite's `transform.x()`, `transform.y()`, and angle no longer describe a position on screen — they describe an offset from the parent.
- **Depth ordering becomes relative to the parent too.** `setDepth` while attached only affects ordering among the parent's other attached sprites, not the whole game world.
- **Chains work.** If sprite `B` is attached to sprite `A`, and sprite `C` is attached to `B`, then `C` follows both of them — moving or rotating `A` moves everything in the chain. Just don't attach a sprite back onto one of its own descendants — that creates a loop.
- Attaching a sprite that's already attached to something else simply switches it to the new parent — no need to call `detach()` first.
- If you remove an attached sprite from the world with `world.remove()`, call `detach()` first — otherwise it stops updating but stays visually attached to its (still-alive) parent instead of being cleaned up.

## detach()

Stops this sprite from following whatever it was attached to with `attachTo`. It stays exactly where it was on screen at that moment; nothing resets. Calling `detach()` when the sprite isn't attached to anything does nothing.

```bas
sword.detach()
```
```

- [ ] **Step 2: Add the matching section to `animatedsprite.md`**

Append the same section (with `AnimatedSprite`-appropriate example naming) to the end of `src/docs/api-reference/animatedsprite.md`:

```markdown

## attachTo(parent)

Makes this sprite follow another sprite's position and rotation automatically, like a weapon glued to a character's hand. Once attached, calling `setPosition` and `setAngle` on this sprite sets its offset and rotation **relative to the parent** — as the parent moves or spins, this sprite moves and spins along with it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| parent    | object | The sprite (or `animatedsprite`) to attach to. |

```bas
hat.attachTo(hero)
hat.transform.setPosition(0, -12)  ' held above the hero's head
```

A few things to know:

- **Position and angle become relative to the parent.** While attached, this sprite's `transform.x()`, `transform.y()`, and angle no longer describe a position on screen — they describe an offset from the parent.
- **Depth ordering becomes relative to the parent too.** `setDepth` while attached only affects ordering among the parent's other attached sprites, not the whole game world.
- **Chains work.** If sprite `B` is attached to sprite `A`, and sprite `C` is attached to `B`, then `C` follows both of them — moving or rotating `A` moves everything in the chain. Just don't attach a sprite back onto one of its own descendants — that creates a loop.
- Attaching a sprite that's already attached to something else simply switches it to the new parent — no need to call `detach()` first.
- If you remove an attached sprite from the world with `world.remove()`, call `detach()` first — otherwise it stops updating but stays visually attached to its (still-alive) parent instead of being cleaned up.

## detach()

Stops this sprite from following whatever it was attached to with `attachTo`. It stays exactly where it was on screen at that moment; nothing resets. Calling `detach()` when the sprite isn't attached to anything does nothing.

```bas
hat.detach()
```
```

- [ ] **Step 3: Commit**

```bash
git add src/docs/api-reference/sprite.md src/docs/api-reference/animatedsprite.md
git commit -m "docs: document sprite/animatedsprite attachTo and detach"
```

---

### Task 6: Roadmap update

**Files:**
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Add a new entry under "Lower Priority / Future"**

In `docs/language/library-roadmap.md`, add a new bullet directly after the existing `~~Keyframe (tween) animation~~ **[DONE]**` line:

```markdown
- ~~Sprite attachment / parenting~~ **[DONE]** — `attachTo(parent)` / `detach()` shipped on both `sprite` and `animatedsprite`. Deliberately deferred out of the keyframe/tween work above rather than designed alongside it — that spec explicitly flagged it as "a separate concern to design then." Built on PIXI's own native container parenting rather than hand-computed per-frame trig: `attachTo` reparents a sprite's PIXI display object under another sprite's, so `setPosition`/`setAngle` are automatically interpreted relative to the parent by PIXI's existing transform stack, and multi-level chains (attaching an already-attached sprite's parent) work for free with zero extra code. No per-frame engine update loop needed at all, unlike `tween`. As an instance method (not a free module like `tween`), it's hand-duplicated onto `animatedsprite.bas` for the same reason `tween`'s design noted `animatedsprite` doesn't inherit from `sprite` in this codebase. Proven out by replacing Dungeon Explorer's hand-built circular-keyframe sword swing with `attachTo`. Design spec: `docs/superpowers/specs/2026-08-23-sprite-attachment-design.md`. Tests: `tests/components/Runner/attach.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`. Docs: `src/docs/api-reference/sprite.md`, `src/docs/api-reference/animatedsprite.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/language/library-roadmap.md
git commit -m "docs: mark sprite attachment done in the library roadmap"
```

---

### Task 7: Dungeon Explorer integration — replace the hand-built sword swing

**Files:**
- Modify: `demo-src/dungeon-explorer/Sword.bas`
- Modify: `demo-src/dungeon-explorer/Player.bas`
- Modify: `src/docs/demos/DungeonExplorer.b4wgl.json` (regenerated via `build:demo`, not hand-edited)
- Modify: `src/docs/demos/dungeon-explorer.md`

- [ ] **Step 1: Rewrite `Sword.bas`'s `swing()`**

Replace the entire contents of `demo-src/dungeon-explorer/Sword.bas`:

```bas
Class
Extends sprite

dim active

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(playerRef)
  ' Attaches to the player for the duration of the swing, so the tween below
  ' only needs to animate this sword's own local angle -- PIXI's transform
  ' stack takes care of making that angle relative to the player, which is
  ' what makes the sword sweep around the player as it also spins.
  dim s1 as Keyframe
  dim s2 as Keyframe
  dim frames(0)

  self.attachTo(playerRef)
  self.setVisible(true)
  self.active = true

  s1 = new Keyframe()
  s1.setTime(0)
  s1.setAngle(0)

  s2 = new Keyframe()
  s2.setTime(0.4)
  s2.setAngle(360)

  array.push(frames, s1)
  array.push(frames, s2)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self) then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction

EndClass
```

Note: neither `s1` nor `s2` calls `setPosition`, so both default to `(0, 0)` per `Keyframe`'s documented default — which is exactly the sword's position relative to the attached player (centred on them). This relies on that documented default rather than setting it explicitly, since it's already correct.

- [ ] **Step 2: Update `Player.bas`'s call site**

In `demo-src/dungeon-explorer/Player.bas`, `tryAttack()` currently calls:

```bas
self.sword.swing(self.transform.x(), self.transform.y())
```

Replace that line with:

```bas
self.sword.swing(self)
```

`swing` no longer needs the player's world position — it just needs the player object itself to attach to.

- [ ] **Step 3: Rebuild the demo's `.b4wgl.json` export**

Run: `npm run build:demo -- demo-src/dungeon-explorer DungeonExplorer`
Expected output: `Wrote src/docs/demos/DungeonExplorer.b4wgl.json (11 file(s), 9 asset(s))` (file/asset counts should match the pre-existing demo — this only changed two `.bas` files' contents, not the file/asset list).

- [ ] **Step 4: Update the demo's docs callout**

In `src/docs/demos/dungeon-explorer.md`, replace this paragraph:

```markdown
> **Note:** `Sword.swing()` is the most advanced code in this demo — it builds its circular path by hand with `math.cos`/`math.sin` over several keyframes, because this engine has no sprite-attachment/parenting feature yet to make a swinging weapon "just follow" its wielder. Don't take it as a beginner-level pattern to copy; it's a deliberate stand-in for a capability the language doesn't have, not the intended way to combine two sprites.
```

with:

```markdown
`Sword.swing()` uses `attachTo`/`detach` to glue the sword to the player for the swing's duration — once attached, the sword only needs to tween its own local angle from 0° to 360°, and `attachTo`'s parent-relative positioning (backed by PIXI's own container parenting) takes care of making that rotation orbit around the player automatically.
```

Also update the preceding paragraph's sentence describing the old behavior — find this sentence in the same doc:

```markdown
The attack is also a little flourish: `tween.play()` spins the player a full 360° over the 0.4s attack window, and a separate `Sword` sprite (invisible the rest of the time) traces its own circle around the player over the same 0.4s, timed to land on the same angle the player's own spin is at, at every moment — so it reads as swinging rigidly around the spinning player.
```

Replace with:

```markdown
The attack is also a little flourish: `tween.play()` spins the player a full 360° over the 0.4s attack window, and a separate `Sword` sprite (invisible the rest of the time) attaches to the player via `attachTo` and tweens its own local angle through the same 360° over the same 0.4s — since it's attached, that rotation is automatically relative to the player, so it reads as swinging rigidly around the spinning player.
```

Finally, update the "Key techniques" line to mention the new feature — find:

```markdown
**Key techniques:** `tween.play`/`isPlaying` + `Keyframe` for the spin-and-swing melee attack, `collision.setTileSolid`/`isTileSolid` for a runtime-unlockable door, `camera.setPosition` for discrete room-snap transitions instead of continuous scrolling, `sprite.setVelocity` + `collision.setupTileCollision` for kinematic movement, `tileMapSet.markersByTag` for visually-placed enemies/key/boss, `pathfinding.navigateTo` for chase AI.
```

Replace with:

```markdown
**Key techniques:** `tween.play`/`isPlaying` + `Keyframe` + `sprite.attachTo`/`detach` for the spin-and-swing melee attack, `collision.setTileSolid`/`isTileSolid` for a runtime-unlockable door, `camera.setPosition` for discrete room-snap transitions instead of continuous scrolling, `sprite.setVelocity` + `collision.setupTileCollision` for kinematic movement, `tileMapSet.markersByTag` for visually-placed enemies/key/boss, `pathfinding.navigateTo` for chase AI.
```

- [ ] **Step 5: Manually verify in the browser via Cypress**

This is the one behavior change no Vitest test covers — the transpiler tests only check codegen, not what the compiled game does at runtime. Per this project's convention, run the Cypress e2e suite manually:

```bash
npm run dev
```

In a second terminal, once the dev server is up:

```bash
npm run cypress:run
```

Expected: the `demo-dungeon-explorer` spec in `cypress/e2e/demos.cy.ts` passes (it already reads the real `DungeonExplorer.b4wgl.json`, seeds it, clicks Run, and asserts zero `ERR` console entries — no changes needed to the spec itself since it's data-driven off the JSON export you just rebuilt). Also manually play the attack in the running dev preview to visually confirm the sword now sweeps around the player instead of snapping or drifting.

- [ ] **Step 6: Commit**

```bash
git add demo-src/dungeon-explorer/Sword.bas demo-src/dungeon-explorer/Player.bas src/docs/demos/DungeonExplorer.b4wgl.json src/docs/demos/dungeon-explorer.md
git commit -m "feat: replace Dungeon Explorer's hand-built sword swing with attachTo"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: PASS — no failures, no regressions in any pre-existing test file.

- [ ] **Step 2: Build the project**

Run: `npx vite build`
Expected: build succeeds with no errors (per this project's convention, this is the verification command — not `tsc --noEmit`, which has pre-existing unrelated env issues).

- [ ] **Step 3: Confirm no stray uncommitted changes**

Run: `git status`
Expected: clean working tree — everything from Tasks 1–7 has already been committed.
