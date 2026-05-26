# Library Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three uncoordinated JS runtime singletons with a single `_sb` engine, introduce a TypeScript descriptor + generator system to eliminate fragile `call()` strings, and redesign the softGfx API surface around `Sprite` and `Text` classes.

**Architecture:** Runtime splits into focused `engine/` modules composed into one `_sb` object. A descriptor system generates library `.bas` files from TypeScript, with proxy objects applying transpiler naming conventions automatically. The softGfx package drops `spritemanager` and `transform`; `Sprite` and `Text` become first-class classes.

**Tech Stack:** TypeScript, plain JS (iframe-injected, no ES modules), softBASIC `.bas`, Vite `?raw` imports, Vitest.

---

## Key Context

**How runtime JS enters the iframe:** `Runner/index.tsx` loads JS files via Vite `?raw` and injects them as raw strings into the `srcDoc` of a sandboxed iframe. All JS runs in a single `<script>` block — ES module `import` statements do **not** work. Engine files must use plain JS objects; `softBasicEngine.js` spreads them into `_sb`.

**Injection order matters:** `assets.js` must be concatenated before `sprites.js` because `createSprite` references `_sbAssets` directly.

**`terminationRules.ts`:** The transpiler emits a footer that currently calls `_SoftBasicGfx.createInstance(...)` and `_SoftAssetManager.preloadFromLocalStorage(...)`. Both references change in Task 1.

**Known bugs fixed by this plan:** `gfx.bas`, `drawing.bas`, and `pen.bas` currently use unprefixed parameter names in `call()` strings (e.g. `_sb.drawLine(x,y,x2,y2)` instead of `_sb.drawLine(drawline_x,drawline_y,...)`). These render the parameters as `undefined` at runtime. The descriptor system generates correct prefixed names.

**`vite-node`** is available in `node_modules/.bin/` — use it to run the generator script.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/components/Runner/engine/lifecycle.js` |
| Create | `src/components/Runner/engine/input.js` |
| Create | `src/components/Runner/engine/assets.js` |
| Create | `src/components/Runner/engine/drawing.js` |
| Create | `src/components/Runner/engine/stage.js` |
| Create | `src/components/Runner/engine/sprites.js` |
| Create | `src/components/Runner/softBasicEngine.js` |
| Create | `src/lib/Basic4WebGL/library/generator/types.ts` |
| Create | `src/lib/Basic4WebGL/library/generator/proxies.ts` |
| Create | `src/lib/Basic4WebGL/library/generator/moduleGenerator.ts` |
| Create | `src/lib/Basic4WebGL/library/generator/classGenerator.ts` |
| Create | `src/lib/Basic4WebGL/library/generator/index.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/text.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/stage.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/pen.descriptor.ts` |
| Create | `src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts` |
| Create | `scripts/generateLibrary.ts` |
| Create | `tests/lib/Basic4WebGL/unit/generator/proxies.test.ts` |
| Create | `tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts` |
| Create | `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts` |
| Create | `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts` |
| Create | `tests/lib/Basic4WebGL/integration/transpiler/textClass.test.ts` |
| Modify | `src/components/Runner/index.tsx` |
| Modify | `src/components/Runner/pixiInit.js` |
| Modify | `src/components/Runner/bootstrapper.html` |
| Modify | `src/lib/Basic4WebGL/transpilerRules/terminationRules.ts` |
| Modify | `src/constants/firstPartyPackages.ts` |
| Modify | `package.json` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/gfx.bas` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/drawing.bas` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/stage.bas` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/pen.bas` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/assetmanager.bas` |
| Overwrite (generated) | `src/lib/Basic4WebGL/defs/text.bas` |
| Create (generated) | `src/lib/Basic4WebGL/defs/sprite.bas` |
| Delete | `src/components/Runner/softBasicGFX.js` |
| Delete | `src/components/Runner/softAssetManager.js` |
| Delete | `src/components/Runner/softSpriteManager.js` |
| Delete | `src/lib/Basic4WebGL/defs/spritemanager.bas` |
| Delete | `src/lib/Basic4WebGL/defs/transform.bas` |
| Update | `docs/language/softbasic-concepts.md` |
| Update | `docs/language/library-roadmap.md` |
| Update | `docs/outstanding-issues.md` |

---

## Task 1: Runtime Restructure

Split the three singleton JS files into focused `engine/` modules composed into a single `_sb` object. Update the transpiler footer and pixiInit to reference `_sb` instead of the old singletons. Update `Runner/index.tsx` to inject all engine files.

**Files:**
- Create: all `src/components/Runner/engine/*.js` and `softBasicEngine.js`
- Modify: `src/components/Runner/index.tsx`, `pixiInit.js`, `bootstrapper.html`
- Modify: `src/lib/Basic4WebGL/transpilerRules/terminationRules.ts`
- Delete: `softBasicGFX.js`, `softAssetManager.js`, `softSpriteManager.js`

- [ ] **Step 1: Create `engine/lifecycle.js`**

Create `src/components/Runner/engine/lifecycle.js`:

```js
const _sbLifecycle = {
  _sbClasses: [],
  _update(delta) {
    this._sbClasses.forEach((c) => {
      if (c.symbol.onupdate) {
        c.symbol.onupdate(delta);
      }
    });
  },
};
```

Note: the `enabled` flag from the old `_SoftBasicGfx` is removed. All modules that define `onupdate` now run automatically — explicit `stage.registerNode` is no longer needed to enable the update loop.

- [ ] **Step 2: Create `engine/input.js`**

Create `src/components/Runner/engine/input.js`:

```js
const _sbInput = {
  _keys: {},
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
  },
};
```

- [ ] **Step 3: Create `engine/assets.js`**

Create `src/components/Runner/engine/assets.js`:

```js
const _sbAssets = (() => {
  const _cache = new Map();
  let _ready = false;

  return {
    async preload(manifest) {
      manifest.forEach(({ name, src }) =>
        PIXI.Assets.add({ alias: name, src })
      );
      const loads = manifest.map(async ({ name }) => {
        const asset = await PIXI.Assets.load(name);
        _cache.set(name, asset);
      });
      await Promise.all(loads);
      _ready = true;
    },

    async preloadFromLocalStorage(projectId) {
      const raw = window.localStorage.getItem('persist:softBASIC');
      if (!raw) { _ready = true; return; }
      let assetsById = {};
      try {
        const persisted = JSON.parse(raw);
        assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};
      } catch (_) {
        _ready = true;
        return;
      }
      const assets = Object.values(assetsById).filter((a) => a.projectId === projectId);
      if (assets.length === 0) { _ready = true; return; }
      await this.preload(assets.map((a) => ({ name: a.name, src: a.content })));
    },

    isReady() {
      return _ready;
    },

    get(name) {
      if (!_cache.has(name)) {
        throw Error(`Asset "${name}" not found. Make sure the filename is correct and included in your assets.`);
      }
      return _cache.get(name);
    },

    tryGet(name) {
      return _cache.get(name);
    },
  };
})();
```

- [ ] **Step 4: Create `engine/drawing.js`**

Create `src/components/Runner/engine/drawing.js`:

```js
const _sbDrawing = (() => {
  const _styles = {
    fillColor: 0xffffff,
    lineColor: 0xffffff,
  };

  function _componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function _drawWithFill(drawMethod) {
    const obj = new PIXI.Graphics();
    obj.lineStyle(2, _styles.lineColor, 1);
    obj.beginFill(_styles.fillColor);
    drawMethod(obj);
    obj.endFill();
    app.stage.addChild(obj);
    return obj;
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
    drawLine(x, y, x2, y2) {
      return _drawWithFill((obj) => {
        obj.moveTo(0, 0);
        obj.lineTo(x2, y2);
        obj.position.set(x, y);
        obj.closePath();
      });
    },
    drawRect(x, y, width, height) {
      return _drawWithFill((obj) => {
        obj.drawRect(0, 0, width, height);
        obj.pivot.set(width / 2, height / 2);
        obj.position.set(x, y);
      });
    },
    drawCircle(x, y, radius) {
      return _drawWithFill((obj) => {
        obj.drawCircle(0, 0, radius);
        obj.pivot.set(radius / 2, radius / 2);
        obj.position.set(x, y);
      });
    },
  };
})();
```

- [ ] **Step 5: Create `engine/stage.js`**

Create `src/components/Runner/engine/stage.js`:

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
};
```

`obj._handle` is the PIXI display object stored on the softBASIC `Sprite` or `Text` class instance.

- [ ] **Step 6: Create `engine/sprites.js`**

Create `src/components/Runner/engine/sprites.js`:

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
  createText(content, x, y) {
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#4a1850',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      wordWrap: true,
      wordWrapWidth: 440,
      lineJoin: 'round',
    });
    const text = new PIXI.Text(content, textStyle);
    text.x = x;
    text.y = y;
    return text;
  },
  setText(obj, text) {
    obj.text = text;
    obj.updateText();
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

Note: `_sbAssets` is referenced directly here — it is defined in `assets.js` which is concatenated before this file. This works because all engine files share the same script scope in the iframe.

`boxCollide` moves here from the old `_SoftBasicGfx` since it operates on display objects.

- [ ] **Step 7: Create `softBasicEngine.js`**

Create `src/components/Runner/softBasicEngine.js`:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};

document.addEventListener('keydown', (e) => {
  _sb.registerKey(e.keyCode, true);
  onkeydown(e.keyCode);
});
document.addEventListener('keyup', (e) => {
  _sb.registerKey(e.keyCode, false);
  onkeyup(e.keyCode);
});
```

- [ ] **Step 8: Update `Runner/index.tsx`**

Replace `src/components/Runner/index.tsx`:

```tsx
import sbLifecycle from './engine/lifecycle.js?raw';
import sbInput from './engine/input.js?raw';
import sbAssets from './engine/assets.js?raw';
import sbDrawing from './engine/drawing.js?raw';
import sbStage from './engine/stage.js?raw';
import sbSprites from './engine/sprites.js?raw';
import softBasicEngine from './softBasicEngine.js?raw';
import bootstrapper from './bootstrapper.html?raw';
import pixiInit from './pixiInit.js?raw';

type RunnerProps = {
  width: string;
  height: string;
  transpiled: string;
  projectId: string;
};

const Runner: React.FC<RunnerProps> = ({
  transpiled,
  projectId,
  width = '100%',
  height = '100%',
}) => {
  const engineSrc = [sbLifecycle, sbInput, sbAssets, sbDrawing, sbStage, sbSprites, softBasicEngine].join('\n');

  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        srcDoc={bootstrapper
          .replace('//${softBasicGFX}', engineSrc)
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${pixiInit}', pixiInit)}
      ></iframe>
    </div>
  );
};

export default Runner;
```

- [ ] **Step 9: Update `pixiInit.js`**

Replace `src/components/Runner/pixiInit.js`:

```js
let app = new PIXI.Application();
app
  .init({
    background: '#1099bb',
    resizeTo: window,
    width: 640,
    height: 360,
  })
  .then(() => {
    app.stage.interactive = true;
    document.body.appendChild(app.canvas);
    app.ticker.add((ticker) => _sb._update(ticker.deltaTime));
    _sb_globalOnEnter();
  });
```

The ticker is now wired here only (the old `terminationRules.ts` also wired it, causing double-fire — that is fixed in the next step).

- [ ] **Step 10: Update `terminationRules.ts`**

Replace `src/lib/Basic4WebGL/transpilerRules/terminationRules.ts`:

```typescript
import Symbols from '@CompilerLib/symbols';

export default (table: Symbols): string => {
  const classes = table
    .getAll('Module')
    .map((s) => `{name: "${s.name}", symbol: ${s.name}}`)
    .join(',');

  return `
    let _sbClasses = [${classes}];
    _sb._sbClasses = _sbClasses;

    const _sb_globalOnEnter = async () => {
      await _sb.preloadFromLocalStorage(_sbProjectId);
      _sbClasses.forEach((c) => {
        if (c.symbol.onenter) {
          c.symbol.onenter();
        }
      });
    };
  `;
};
```

Changes from old version:
- `_SoftBasicGfx.createInstance(_sbClasses)` → `_sb._sbClasses = _sbClasses`
- `_SoftAssetManager.preloadFromLocalStorage` → `_sb.preloadFromLocalStorage`
- Ticker setup removed (now lives exclusively in `pixiInit.js`)

- [ ] **Step 11: Clean up `bootstrapper.html`**

Remove the orphaned `//${assetManager}` placeholder. Replace `src/components/Runner/bootstrapper.html`:

```html
<html>
  <head>
  </head>
  <body>
  <script type="text/javascript">
  const _createArrayDim = (sizes, depth) => {
    if (depth === sizes.length - 1)
      return Array.apply(null, new Array(sizes[depth])).map(() => false);
    return Array.apply(null, new Array(sizes[depth])).map(() =>
      Array.apply(null, _createArrayDim(sizes, depth + 1))
    );
  };
  const _createArray = (sizes) => {
    return _createArrayDim(sizes, 0);
  };

  const _print = (value) => {
    console.log(value);
    if (typeof value === 'string' || typeof value === 'number') {
      window.parent.postMessage({ type: 'console.log', message: value });
      return;
    }
    try {
      const json = JSON.stringify(value);
      if (!json) {
        window.parent.postMessage({ type: 'console.log', message: 'null' });
        return;
      }
      window.parent.postMessage({ type: 'console.log', message: json });
    } catch {
      window.parent.postMessage({ type: 'console.log', message: 'null' });
    }
  };

  const _throwError = (e) => {
    window.parent.postMessage({ type: 'runtimeError', message: e.message });
    throw Error(e.message);
  };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.min.js"></script>
  <script type="text/javascript">
    //${projectId}
    try {
      //${softBasicGFX}
      //${transpiled};
      //${pixiInit}
    } catch(e) {
      _throwError(e);
    }
  </script>
  </body>
</html>
```

- [ ] **Step 12: Delete old singleton files**

```bash
rm src/components/Runner/softBasicGFX.js
rm src/components/Runner/softAssetManager.js
rm src/components/Runner/softSpriteManager.js
```

- [ ] **Step 13: Run all tests**

Run: `npx vitest run`
Expected: All 333 tests pass. The runtime restructure does not affect compiler tests — they compile softBASIC to JS but do not execute the runtime.

- [ ] **Step 14: Commit**

```bash
git add src/components/Runner/ src/lib/Basic4WebGL/transpilerRules/terminationRules.ts
git commit -m "refactor: split runtime singletons into engine/ modules composed into _sb"
```

---

## Task 2: Generator Types and Proxies

Define the TypeScript types for the descriptor system and implement the proxy factories that translate descriptor function arguments into correctly-prefixed softBASIC variable names.

**Files:**
- Create: `src/lib/Basic4WebGL/library/generator/types.ts`
- Create: `src/lib/Basic4WebGL/library/generator/proxies.ts`
- Test: `tests/lib/Basic4WebGL/unit/generator/proxies.test.ts`

- [ ] **Step 1: Write the failing proxy tests**

Create `tests/lib/Basic4WebGL/unit/generator/proxies.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { makeParamProxy, makeSelfProxy } from '../../../../src/lib/Basic4WebGL/library/generator/proxies';

describe('makeParamProxy', () => {
  test('prefixes param with lowercased function name and underscore', () => {
    const p = makeParamProxy('setPosition');
    expect(p.x).toBe('setposition_x');
  });

  test('lowercases the param name', () => {
    const p = makeParamProxy('setPosition');
    expect(p.imagePath).toBe('setposition_imagepath');
  });

  test('constructor prefix produces constructor_paramname', () => {
    const p = makeParamProxy('constructor');
    expect(p.imagePath).toBe('constructor_imagepath');
  });

  test('single-letter params work', () => {
    const p = makeParamProxy('drawLine');
    expect(p.x).toBe('drawline_x');
    expect(p.x2).toBe('drawline_x2');
  });
});

describe('makeSelfProxy — class context', () => {
  test('produces this.propname', () => {
    const self = makeSelfProxy('class', 'sprite');
    expect(self._handle).toBe('this._handle');
  });

  test('lowercases property name', () => {
    const self = makeSelfProxy('class', 'sprite');
    expect(self.MyProp).toBe('this.myprop');
  });

  test('class name has no effect on class self proxy', () => {
    const self = makeSelfProxy('class', 'anything');
    expect(self._handle).toBe('this._handle');
  });
});

describe('makeSelfProxy — module context', () => {
  test('produces modulename.propname', () => {
    const self = makeSelfProxy('module', 'audio');
    expect(self._volume).toBe('audio._volume');
  });

  test('lowercases module name', () => {
    const self = makeSelfProxy('module', 'Audio');
    expect(self._volume).toBe('audio._volume');
  });

  test('lowercases property name', () => {
    const self = makeSelfProxy('module', 'audio');
    expect(self.MyProp).toBe('audio.myprop');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/proxies.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `types.ts`**

Create `src/lib/Basic4WebGL/library/generator/types.ts`:

```typescript
export type ParamProxy = Record<string, string>;
export type SelfProxy = Record<string, string>;

export type BodyFn = (p: ParamProxy, self: SelfProxy) => string;

export interface FunctionDescriptor {
  name: string;
  params: string[];
  body?: BodyFn;    // void call — emits call("...")
  returns?: BodyFn; // value call — emits return call("...")
}

export interface ClassDescriptor {
  name: string;         // becomes filename: sprite → sprite.bas, class name: sprite
  properties: string[]; // dim declarations → ClassName.prototype.prop = undefined
  constructor?: {
    params: string[];
    body: BodyFn;     // return value is assigned to assignTo
    assignTo: string; // property name that receives the return value
  };
  methods: FunctionDescriptor[];
}

export interface ModuleDescriptor {
  name: string;          // becomes filename: stage → stage.bas, module name: stage
  properties?: string[]; // dim declarations → moduleName.prop = undefined (static)
  functions: FunctionDescriptor[];
}
```

- [ ] **Step 4: Create `proxies.ts`**

Create `src/lib/Basic4WebGL/library/generator/proxies.ts`:

```typescript
import { ParamProxy, SelfProxy } from './types';

export function makeParamProxy(fnName: string): ParamProxy {
  const prefix = fnName.toLowerCase();
  return new Proxy({} as ParamProxy, {
    get(_target, prop: string | symbol) {
      return `${prefix}_${String(prop).toLowerCase()}`;
    },
  });
}

export function makeSelfProxy(context: 'class' | 'module', name: string): SelfProxy {
  if (context === 'class') {
    return new Proxy({} as SelfProxy, {
      get(_target, prop: string | symbol) {
        return `this.${String(prop).toLowerCase()}`;
      },
    });
  }
  const moduleName = name.toLowerCase();
  return new Proxy({} as SelfProxy, {
    get(_target, prop: string | symbol) {
      return `${moduleName}.${String(prop).toLowerCase()}`;
    },
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/proxies.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/library/generator/types.ts src/lib/Basic4WebGL/library/generator/proxies.ts tests/lib/Basic4WebGL/unit/generator/proxies.test.ts
git commit -m "feat: add generator types and proxy factories"
```

---

## Task 3: Module Generator

Implement the generator that converts a `ModuleDescriptor` into a softBASIC module `.bas` file.

**Files:**
- Create: `src/lib/Basic4WebGL/library/generator/moduleGenerator.ts`
- Test: `tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { generateModule } from '../../../../src/lib/Basic4WebGL/library/generator/moduleGenerator';
import { ModuleDescriptor } from '../../../../src/lib/Basic4WebGL/library/generator/types';

const stageDescriptor: ModuleDescriptor = {
  name: 'stage',
  functions: [
    {
      name: 'add',
      params: ['obj'],
      body: (p, _self) => `_sb.addToStage(${p.obj})`,
    },
    {
      name: 'clear',
      params: [],
      body: (_p, _self) => `_sb.clear()`,
    },
  ],
};

test('does not start with Class', () => {
  const output = generateModule(stageDescriptor);
  expect(output.startsWith('Class')).toBe(false);
});

test('generates a function block for each descriptor function', () => {
  const output = generateModule(stageDescriptor);
  expect(output).toContain('function add(obj)');
  expect(output).toContain('function clear()');
  expect(output).toContain('endfunction');
});

test('function param is prefixed with functionname_', () => {
  const output = generateModule(stageDescriptor);
  expect(output).toContain('call("_sb.addToStage(add_obj)")');
});

test('body emits call(...) without return', () => {
  const output = generateModule(stageDescriptor);
  expect(output).toContain('    call("_sb.clear()")');
  expect(output).not.toContain('return call("_sb.clear()")');
});

test('returns emits return call(...)', () => {
  const desc: ModuleDescriptor = {
    name: 'gfx',
    functions: [
      {
        name: 'getKeyDown',
        params: ['keycode'],
        returns: (p, _self) => `_sb.getKeyDown(${p.keycode})`,
      },
    ],
  };
  const output = generateModule(desc);
  expect(output).toContain('return call("_sb.getKeyDown(getkeydown_keycode)")');
});

test('generates dim for module-level properties', () => {
  const desc: ModuleDescriptor = {
    name: 'audio',
    properties: ['_volume'],
    functions: [],
  };
  const output = generateModule(desc);
  expect(output).toContain('dim _volume');
});

test('module self proxy resolves to modulename.prop in call string', () => {
  const desc: ModuleDescriptor = {
    name: 'audio',
    properties: ['_volume'],
    functions: [
      {
        name: 'getVolume',
        params: [],
        returns: (_p, self) => `${self._volume}`,
      },
    ],
  };
  const output = generateModule(desc);
  expect(output).toContain('return call("audio._volume")');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `moduleGenerator.ts`**

Create `src/lib/Basic4WebGL/library/generator/moduleGenerator.ts`:

```typescript
import { ModuleDescriptor } from './types';
import { makeParamProxy, makeSelfProxy } from './proxies';

export function generateModule(descriptor: ModuleDescriptor): string {
  const { name, properties, functions } = descriptor;
  const self = makeSelfProxy('module', name);
  const lines: string[] = [];

  if (properties?.length) {
    properties.forEach((prop) => lines.push(`dim ${prop}`));
    lines.push('');
  }

  functions.forEach((fn) => {
    const params = fn.params.join(', ');
    lines.push(`function ${fn.name}(${params})`);
    const p = makeParamProxy(fn.name);
    if (fn.returns) {
      lines.push(`    return call("${fn.returns(p, self)}")`);
    } else if (fn.body) {
      lines.push(`    call("${fn.body(p, self)}")`);
    }
    lines.push('endfunction');
    lines.push('');
  });

  return lines.join('\n').trimEnd();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/library/generator/moduleGenerator.ts tests/lib/Basic4WebGL/unit/generator/moduleGenerator.test.ts
git commit -m "feat: add module .bas generator"
```

---

## Task 4: Class Generator

Implement the generator that converts a `ClassDescriptor` into a softBASIC class `.bas` file.

**Files:**
- Create: `src/lib/Basic4WebGL/library/generator/classGenerator.ts`
- Test: `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { generateClass } from '../../../../src/lib/Basic4WebGL/library/generator/classGenerator';
import { ClassDescriptor } from '../../../../src/lib/Basic4WebGL/library/generator/types';

const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'getX',
      params: [],
      returns: (_p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};

test('starts with Class keyword', () => {
  const output = generateClass(spriteDescriptor);
  expect(output.trimStart().startsWith('Class')).toBe(true);
});

test('ends with EndClass', () => {
  const output = generateClass(spriteDescriptor);
  expect(output.trimEnd().endsWith('EndClass')).toBe(true);
});

test('generates dim declaration for each property', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('dim _handle');
});

test('generates Constructor and EndConstructor blocks', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('Constructor(imagePath)');
  expect(output).toContain('EndConstructor');
});

test('constructor param is prefixed with constructor_', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('_handle = call("_sb.createSprite(constructor_imagepath)")');
});

test('class self proxy resolves to this.prop', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('this._handle');
});

test('method params are prefixed with lowercased methodname_', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('setposition_x');
  expect(output).toContain('setposition_y');
});

test('body function generates call(...) without return', () => {
  const output = generateClass(spriteDescriptor);
  const lines = output.split('\n');
  const callLine = lines.find((l) => l.includes('_sb.setPosition'));
  expect(callLine).toBeDefined();
  expect(callLine).toContain('call("');
  expect(callLine).not.toContain('return call(');
});

test('returns function generates return call(...)', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('return call("_sb.getPositionX(this._handle)")');
});

test('generates a function block for each method', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('function setPosition(x, y)');
  expect(output).toContain('function getX()');
  expect(output).toContain('function setAlpha(a)');
});

test('class without constructor omits Constructor block', () => {
  const noCtorDescriptor: ClassDescriptor = {
    name: 'simple',
    properties: ['x'],
    methods: [
      { name: 'getX', params: [], returns: (_p, self) => `${self.x}` },
    ],
  };
  const output = generateClass(noCtorDescriptor);
  expect(output).not.toContain('Constructor');
  expect(output).not.toContain('EndConstructor');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `classGenerator.ts`**

Create `src/lib/Basic4WebGL/library/generator/classGenerator.ts`:

```typescript
import { ClassDescriptor } from './types';
import { makeParamProxy, makeSelfProxy } from './proxies';

export function generateClass(descriptor: ClassDescriptor): string {
  const { name, properties, constructor: ctor, methods } = descriptor;
  const self = makeSelfProxy('class', name);
  const lines: string[] = [];

  lines.push('Class');

  properties.forEach((prop) => lines.push(`dim ${prop}`));
  lines.push('');

  if (ctor) {
    const ctorParams = ctor.params.join(', ');
    lines.push(`Constructor(${ctorParams})`);
    const p = makeParamProxy('constructor');
    lines.push(`    ${ctor.assignTo} = call("${ctor.body(p, self)}")`);
    lines.push('EndConstructor');
    lines.push('');
  }

  methods.forEach((method) => {
    const params = method.params.join(', ');
    lines.push(`function ${method.name}(${params})`);
    const p = makeParamProxy(method.name);
    if (method.returns) {
      lines.push(`    return call("${method.returns(p, self)}")`);
    } else if (method.body) {
      lines.push(`    call("${method.body(p, self)}")`);
    }
    lines.push('endfunction');
    lines.push('');
  });

  lines.push('EndClass');

  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Run all generator tests**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/generator/`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/library/generator/classGenerator.ts tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
git commit -m "feat: add class .bas generator"
```

---

## Task 5: Generator CLI Script

Wire up the generators into a CLI script and add the npm command.

**Files:**
- Create: `src/lib/Basic4WebGL/library/generator/index.ts`
- Create: `scripts/generateLibrary.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `generator/index.ts`**

Create `src/lib/Basic4WebGL/library/generator/index.ts`:

```typescript
export { generateClass } from './classGenerator';
export { generateModule } from './moduleGenerator';
export type { ClassDescriptor, ModuleDescriptor, FunctionDescriptor } from './types';
```

- [ ] **Step 2: Create `scripts/generateLibrary.ts`**

Create `scripts/generateLibrary.ts`:

```typescript
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateClass, generateModule } from '../src/lib/Basic4WebGL/library/generator/index';
import type { ClassDescriptor, ModuleDescriptor } from '../src/lib/Basic4WebGL/library/generator/types';

// Descriptors are imported directly — add new ones here as the library grows
const classDescriptors: ClassDescriptor[] = [];
const moduleDescriptors: ModuleDescriptor[] = [];

const OUT_DIR = 'src/lib/Basic4WebGL/defs';

for (const d of classDescriptors) {
  const content = generateClass(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

for (const d of moduleDescriptors) {
  const content = generateModule(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

console.log('Done.');
```

The descriptor arrays are intentionally empty now — they are populated in Task 6 as each descriptor is written.

- [ ] **Step 3: Add npm script to `package.json`**

In `package.json`, add to `"scripts"`:

```json
"generate:library": "vite-node scripts/generateLibrary.ts"
```

- [ ] **Step 4: Verify the script runs**

Run: `npm run generate:library`
Expected: `Done.` (no files generated yet — that's correct at this stage).

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/library/generator/index.ts scripts/generateLibrary.ts package.json
git commit -m "feat: add library generator CLI script"
```

---

## Task 6: Descriptors for Existing softGfx Modules

Write descriptors for the five softGfx modules whose APIs are not changing (`gfx`, `drawing`, `pen`, `assetmanager`) and one that is (`stage`). Run the generator to produce new `.bas` files. Verify all existing tests pass.

**Files:**
- Create: all `src/lib/Basic4WebGL/library/descriptors/*.descriptor.ts`
- Modify: `scripts/generateLibrary.ts` (populate descriptor arrays)
- Overwrite (generated): `gfx.bas`, `drawing.bas`, `stage.bas`, `pen.bas`, `assetmanager.bas`

- [ ] **Step 1: Create `stage.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/stage.descriptor.ts`:

```typescript
import { ModuleDescriptor } from '../generator/types';

export const stageDescriptor: ModuleDescriptor = {
  name: 'stage',
  functions: [
    {
      name: 'add',
      params: ['obj'],
      body: (p, _self) => `_sb.addToStage(${p.obj})`,
    },
    {
      name: 'remove',
      params: ['obj'],
      body: (p, _self) => `_sb.removeFromStage(${p.obj})`,
    },
    {
      name: 'clear',
      params: [],
      body: (_p, _self) => `_sb.clear()`,
    },
  ],
};
```

- [ ] **Step 2: Create `gfx.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts`:

```typescript
import { ModuleDescriptor } from '../generator/types';

export const gfxDescriptor: ModuleDescriptor = {
  name: 'gfx',
  functions: [
    {
      name: 'boxCollide',
      params: ['a', 'b'],
      returns: (p, _self) => `_sb.boxCollide(${p.a}, ${p.b})`,
    },
    {
      name: 'getKeyDown',
      params: ['keycode'],
      returns: (p, _self) => `_sb.getKeyDown(${p.keycode})`,
    },
  ],
};
```

- [ ] **Step 3: Create `drawing.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`:

```typescript
import { ModuleDescriptor } from '../generator/types';

export const drawingDescriptor: ModuleDescriptor = {
  name: 'drawing',
  functions: [
    {
      name: 'drawLine',
      params: ['x', 'y', 'x2', 'y2'],
      body: (p, _self) => `_sb.drawLine(${p.x}, ${p.y}, ${p.x2}, ${p.y2})`,
    },
    {
      name: 'drawRect',
      params: ['x', 'y', 'width', 'height'],
      body: (p, _self) => `_sb.drawRect(${p.x}, ${p.y}, ${p.width}, ${p.height})`,
    },
    {
      name: 'drawCircle',
      params: ['x', 'y', 'radius'],
      body: (p, _self) => `_sb.drawCircle(${p.x}, ${p.y}, ${p.radius})`,
    },
  ],
};
```

- [ ] **Step 4: Create `pen.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/pen.descriptor.ts`:

```typescript
import { ModuleDescriptor } from '../generator/types';

export const penDescriptor: ModuleDescriptor = {
  name: 'pen',
  functions: [
    {
      name: 'setFillColor',
      params: ['r', 'g', 'b'],
      body: (p, _self) => `_sb.setFillColor(${p.r}, ${p.g}, ${p.b})`,
    },
    {
      name: 'setLineColor',
      params: ['r', 'g', 'b'],
      body: (p, _self) => `_sb.setLineColor(${p.r}, ${p.g}, ${p.b})`,
    },
  ],
};
```

- [ ] **Step 5: Create `assetmanager.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts`:

```typescript
import { ModuleDescriptor } from '../generator/types';

export const assetmanagerDescriptor: ModuleDescriptor = {
  name: 'assetmanager',
  functions: [
    {
      name: 'loadImage',
      params: ['name'],
      returns: (p, _self) => `_sb.get(${p.name})`,
    },
  ],
};
```

- [ ] **Step 6: Create `sprite.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`:

```typescript
import { ClassDescriptor } from '../generator/types';

export const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'getX',
      params: [],
      returns: (_p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'getY',
      params: [],
      returns: (_p, self) => `_sb.getPositionY(${self._handle})`,
    },
    {
      name: 'setAngle',
      params: ['angle'],
      body: (p, self) => `_sb.setAngle(${self._handle}, ${p.angle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};
```

- [ ] **Step 7: Create `text.descriptor.ts`**

Create `src/lib/Basic4WebGL/library/descriptors/text.descriptor.ts`:

```typescript
import { ClassDescriptor } from '../generator/types';

export const textDescriptor: ClassDescriptor = {
  name: 'text',
  properties: ['_handle'],
  constructor: {
    params: ['content', 'x', 'y'],
    body: (p, _self) => `_sb.createText(${p.content}, ${p.x}, ${p.y})`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setText',
      params: ['content'],
      body: (p, self) => `_sb.setText(${self._handle}, ${p.content})`,
    },
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};
```

- [ ] **Step 8: Populate `scripts/generateLibrary.ts`**

Replace `scripts/generateLibrary.ts` with the fully-wired version:

```typescript
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateClass, generateModule } from '../src/lib/Basic4WebGL/library/generator/index';
import type { ClassDescriptor, ModuleDescriptor } from '../src/lib/Basic4WebGL/library/generator/types';
import { spriteDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/sprite.descriptor';
import { textDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/text.descriptor';
import { stageDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/stage.descriptor';
import { gfxDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/gfx.descriptor';
import { drawingDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/drawing.descriptor';
import { penDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/pen.descriptor';
import { assetmanagerDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor';

const classDescriptors: ClassDescriptor[] = [
  spriteDescriptor,
  textDescriptor,
];

const moduleDescriptors: ModuleDescriptor[] = [
  stageDescriptor,
  gfxDescriptor,
  drawingDescriptor,
  penDescriptor,
  assetmanagerDescriptor,
];

const OUT_DIR = 'src/lib/Basic4WebGL/defs';

for (const d of classDescriptors) {
  const content = generateClass(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

for (const d of moduleDescriptors) {
  const content = generateModule(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

console.log('Done.');
```

- [ ] **Step 9: Run the generator**

Run: `npm run generate:library`
Expected output:
```
Generated sprite.bas
Generated text.bas
Generated stage.bas
Generated gfx.bas
Generated drawing.bas
Generated pen.bas
Generated assetmanager.bas
Done.
```

- [ ] **Step 10: Verify generated file content**

Spot-check the generated files:

`src/lib/Basic4WebGL/defs/sprite.bas` should start with:
```
Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagepath)")
EndConstructor
```

`src/lib/Basic4WebGL/defs/stage.bas` should contain:
```
function add(obj)
    call("_sb.addToStage(add_obj)")
endfunction
```

`src/lib/Basic4WebGL/defs/gfx.bas` should contain (correct prefixed names, fixing the existing bug):
```
function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
endfunction
```

- [ ] **Step 11: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. The compiler tests use `lib: []` so do not exercise the library `.bas` files directly.

- [ ] **Step 12: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/ scripts/generateLibrary.ts src/lib/Basic4WebGL/defs/
git commit -m "feat: add library descriptors and generate sprite, text, and module .bas files"
```

---

## Task 7: Compiler Integration Tests for Sprite and Text Classes

Verify the generated `sprite.bas` and `text.bas` compile correctly end-to-end through the softBASIC compiler, and that instance method calls on class variables work.

**Files:**
- Create: `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts`
- Create: `tests/lib/Basic4WebGL/integration/transpiler/textClass.test.ts`

- [ ] **Step 1: Write Sprite integration tests**

Create `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const spriteLib = {
  name: 'sprite',
  source: readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8'),
};

describe('Sprite class — instantiation', () => {
  test('dim as sprite with constructor arg compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('newsprite(');
  });
});

describe('Sprite class — instance methods', () => {
  test('setPosition call on sprite instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setPosition(100, 200)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('setposition(100,200)');
  });

  test('getX on sprite instance compiles and has return', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim x',
      '    x = s.getX()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('getx()');
  });

  test('setAlpha on sprite instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setAlpha(0.5)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
  });
});

describe('Sprite class — _handle in method body', () => {
  test('sprite.bas setPosition emits this._handle in call string', () => {
    expect(spriteLib.source).toContain('this._handle');
  });

  test('sprite.bas constructor assigns _handle', () => {
    expect(spriteLib.source).toContain('_handle = call("_sb.createSprite(constructor_imagepath)")');
  });
});
```

- [ ] **Step 2: Write Text integration tests**

Create `tests/lib/Basic4WebGL/integration/transpiler/textClass.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const textLib = {
  name: 'text',
  source: readFileSync('src/lib/Basic4WebGL/defs/text.bas', 'utf-8'),
};

describe('Text class — instantiation', () => {
  test('dim as text with constructor args compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('newtext(');
  });
});

describe('Text class — instance methods', () => {
  test('setText on text instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      '    label.setText("World")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('settext(');
  });

  test('setPosition on text instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      '    label.setPosition(50, 100)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
  });
});

describe('Text class — _handle in method body', () => {
  test('text.bas setText emits this._handle in call string', () => {
    expect(textLib.source).toContain('this._handle');
  });

  test('text.bas constructor assigns _handle', () => {
    expect(textLib.source).toContain('_handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")');
  });
});
```

- [ ] **Step 3: Run the new tests**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts tests/lib/Basic4WebGL/integration/transpiler/textClass.test.ts`

If tests pass: move to Step 4.

If tests fail on instance method calls (e.g. `s.setPosition(100, 200)` produces a compiler error), the parser does not yet support calling methods on instance variables. In that case:
- Read `src/lib/Basic4WebGL/parserRules/rules/Expressions/ModuleFactorRule.ts` and related call rules
- The fix requires the parser to recognise a dotted call site where the left-hand side is a class instance variable (not a module name) and emit the prefixed instance reference
- This is a compiler bug fix that belongs in this task before continuing

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts tests/lib/Basic4WebGL/integration/transpiler/textClass.test.ts
git commit -m "test: add compiler integration tests for Sprite and Text classes"
```

---

## Task 8: Update softGfx Package + Delete Old Files

Update the `softGfx` package to use the new module list, bump the version to trigger re-seeding, and delete the now-superseded `.bas` and `.ts` files.

**Files:**
- Modify: `src/constants/firstPartyPackages.ts`
- Delete: `src/lib/Basic4WebGL/defs/spritemanager.bas`, `src/lib/Basic4WebGL/defs/transform.bas`

- [ ] **Step 1: Update `firstPartyPackages.ts`**

Replace `src/constants/firstPartyPackages.ts`:

```typescript
import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.0.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'drawing', 'stage', 'pen', 'assetmanager', 'sprite', 'text'],
  },
];
```

Changes: `version` bumps to `'2.0.0'` (triggers re-seeding for existing users). `moduleNames` removes `transform` and `spritemanager`, adds `sprite`, keeps `text` (now a class).

- [ ] **Step 2: Update `packageModules.ts`**

`src/constants/packageModules.ts` currently imports from `spritemanager.bas` and `transform.bas`. Replace it:

```typescript
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import sprite from '../lib/Basic4WebGL/defs/sprite.bas?raw';

export const packageModules: Record<string, string> = {
  math,
  string,
  array,
  gfx,
  drawing,
  stage,
  pen,
  text,
  assetmanager,
  sprite,
};
```

- [ ] **Step 3: Delete old `.bas` files**

```bash
rm src/lib/Basic4WebGL/defs/spritemanager.bas
rm src/lib/Basic4WebGL/defs/transform.bas
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. The `packagesSlice` tests will continue to pass because they use `firstPartyPackages` which now has the updated list, and `seedPackages` is idempotent.

- [ ] **Step 5: Commit**

```bash
git add src/constants/firstPartyPackages.ts src/constants/packageModules.ts
git commit -m "feat: update softGfx package to v2.0.0 with sprite/text classes, remove spritemanager and transform"
```

---

## Task 9: Documentation Maintenance

Update all three documentation files as specified in the design spec. These changes are required — not optional follow-up.

**Files:**
- Modify: `docs/language/softbasic-concepts.md`
- Modify: `docs/language/library-roadmap.md`
- Modify: `docs/outstanding-issues.md`

- [ ] **Step 1: Update `softbasic-concepts.md`**

Make these changes to `docs/language/softbasic-concepts.md`:

**Remove the stale class limitation note.** Find and delete the paragraph:
> "Current limitation: Instance methods that read or write class-level properties work correctly when accessed via the object reference (e.g. `myCar.health`). Methods that attempt to use bare property names inside the method body may not resolve correctly in all cases. Access via the object reference is the safe pattern."

The implementation correctly emits `this.property` for bare property access inside class methods. This caveat is inaccurate.

**Update the Packages section module list.** Replace the softGfx modules table row:

Before: `softGfx  | Yes | gfx, drawing, stage, pen, text, transform, assetmanager, spritemanager`

After: `softGfx  | Yes | gfx, drawing, stage, pen, assetmanager, sprite, text`

**Replace the Built-in Modules section.** Remove entries for `assetmanager` (standalone), `spritemanager`, `transform`, and the module-style `text`. Add:

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

```basic
dim bunny as Sprite("bunny.png")
bunny.setPosition(100, 200)
stage.add(bunny)
```

### `Text`

A display object wrapping a PIXI text node.

| Method | Signature | Description |
|---|---|---|
| Constructor | `Text(content, x, y)` | Creates a text object at position |
| `setText` | `(content)` | Updates the displayed string |
| `setPosition` | `(x, y)` | Moves the text object |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |

```basic
dim label as Text("Score: 0", 10, 10)
label.setText("Score: 100")
stage.add(label)
```

### `stage`

| Function | Description |
|---|---|
| `stage.add(obj)` | Adds a display object to the stage |
| `stage.remove(obj)` | Removes a display object from the stage |
| `stage.clear()` | Removes all display objects |

### `gfx`

| Function | Description |
|---|---|
| `gfx.boxCollide(a, b)` | Returns true if two objects' bounding boxes overlap |
| `gfx.getKeyDown(keycode)` | Returns true if the key is currently held |

### `drawing`

| Function | Description |
|---|---|
| `drawing.drawLine(x, y, x2, y2)` | Draw a line |
| `drawing.drawRect(x, y, width, height)` | Draw a rectangle |
| `drawing.drawCircle(x, y, radius)` | Draw a circle |

### `pen`

Controls fill and stroke style for drawing primitives.

| Function | Description |
|---|---|
| `pen.setFillColor(r, g, b)` | Set fill colour (0–255 per channel) |
| `pen.setLineColor(r, g, b)` | Set stroke colour |

### `assetmanager`

| Function | Description |
|---|---|
| `assetmanager.loadImage(name)` | Returns a cached texture for use in manual sprite creation |

`assetmanager.loadImage` is optional — `Sprite` loads its own texture automatically.
```

**Update the Typical Scene Setup example:**

Replace:
```basic
' bunny.bas
dim bunnysprite

function onenter()
    dim bunnyimage
    bunnyimage = assetmanager.loadimage("bunny.png")
    bunnysprite = spritemanager.create("bunny", bunnyimage)
    stage.registerNode("bunny")
endfunction
```

With:
```basic
' bunny.bas
dim bunnysprite

function onenter()
    bunnysprite = sprite("bunny.png")  ' or: dim bunnysprite as Sprite("bunny.png")
    stage.add(bunnysprite)
endfunction

function onupdate()
    bunnysprite.setPosition(100, 200)
endfunction
```

- [ ] **Step 2: Update `library-roadmap.md`**

- In **Current State — Existing modules** table: replace old module list with new classes and modules matching the softGfx v2.0.0 module list
- In **Key File Locations** table: add `engine/` subdirectory row, add descriptor files row, add generator script row; remove the three old singleton file entries
- In **Priorities**: mark P3 as `**[DONE]**`

- [ ] **Step 3: Update `outstanding-issues.md`**

Review all five issues and remove or update any resolved by this work:
- Issue 1 (delegation-only parser loc propagation) — unaffected, keep
- Issue 2 (stray `}` in UnexpectedError) — unaffected, keep
- Issue 3 (no test for PrintNode.validate loc) — unaffected, keep
- Issue 4 (new Tree() bypasses loc) — unaffected, keep
- Issue 5 (file load order) — unaffected, keep

Add a note at the bottom: *Updated 2026-05-24 — library architecture refactor landed. P3 complete.*

- [ ] **Step 4: Run all tests one final time**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add docs/language/softbasic-concepts.md docs/language/library-roadmap.md docs/outstanding-issues.md
git commit -m "docs: update language reference and library roadmap for v2.0.0 library architecture"
```

---

## Final Check

- [ ] Run: `npx vitest run` — all tests pass, no regressions
- [ ] Run: `npm run generate:library` — all 7 files regenerate without error
- [ ] Verify: `grep -r "spritemanager\|_SoftBasicGfx\|_SoftAssetManager\|_SoftSpriteManager" src/` — no matches (old references fully removed)
- [ ] Verify: `grep -r "projectLib\|registerNode" src/` — no matches
