# Library Architecture Design Spec

**Goal:** Replace the three uncoordinated runtime singletons with a single `_sb` engine object, eliminate fragile hand-written `call()` strings via a TypeScript descriptor + generator system, and redesign the softGfx API surface around class instances for stateful objects — establishing a stable, extensible pattern for all future library systems.

**Tech Stack:** TypeScript, softBASIC (`.bas`), Vite `?raw` imports, Vitest.

---

## Background

Three problems drive this redesign:

1. **Uncoordinated runtime singletons.** `_SoftBasicGfx`, `_SoftAssetManager`, and `_SoftSpriteManager` are injected into the sandboxed iframe independently with no shared contract. Adding new runtime behaviour means touching multiple files with no clear ownership boundary.

2. **Fragile `call()` string templates.** Library `.bas` files hand-write raw JavaScript strings with transpiler-prefixed variable names (e.g. `"Math.abs(abs_n)"`). The author must know that the transpiler prefixes parameter `n` in function `abs` as `abs_n`, and must update the string manually if they rename anything. There is no tooling to catch mistakes.

3. **Module-per-concern API is verbose.** Creating and placing a sprite requires three module calls across three separate modules (`assetmanager`, `spritemanager`, `transform`, `stage`), with a string-name lookup connecting them. The cognitive load is high relative to the simplicity of the task.

---

## Design Decisions

### Modules can have properties

Modules are static classes. `dim` at module level is valid and the descriptor system supports it. The distinction between a `ClassDescriptor` and a `ModuleDescriptor` is not the presence of properties but how `self` resolves in the generated call string:

- **Class** — `self.prop` → `this.prop` (instance context)
- **Module** — `self.prop` → `moduleName.prop` (static context)

### No inheritance

`setAlpha` is a method on each class that needs it (`Sprite`, `Text`, and any future drawable type). The duplication is one line per descriptor. It is far simpler than designing inheritance or a mixin system into the language and we accept it.

---

## Section 1: Runtime Unification

The three singletons (`_SoftBasicGfx`, `_SoftAssetManager`, `_SoftSpriteManager`) are replaced by a single `_sb` engine object. The three JS files collapse into one entry point (`softBasicEngine.js`) that composes focused domain modules.

### File structure

```
src/components/Runner/
  engine/
    sprites.js      ← createSprite, setPosition, getPositionX/Y, setAngle, setAlpha
    drawing.js      ← drawLine, drawRect, drawCircle, setFillColor, setLineColor
    input.js        ← getKeyDown (keyboard state; future: mouse, touch)
    assets.js       ← texture loading and caching
    stage.js        ← addToStage, removeFromStage, clear
    lifecycle.js    ← onenter/onupdate wiring, PIXI ticker
  softBasicEngine.js   ← composes engine/* into _sb, injected into iframe
```

`softBasicEngine.js` stays thin — it composes the domain modules into `_sb` and exposes nothing else:

```js
// composition mechanism (IIFE, ES modules, or concatenation) to be confirmed
// during implementation based on how the iframe loads scripts
const _sb = { ...sprites, ...drawing, ...input, ...assets, ...stage, ...lifecycle };
```

**Implementation note:** The exact composition mechanism (ES module imports with `type="module"`, IIFE pattern, or build-time concatenation) depends on how `bootstrapper.html` loads scripts into the sandboxed iframe. This is an implementation decision — the design only requires that all domain module methods are available on a single `_sb` object.

`pixiInit.js` and `bootstrapper.html` are structurally unchanged. `_sb` is injected into the iframe in the same way the three singletons were previously.

### Sprite creation simplification

`_sb.createSprite(imagePath)` handles texture loading and PIXI sprite construction in one call, returning the PIXI sprite object directly as the handle. The old string-name lookup system (`registerNode("bunny")`) is removed.

The softBASIC module function `stage.add(obj)` calls `_sb.addToStage(add_obj)` on the runtime. The runtime receives the softBASIC `Sprite` class instance and accesses `instance._handle` (the underlying PIXI object) to add it to the display list.

### Adding future systems

Adding a new domain (e.g. audio) means:
1. Create `engine/audio.js`
2. Spread it into `_sb` in `softBasicEngine.js`
3. Write a descriptor and generate the `.bas` file

Nothing else changes.

---

## Section 2: Descriptor + Generator System

A TypeScript descriptor system generates library `.bas` files, eliminating all hand-written `call()` strings. The generated files are committed to the repo and loaded via Vite `?raw` as today — no new build-time pipeline.

### File structure

```
src/lib/Basic4WebGL/library/
  descriptors/
    sprite.descriptor.ts
    text.descriptor.ts
    stage.descriptor.ts
    gfx.descriptor.ts
    drawing.descriptor.ts
    pen.descriptor.ts
    assetmanager.descriptor.ts
  generator/
    index.ts          ← entry point: reads descriptors, writes .bas files
    classGenerator.ts ← generates Class .bas files from ClassDescriptor
    moduleGenerator.ts← generates module .bas files from ModuleDescriptor
    proxies.ts        ← param and self proxy factories
    types.ts          ← ClassDescriptor, ModuleDescriptor, MethodDescriptor types
scripts/
  generateLibrary.ts  ← CLI entry, runs generator and writes to defs/
```

Run via: `npm run generate:library`

### Descriptor types

```typescript
interface FunctionDescriptor {
  name: string;
  params: string[];
  body?:    (p: ParamProxy, self: SelfProxy) => string; // void call
  returns?: (p: ParamProxy, self: SelfProxy) => string; // returns a value
}

interface ClassDescriptor {
  name: string;            // filename: sprite.bas, class: sprite
  properties: string[];    // dim declarations → ClassName.prototype.prop
  constructor?: {
    params: string[];
    body:     (p: ParamProxy, self: SelfProxy) => string;
    assignTo: string;      // which property receives the return value
  };
  methods: FunctionDescriptor[];
}

interface ModuleDescriptor {
  name: string;            // filename: stage.bas, module: stage
  properties?: string[];   // dim declarations → moduleName.prop (static)
  functions: FunctionDescriptor[];
}
```

### Proxy resolution rules

The generator calls each body/returns function with proxies that apply the transpiler's naming conventions automatically.

| Context | `p.paramName` resolves to | `self.propName` resolves to |
|---|---|---|
| Class constructor | `constructor_paramname` | `this.propname` |
| Class method | `methodname_paramname` | `this.propname` |
| Module function | `functionname_paramname` | `modulename.propname` |

All names are lowercased before prefixing, matching the transpiler's behaviour.

### Example descriptor and output

```typescript
// sprite.descriptor.ts
export const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body:     (p, self) => `_sb.createSprite(${p.imagePath})`,
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
      returns: (p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};
```

Generated `sprite.bas`:

```
Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagepath)")
EndConstructor

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function getX()
    return call("_sb.getPositionX(this._handle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

EndClass
```

### Test coverage note

Verify that existing tests cover module-level property access inside module function bodies (i.e. a module `dim` variable referenced in a `call()` string correctly resolves to `moduleName.prop` in transpiled output). Add tests if this case is not covered.

---

## Section 3: API Surface

### New classes

**`Sprite`** (`sprite.bas`) — replaces `spritemanager` + `transform` for sprite objects:

| Method | Signature |
|---|---|
| Constructor | `Sprite(imagePath)` |
| `setPosition` | `(x, y)` |
| `getX` | `()` → number |
| `getY` | `()` → number |
| `setAngle` | `(angle)` |
| `setAlpha` | `(a)` |

**`Text`** (`text.bas`) — replaces `text` module:

| Method | Signature |
|---|---|
| Constructor | `Text(content, x, y)` |
| `setText` | `(content)` |
| `setPosition` | `(x, y)` |
| `setAlpha` | `(a)` |

Both classes store `_handle` — the underlying PIXI object. `stage.add(obj)` receives the class instance and the runtime accesses `._handle` internally.

### Modules that remain

| Module | Changes | Functions |
|---|---|---|
| `stage` | `registerNode(name)` → `add(obj)`; add `remove(obj)` | `add(obj)`, `remove(obj)`, `clear()` |
| `gfx` | None | `boxCollide(a, b)`, `getKeyDown(keycode)` |
| `drawing` | None | `drawLine(x,y,x2,y2)`, `drawRect(x,y,w,h)`, `drawCircle(x,y,r)` |
| `pen` | `setAlpha` removed (moves to classes) | `setFillColor(r,g,b)`, `setLineColor(r,g,b)` |
| `assetmanager` | None | `loadImage(name)` |
| `math` | None | unchanged |
| `string` | None | unchanged |
| `array` | None | unchanged |

`pen` is now purely about drawing context for the `drawing` module's primitives.

### Modules removed

| Module | Reason |
|---|---|
| `spritemanager` | Replaced by `Sprite` class constructor |
| `transform` | Methods move to `Sprite` and `Text` classes |
| `text` (module) | Replaced by `Text` class |

### softGfx package module list

**Before:**
```
['gfx', 'drawing', 'stage', 'pen', 'text', 'transform', 'assetmanager', 'spritemanager']
```

**After:**
```
['gfx', 'drawing', 'stage', 'pen', 'assetmanager', 'sprite', 'text']
```

The softGfx package version bumps to `2.0.0` to trigger re-seeding for existing users.

### Breaking changes

| Old | New |
|---|---|
| `spritemanager.create("name", img)` | `dim s as Sprite("bunny.png")` |
| `transform.setPosition(s, x, y)` | `s.setPosition(x, y)` |
| `transform.getPositionX(s)` | `s.getX()` |
| `transform.getPositionY(s)` | `s.getY()` |
| `transform.setAngle(s, a)` | `s.setAngle(a)` |
| `pen.setAlpha(s, a)` | `s.setAlpha(a)` |
| `stage.registerNode("name")` | `stage.add(s)` |
| `text.drawText(str, x, y)` | `dim t as Text(str, x, y)` |
| `text.setText(obj, str)` | `t.setText(str)` |

Breaking changes are acceptable at this stage of the project.

### Before and after comparison

**Before:**
```basic
function onenter()
    dim img
    img = assetmanager.loadimage("bunny.png")
    dim bunnysprite
    bunnysprite = spritemanager.create("bunny", img)
    stage.registernode("bunny")
    transform.setposition(bunnysprite, 100, 200)
endfunction
```

**After:**
```basic
function onenter()
    dim bunny as Sprite("bunny.png")
    bunny.setPosition(100, 200)
    stage.add(bunny)
endfunction
```

---

## Section 4: Pattern for Future Systems

Every new library system follows the same four steps:

1. **Add `engine/<system>.js`** — runtime implementation; spread into `_sb` in `softBasicEngine.js`
2. **Write `<system>.descriptor.ts`** — `ClassDescriptor` for stateful/instance objects, `ModuleDescriptor` for stateless/procedural APIs
3. **Run `npm run generate:library`** — produces the `.bas` file
4. **Add the module name to the appropriate package's `moduleNames`** — compiler picks it up automatically

**Choosing descriptor type per system:**

| New system | Descriptor type | Rationale |
|---|---|---|
| Audio | `ModuleDescriptor` | `audio.load("jump")`, `audio.play("jump")` — stateless dispatch |
| Mouse/touch input | `ModuleDescriptor` | `input.mouseX()`, `input.mouseDown(0)` — stateless query |
| Camera | `ModuleDescriptor` | `camera.follow(sprite)`, `camera.setZoom(1.5)` — one global camera |
| Shapes (retained drawing) | `ClassDescriptor` | `dim r as Rectangle(x,y,w,h)` — stateful, positioned object |
| Scene | `ModuleDescriptor` | `scene.go("menu")` — global scene manager |

The compiler is untouched by any of this. It continues to receive `ProjectFile[]` and knows nothing about packages, descriptors, or the runtime.

---

## Out of Scope

- **User-authored packages** — no mechanism for users to publish library modules; this is a future subproject
- **Type signatures for library functions** — all library functions remain `Variant → Variant` in the symbol table; typed signatures are a future compiler enhancement
- **Inheritance / mixins** — the duplication of `setAlpha` across classes is accepted as the cost of language simplicity
- **Spritesheet / animation** — `Sprite` in this design is a static sprite; animated sprites are P7 and will extend this class design
- **Canvas size configuration** — 640×360 remains hardcoded; this is a separate concern
