# softGfx Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 15 new methods across Sprite, gfx, stage, Text, and pen modules so all four showcase game types (platformer, side-scroller shooter, top-down, arcade) are buildable without workarounds.

**Architecture:** No compiler changes — all additions use the existing `call()` escape hatch. Each feature touches two layers: the JavaScript engine files (`src/components/Runner/engine/`) that call PixiJS directly, and the softBASIC def files (`src/lib/Basic4WebGL/defs/`) that expose them. Documentation updated last.

**Tech Stack:** TypeScript (compiler), softBASIC def syntax (`call()`), PixiJS v8, Vitest.

---

## Background: How the Two Layers Work

Read this before starting — it explains every naming decision in this plan.

**Engine layer** (`src/components/Runner/engine/*.js`): Plain JavaScript objects (`_sbSprites`, `_sbInput`, `_sbStage`, `_sbDrawing`) that call PixiJS. All are merged into a single `_sb` object in `softBasicEngine.js`:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};
```

User code always calls `_sb.methodName(...)` — never the module objects directly.

**BASIC def layer** (`src/lib/Basic4WebGL/defs/*.bas`): softBASIC source files that expose engine functions via `call()`. The `call()` escape hatch substitutes parameter names in the string: a function named `setScale` with params `sx` and `sy` produces substituted names `setscale_sx` and `setscale_sy`. Example:

```basic
function setScale(sx, sy)
    call("_sb.setScale(this._handle, setscale_sx, setscale_sy)")
endfunction
```

Emits: `_sb.setScale(this._handle, <actual_sx>, <actual_sy>)`

**Sprite and Text are Class files** (`sprite.bas`, `text.bas` both start with `Class`). To use them in compiler tests, load them via the `files` array with their class filename. Class instance methods use `this._handle` to reference the PixiJS object.

**gfx, stage, pen are module files** — they go in the `lib` array for compiler tests. Their function names become module-prefixed in user code (`stage.width()`, `gfx.mouseX()`, etc.).

**_sbInput and `this`**: `_sbInput` methods use `this._keys`. After spreading into `_sb`, `this` in those methods refers to `_sb`. The spread copies the `_keys` reference, so `_sb._keys === _sbInput._keys` — this pattern works correctly.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/components/Runner/engine/sprites.js` | Modify | Add `setScale`, `setFlip`, `setVisible`, `setTexture`, `getSpriteWidth`, `getSpriteHeight`, `setTextStyle` |
| `src/components/Runner/engine/input.js` | Modify | Add `_mouseX`, `_mouseY`, `_mouseDown` state vars + `getMouseX`, `getMouseY`, `getMouseDown`, `_initMouse` |
| `src/components/Runner/engine/stage.js` | Modify | Add `getStageWidth`, `getStageHeight`, `setBackground` |
| `src/components/Runner/engine/drawing.js` | Modify | Add `lineWidth: 2` to `_styles`, add `setLineWidth`, update all three draw calls to use `_styles.lineWidth` |
| `src/components/Runner/softBasicEngine.js` | Modify | Call `_sb._initMouse(app.canvas \|\| app.view)` after `_sb` is defined |
| `src/lib/Basic4WebGL/defs/sprite.bas` | Modify | Add `setScale`, `setFlip`, `setVisible`, `setTexture`, `width`, `height` inside the class |
| `src/lib/Basic4WebGL/defs/gfx.bas` | Modify | Add `mouseX`, `mouseY`, `mouseDown` |
| `src/lib/Basic4WebGL/defs/stage.bas` | Modify | Add `width`, `height`, `setBackground` |
| `src/lib/Basic4WebGL/defs/text.bas` | Modify | Add `setStyle` inside the class |
| `src/lib/Basic4WebGL/defs/pen.bas` | Modify | Add `setLineWidth` |
| `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` | Create | Compile-pass tests for all new methods |
| `docs/language/softbasic-concepts.md` | Modify | Update Sprite, gfx, stage, Text, pen tables; add lifecycle hooks section |

---

## Task 1: Sprite Engine Methods + Def + Tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
- Modify: `src/components/Runner/engine/sprites.js`
- Modify: `src/lib/Basic4WebGL/defs/sprite.bas`

### Background for this task

`sprite.bas` is a `Class` file. The constructor stores the PixiJS sprite as `_handle`. All instance methods pass `this._handle` to engine functions — that's the raw PixiJS `PIXI.Sprite` object. Engine functions receive it as `obj` and call PixiJS API directly on it.

`setFlip` works by negating the scale sign. It preserves the existing scale magnitude so it composes safely with `setScale`.

`setTexture` swaps textures using `_sbAssets.get(path)` — this requires the image to already be loaded (i.e., declared as a `Sprite` somewhere in the program).

When testing class-based defs, both `ObjectTransform.bas` (depended on by `sprite.bas`) and `Sprite.bas` must be in the `files` array of the compiler call, in dependency order.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');
const gfxSource = readFileSync('src/lib/Basic4WebGL/defs/gfx.bas', 'utf-8');
const stageSource = readFileSync('src/lib/Basic4WebGL/defs/stage.bas', 'utf-8');
const textSource = readFileSync('src/lib/Basic4WebGL/defs/text.bas', 'utf-8');
const penSource = readFileSync('src/lib/Basic4WebGL/defs/pen.bas', 'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas', source: spriteSource },
      { name: 'Main.bas', source },
    ],
  });

const transpileWithGfx = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'gfx', source: gfxSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithStage = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'stage', source: stageSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithText = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Text.bas', source: textSource },
      { name: 'Main.bas', source },
    ],
  });

const transpileWithPen = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'pen', source: penSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── Sprite — new methods ─────────────────────────────────────────────────────

describe('Sprite — setScale', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setScale(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.code).toContain('_sb.setScale(');
  });
});

describe('Sprite — setFlip', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setFlip(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.code).toContain('_sb.setFlip(');
  });
});

describe('Sprite — setVisible', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setVisible(false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setVisible(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setVisible(false)\nendfunction'
    );
    expect(result.code).toContain('_sb.setVisible(');
  });
});

describe('Sprite — setTexture', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setTexture("other.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setTexture(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setTexture("other.png")\nendfunction'
    );
    expect(result.code).toContain('_sb.setTexture(');
  });
});

describe('Sprite — width', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getSpriteWidth(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getSpriteWidth(');
  });
});

describe('Sprite — height', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getSpriteHeight(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getSpriteHeight(');
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: failures — `setScale`, `setFlip`, `setVisible`, `setTexture`, `width`, `height` not found on Sprite.

- [ ] **Step 3: Add engine functions to `sprites.js`**

The full file after changes (append the six new methods inside the `_sbSprites` object, before the closing `};`):

```js
const _sbSprites = {
  createSprite(imagePath) {
    const texture = _sbAssets.get(imagePath);
    return new PIXI.Sprite(texture);
  },
  setPosition(obj, x, y) {
    obj.position.set(x, y);
  },
  getPositionX(obj) {
    return obj.position.x;
  },
  getPositionY(obj) {
    return obj.position.y;
  },
  setAngle(obj, angle) {
    obj.angle = angle;
  },
  setAlpha(obj, a) {
    obj.alpha = a;
  },
  setScale(obj, sx, sy) {
    obj.scale.set(sx, sy);
  },
  setFlip(obj, h, v) {
    obj.scale.x = h ? -Math.abs(obj.scale.x) : Math.abs(obj.scale.x);
    obj.scale.y = v ? -Math.abs(obj.scale.y) : Math.abs(obj.scale.y);
  },
  setVisible(obj, visible) {
    obj.visible = visible;
  },
  setTexture(obj, path) {
    obj.texture = _sbAssets.get(path);
  },
  getSpriteWidth(obj) {
    return obj.width;
  },
  getSpriteHeight(obj) {
    return obj.height;
  },
  createText(content, x, y) {
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#4a1850', width: 5 },
      dropShadow: {
        color: '#000000',
        blur: 4,
        angle: Math.PI / 6,
        distance: 6,
      },
      wordWrap: true,
      wordWrapWidth: 440,
      lineJoin: 'round',
    });
    const text = new PIXI.Text({ text: content, style: textStyle });
    text.x = x;
    text.y = y;
    return text;
  },
  setText(obj, text) {
    obj.text = text;
  },
  boxCollide(a, b) {
    const ab = a.getBounds();
    const bb = b.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  },
};
```

- [ ] **Step 4: Add BASIC def methods to `sprite.bas`**

Full file after changes (add the six new functions before `EndClass`):

```basic
Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setAngle(angle)
    call("_sb.setAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setVisible(this._handle, setvisible_v)")
endfunction

function setTexture(path)
    call("_sb.setTexture(this._handle, settexture_path)")
endfunction

function width()
    return call("_sb.getSpriteWidth(this._handle)")
endfunction

function height()
    return call("_sb.getSpriteHeight(this._handle)")
endfunction

EndClass
```

- [ ] **Step 5: Run the tests — confirm they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: all 12 Sprite tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/sprites.js src/lib/Basic4WebGL/defs/sprite.bas tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat: add setScale, setFlip, setVisible, setTexture, width, height to Sprite"
```

---

## Task 2: Mouse Input Engine + gfx Def + Tests

**Files:**
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` (append)
- Modify: `src/components/Runner/engine/input.js`
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/lib/Basic4WebGL/defs/gfx.bas`

### Background for this task

Mouse state (`_mouseX`, `_mouseY`, `_mouseDown`) is tracked in `_sbInput` using three new properties. The `_initMouse(canvas)` method attaches pointer event listeners to the canvas. After the `_sb` object is constructed in `softBasicEngine.js`, `_sb._initMouse(app.canvas || app.view)` initialises the listeners (`app.canvas` is PixiJS v8; `app.view` is the v7 fallback).

`gfx.bas` is a **module file** (no `Class` header). Its functions become accessible as `gfx.mouseX()`, `gfx.mouseY()`, `gfx.mouseDown()` in user code.

- [ ] **Step 1: Append failing tests to `softgfx.test.ts`**

Append to the end of `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`:

```ts
// ─── gfx — mouse input ────────────────────────────────────────────────────────

describe('gfx — mouseX', () => {
  test('compiles without error', () => {
    const result = transpileWithGfx(
      'function test()\n  dim x\n  x = gfx.mouseX()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseX()', () => {
    const result = transpileWithGfx(
      'function test()\n  dim x\n  x = gfx.mouseX()\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseX()');
  });
});

describe('gfx — mouseY', () => {
  test('compiles without error', () => {
    const result = transpileWithGfx(
      'function test()\n  dim y\n  y = gfx.mouseY()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseY()', () => {
    const result = transpileWithGfx(
      'function test()\n  dim y\n  y = gfx.mouseY()\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseY()');
  });
});

describe('gfx — mouseDown', () => {
  test('compiles without error', () => {
    const result = transpileWithGfx(
      'function test()\n  if gfx.mouseDown()\n    dim x\n    x = 1\n  endif\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseDown()', () => {
    const result = transpileWithGfx(
      'function test()\n  if gfx.mouseDown()\n    dim x\n    x = 1\n  endif\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseDown()');
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: the 6 new gfx mouse tests fail; all earlier Sprite tests still pass.

- [ ] **Step 3: Update `input.js`**

Full file after changes:

```js
const _sbInput = {
  _keys: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
  },
  getMouseX() {
    return this._mouseX;
  },
  getMouseY() {
    return this._mouseY;
  },
  getMouseDown() {
    return this._mouseDown;
  },
  _initMouse(canvas) {
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerdown', () => {
      this._mouseDown = true;
    });
    canvas.addEventListener('pointerup', () => {
      this._mouseDown = false;
    });
  },
};
```

- [ ] **Step 4: Update `softBasicEngine.js`**

Full file after changes (add the `_initMouse` call after the `_sb` definition):

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};

_sb._initMouse(app.canvas || app.view);

document.addEventListener('keydown', (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener('keyup', (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeyup(e.keyCode);
});
```

- [ ] **Step 5: Update `gfx.bas`**

Full file after changes:

```basic
function boxCollide(a, b)
    return call("_sb.boxCollide(boxcollide_a, boxcollide_b)")
endfunction

function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
endfunction

function mouseX()
    return call("_sb.getMouseX()")
endfunction

function mouseY()
    return call("_sb.getMouseY()")
endfunction

function mouseDown()
    return call("_sb.getMouseDown()")
endfunction
```

- [ ] **Step 6: Run tests — confirm all pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: all 18 tests pass (12 Sprite + 6 gfx mouse).

- [ ] **Step 7: Commit**

```bash
git add src/components/Runner/engine/input.js src/components/Runner/softBasicEngine.js src/lib/Basic4WebGL/defs/gfx.bas tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat: add mouse input (mouseX, mouseY, mouseDown) to gfx module"
```

---

## Task 3: Stage Engine Methods + Def + Tests

**Files:**
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` (append)
- Modify: `src/components/Runner/engine/stage.js`
- Modify: `src/lib/Basic4WebGL/defs/stage.bas`

### Background for this task

`stage.bas` is a **module file**. Its functions become `stage.width()`, `stage.height()`, `stage.setBackground(r, g, b)`. Engine names use a `getStage` prefix for `width`/`height` to avoid any future naming collision in the merged `_sb` object.

`setBackground` converts separate r/g/b channels (0–255) to a hex integer using bitwise operations: `(r << 16) | (g << 8) | b`. PixiJS v8 accepts this as `app.renderer.background.color`.

- [ ] **Step 1: Append failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`:

```ts
// ─── stage — width, height, setBackground ─────────────────────────────────────

describe('stage — width', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  dim w\n  w = stage.width()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getStageWidth()', () => {
    const result = transpileWithStage(
      'function test()\n  dim w\n  w = stage.width()\nendfunction'
    );
    expect(result.code).toContain('_sb.getStageWidth()');
  });
});

describe('stage — height', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  dim h\n  h = stage.height()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getStageHeight()', () => {
    const result = transpileWithStage(
      'function test()\n  dim h\n  h = stage.height()\nendfunction'
    );
    expect(result.code).toContain('_sb.getStageHeight()');
  });
});

describe('stage — setBackground', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  stage.setBackground(20, 20, 40)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setBackground(', () => {
    const result = transpileWithStage(
      'function test()\n  stage.setBackground(20, 20, 40)\nendfunction'
    );
    expect(result.code).toContain('_sb.setBackground(');
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: 6 new stage tests fail; all prior tests pass.

- [ ] **Step 3: Update `stage.js`**

Full file after changes:

```js
const _sbStage = {
  addToStage(obj) {
    app.stage.addChild(obj._handle);
  },
  removeFromStage(obj) {
    app.stage.removeChild(obj._handle);
  },
  clear() {
    app.stage.removeChildren();
  },
  getStageWidth() {
    return app.renderer.width;
  },
  getStageHeight() {
    return app.renderer.height;
  },
  setBackground(r, g, b) {
    app.renderer.background.color = (r << 16) | (g << 8) | b;
  },
};
```

- [ ] **Step 4: Update `stage.bas`**

Full file after changes:

```basic
function add(obj)
    call("_sb.addToStage(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromStage(remove_obj)")
endfunction

function clear()
    call("_sb.clear()")
endfunction

function width()
    return call("_sb.getStageWidth()")
endfunction

function height()
    return call("_sb.getStageHeight()")
endfunction

function setBackground(r, g, b)
    call("_sb.setBackground(setbackground_r, setbackground_g, setbackground_b)")
endfunction
```

- [ ] **Step 5: Run tests — confirm all pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: all 24 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/stage.js src/lib/Basic4WebGL/defs/stage.bas tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat: add width, height, setBackground to stage module"
```

---

## Task 4: Text setStyle Engine + Def + Tests

**Files:**
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` (append)
- Modify: `src/components/Runner/engine/sprites.js`
- Modify: `src/lib/Basic4WebGL/defs/text.bas`

### Background for this task

`setTextStyle` lives in `sprites.js` because `createText` is there. It updates `style.fontSize` and `style.fill` directly on the PixiJS Text object — PixiJS TextStyle properties are mutable and trigger a re-render on change.

`style.fill` accepts a CSS colour string. Using `` `rgb(${r},${g},${b})` `` avoids the need for a hex converter.

`text.bas` is a **Class file**. When testing, load it in the `files` array as `Text.bas`.

- [ ] **Step 1: Append failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`:

```ts
// ─── Text — setStyle ──────────────────────────────────────────────────────────

describe('Text — setStyle', () => {
  test('compiles without error', () => {
    const result = transpileWithText([
      'function test()',
      '  dim t as Text("hi", 10, 10)',
      '  t.setStyle(24, 255, 255, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setTextStyle(', () => {
    const result = transpileWithText([
      'function test()',
      '  dim t as Text("hi", 10, 10)',
      '  t.setStyle(24, 255, 255, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setTextStyle(');
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: 2 new Text tests fail; all prior tests pass.

- [ ] **Step 3: Add `setTextStyle` to `sprites.js`**

Add this method inside `_sbSprites`, after `boxCollide`:

```js
setTextStyle(obj, size, r, g, b) {
  obj.style.fontSize = size;
  obj.style.fill = `rgb(${r},${g},${b})`;
},
```

The full `_sbSprites` object now ends with:

```js
  boxCollide(a, b) {
    const ab = a.getBounds();
    const bb = b.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  },
  setTextStyle(obj, size, r, g, b) {
    obj.style.fontSize = size;
    obj.style.fill = `rgb(${r},${g},${b})`;
  },
};
```

- [ ] **Step 4: Add `setStyle` to `text.bas`**

Full file after changes:

```basic
Class
dim _handle

Constructor(content, x, y)
    _handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")
EndConstructor

function setText(content)
    call("_sb.setText(this._handle, settext_content)")
endfunction

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setStyle(size, r, g, b)
    call("_sb.setTextStyle(this._handle, setstyle_size, setstyle_r, setstyle_g, setstyle_b)")
endfunction

EndClass
```

- [ ] **Step 5: Run tests — confirm all pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: all 26 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/sprites.js src/lib/Basic4WebGL/defs/text.bas tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat: add setStyle to Text class"
```

---

## Task 5: Pen setLineWidth Engine + Def + Tests

**Files:**
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` (append)
- Modify: `src/components/Runner/engine/drawing.js`
- Modify: `src/lib/Basic4WebGL/defs/pen.bas`

### Background for this task

`drawing.js` uses an IIFE with a `_styles` object that holds `fillColor` and `lineColor`. Add `lineWidth: 2` to that object and a `setLineWidth` method. Update the three draw calls (`drawLine`, `drawRect`, `drawCircle`) to use `_styles.lineWidth` instead of the hardcoded `2`.

`pen.bas` is a **module file**. Add `setLineWidth` — it becomes `pen.setLineWidth(n)` in user code.

- [ ] **Step 1: Append failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`:

```ts
// ─── pen — setLineWidth ───────────────────────────────────────────────────────

describe('pen — setLineWidth', () => {
  test('compiles without error', () => {
    const result = transpileWithPen(
      'function test()\n  pen.setLineWidth(4)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setLineWidth(', () => {
    const result = transpileWithPen(
      'function test()\n  pen.setLineWidth(4)\nendfunction'
    );
    expect(result.code).toContain('_sb.setLineWidth(');
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: 2 new pen tests fail; all prior tests pass.

- [ ] **Step 3: Update `drawing.js`**

Full file after changes:

```js
const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
    lineWidth: 2,
  };

  function _componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  return {
    setFillColor(r, g, b) {
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);
      _styles.fillColor = parseInt(hex, 16);
    },
    setLineColor(r, g, b) {
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);
      _styles.lineColor = parseInt(hex, 16);
    },
    setLineWidth(n) {
      _styles.lineWidth = n;
    },
    drawLine(x, y, x2, y2) {
      const obj = new PIXI.Graphics();
      obj.moveTo(0, 0).lineTo(x2, y2).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
    drawRect(x, y, width, height) {
      const obj = new PIXI.Graphics();
      obj.rect(0, 0, width, height).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.pivot.set(width / 2, height / 2);
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
    drawCircle(x, y, radius) {
      const obj = new PIXI.Graphics();
      obj.circle(0, 0, radius).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      obj.pivot.set(radius / 2, radius / 2);
      obj.position.set(x, y);
      app.stage.addChild(obj);
      return obj;
    },
  };
})();
```

- [ ] **Step 4: Update `pen.bas`**

Full file after changes:

```basic
function setFillColor(r, g, b)
    call("_sb.setFillColor(setfillcolor_r, setfillcolor_g, setfillcolor_b)")
endfunction

function setLineColor(r, g, b)
    call("_sb.setLineColor(setlinecolor_r, setlinecolor_g, setlinecolor_b)")
endfunction

function setLineWidth(n)
    call("_sb.setLineWidth(setlinewidth_n)")
endfunction
```

- [ ] **Step 5: Run tests — confirm all pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
```

Expected: all 28 tests pass.

- [ ] **Step 6: Run full test suite to confirm no regressions**

```
npx vitest run
```

Expected: all tests pass, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/components/Runner/engine/drawing.js src/lib/Basic4WebGL/defs/pen.bas tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat: add setLineWidth to pen module; drawing.js no longer hardcodes stroke width"
```

---

## Task 6: Documentation

**Files:**
- Modify: `docs/language/softbasic-concepts.md`

### Background for this task

Update the existing Built-in Modules section. Each module already has a table — extend it with the new methods. Add a new **Lifecycle Hooks** subsection documenting `onkeydown` and `onkeyup` (already wired in the engine, just undocumented).

- [ ] **Step 1: Update the Sprite table**

Find the existing `### Sprite` section. The current method table has 6 rows (Constructor through setAlpha). Replace it with:

```markdown
### `Sprite`

A display object wrapping a PIXI sprite. Created from a project asset image.

| Method | Signature | Description |
|---|---|---|
| Constructor | `Sprite(imagePath)` | Loads the named asset and creates the sprite |
| `setPosition` | `(x, y)` | Sets the sprite's position |
| `getX` | `()` | Returns current x position |
| `getY` | `()` | Returns current y position |
| `setAngle` | `(angle)` | Sets rotation in degrees |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |
| `setScale` | `(sx, sy)` | Sets scale on both axes (`1` = natural size) |
| `setFlip` | `(h, v)` | Flips horizontally and/or vertically. Pass `true`/`false` for each axis. Preserves scale magnitude. |
| `setVisible` | `(v)` | Shows (`true`) or hides (`false`) the sprite without removing it from the stage |
| `setTexture` | `(path)` | Swaps the sprite image. `path` must be a pre-loaded asset (i.e. declared as a `Sprite` somewhere in the program). |
| `width` | `()` | Returns current width in pixels (after scale) |
| `height` | `()` | Returns current height in pixels (after scale) |
```

- [ ] **Step 2: Update the stage table**

Find the existing `### stage` section. Replace its table with:

```markdown
### `stage`

| Function | Description |
|---|---|
| `stage.add(obj)` | Adds a display object to the stage |
| `stage.remove(obj)` | Removes a display object from the stage |
| `stage.clear()` | Removes all display objects |
| `stage.width()` | Returns the canvas width in pixels |
| `stage.height()` | Returns the canvas height in pixels |
| `stage.setBackground(r, g, b)` | Sets the background colour (0–255 per channel) |
```

- [ ] **Step 3: Update the gfx table**

Find the existing `### gfx` section. Replace its table with:

```markdown
### `gfx`

Top-level graphics helpers.

| Function | Description |
|---|---|
| `gfx.boxCollide(a, b)` | Returns true if two objects' bounding boxes overlap |
| `gfx.getKeyDown(keycode)` | Returns true if the key is currently held |
| `gfx.mouseX()` | Returns the pointer's current X position, canvas-relative |
| `gfx.mouseY()` | Returns the pointer's current Y position, canvas-relative |
| `gfx.mouseDown()` | Returns true if any mouse button is currently held |
```

- [ ] **Step 4: Update the Text table**

Find the existing `### Text` section. Replace its table with:

```markdown
### `Text`

A display object wrapping a PIXI text node.

| Method | Signature | Description |
|---|---|---|
| Constructor | `Text(content, x, y)` | Creates a text object at position |
| `setText` | `(content)` | Updates the displayed string |
| `setPosition` | `(x, y)` | Moves the text object |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |
| `setStyle` | `(size, r, g, b)` | Sets font size and fill colour in one call (r/g/b: 0–255) |
```

- [ ] **Step 5: Update the pen table**

Find the existing `### pen` section. Replace its table with:

```markdown
### `pen`

Control fill and stroke style for drawing.

| Function | Description |
|---|---|
| `pen.setFillColor(r, g, b)` | Set fill colour (0–255) |
| `pen.setLineColor(r, g, b)` | Set stroke colour |
| `pen.setLineWidth(n)` | Set stroke width in pixels (default: 2) |
```

- [ ] **Step 6: Add keyboard lifecycle hook documentation**

Find the `## Lifecycle Functions` section (after `onenter` and `onupdate`). Add a new subsection after `onupdate`:

```markdown
### `onkeydown(keyCode)` and `onkeyup(keyCode)`

Called when a key is pressed or released. `keyCode` is the standard browser key code integer.

```basic
function onkeydown(k)
    if k == 32          ' Space
        jump()
    endif
    if k == 37          ' Left arrow
        moveLeft()
    endif
endfunction

function onkeyup(k)
    ' react to key release
endfunction
```

Common key codes: 32 = Space, 13 = Enter, 37 = Left, 38 = Up, 39 = Right, 40 = Down, 65–90 = A–Z.

Both functions are optional — define only the ones you need. If a module does not define `onkeydown`, key presses are silently ignored for that module.
```

- [ ] **Step 7: Remove resolved Known Gaps entries**

Find the `## Known Gaps / To Document` section at the bottom. The following entries are now resolved and should be removed:

- `Whether print accepts multiple arguments / expressions` — leave (still open)
- `String concatenation syntax` — leave (still open)
- `Comparison operators` — leave (still open)
- `Boolean operators` — leave (still open)
- `deltaTime exposure in onupdate() parameters` — leave (still open)

Remove: `deltaTime exposure` if it was listed as a gap — check the current file. If `onkeydown`/`onkeyup` appeared in Known Gaps, remove those entries.

- [ ] **Step 8: Commit**

```bash
git add docs/language/softbasic-concepts.md
git commit -m "docs: update softbasic-concepts.md with new softGfx methods and lifecycle hooks"
```
