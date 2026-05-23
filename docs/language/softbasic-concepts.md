# softBASIC Language Concepts

> Living reference document. Add to this as new behaviours are confirmed.

---

## Files and Modules

Every `.bas` file is a **module** by default. A module is a static class — all its variables and functions belong to the type itself, not to instances. There is no instantiation. Think of a module like a VB6 `.bas` module or a C# `static class`.

```basic
' File: bunny.bas — automatically a module named "bunny"
dim bunnysprite

function onenter()
    bunnysprite = spritemanager.create("bunny", bunnyimage)
endfunction
```

Transpiles to:

```js
class bunny {}
bunny.bunnysprite = undefined;
bunny.onenter = () => { ... };
```

The module name is derived from the filename (lowercase).

---

## Classes

If a file is explicitly defined as a **class** (mechanism TBD — not yet confirmed in codebase), variables are attached to the prototype instead, enabling multiple instances.

| Concept | Variable declaration | Transpiled form |
|---|---|---|
| Module (static) | `dim x` at top level | `moduleName.x = undefined` |
| Class (instance) | `dim x` at top level | `className.prototype.x = undefined` |

> **Note:** The distinction is tracked via `scope.type` (`'Module'` vs `'Class'`) in the symbol table. The Class branch exists in the transpiler but the softBASIC syntax to declare a class file is not yet documented.

---

## Variable Scoping

Variables are declared with `dim`. The scope of the declaration determines the transpiled format.

### Module-level variables

Declared at the top of a file (outside any function). Become static properties of the module.

```basic
' bunny.bas
dim bunnysprite      ' → bunny.bunnysprite = undefined
dim score            ' → bunny.score = undefined
```

### Function-local variables

Declared inside a `function`/`endfunction` block. Become local variables prefixed with the function name and an underscore.

```basic
function onenter()
    dim bunnyimage   ' → onenter_bunnyimage = undefined
    dim counter      ' → onenter_counter = undefined
endfunction
```

The underscore prefix avoids collisions when multiple functions declare variables with the same name.

### Summary table

| Where declared | Format | Example |
|---|---|---|
| Module top-level | `moduleName.varName` | `bunny.score` |
| Class top-level | `className.prototype.varName` | `Dog.prototype.name` |
| Inside a function | `functionName_varName` | `onenter_bunnyimage` |

---

## Functions

Functions are declared with `function`/`endfunction`. They become static arrow functions on the module.

```basic
function sayhello()
    print "Hello!"
endfunction
```

Transpiles to:

```js
main.sayhello = () => { _print("Hello!"); };
```

### Parameters

Parameters use the same `functionName_paramName` underscore format as function-local variables.

```basic
function greet(name)
    print name
endfunction
```

Transpiles to (parameter `name` accessed as `greet_name`):

```js
main.greet = (greet_name) => { _print(greet_name); };
```

### Return values

```basic
function double(n)
    return n * 2
endfunction
```

---

## Lifecycle Functions

### `onenter()`

The entry point for a module. Called once when the scene starts. Equivalent to `Start()` in Unity or `_ready()` in Godot.

```basic
function onenter()
    ' initialise sprites, load assets, register nodes
endfunction
```

### `onupdate()` / ticker

The game loop hook. Not yet confirmed — driven by PIXI's `ticker.add(delta => ...)` in the runtime wrapper.

---

## Multi-file / Multi-module Projects

Multiple `.bas` files can be added to a project. Each becomes a module. Modules call each other using dot notation: `moduleName.functionName()`.

```basic
' talk.bas
function sayhello()
    print "Hello!"
endfunction
```

```basic
' main.bas
function onenter()
    talk.sayhello()
endfunction
```

The order modules are registered in `_sbClasses` follows the order files were added to the project.

---

## Control Flow

### If / EndIf

```basic
if x == 10
    print "ten"
endif
```

### While / EndWhile

```basic
while x < 10
    x = x + 1
endwhile
```

### For / Next

```basic
for i = 0 to 9
    print i
next
```

---

## Built-in Modules

These are provided by the runtime and available without import. Each maps to an underlying PIXI.js / runtime API.

### `assetmanager`

Load assets that were uploaded to the project.

| Function | Description |
|---|---|
| `assetmanager.loadimage(name)` | Returns a texture loaded from project assets |

```basic
dim img
img = assetmanager.loadimage("bunny.png")
```

### `spritemanager`

Create and manage PIXI sprites.

| Function | Description |
|---|---|
| `spritemanager.create(name, texture)` | Creates a sprite with the given name and texture, returns the sprite object |

```basic
dim sprite
sprite = spritemanager.create("bunny", img)
```

### `stage`

Register and manage display nodes.

| Function | Description |
|---|---|
| `stage.registerNode(nodeName)` | Adds the named sprite to the display stage |
| `stage.clear()` | Clears all nodes from the stage |

```basic
stage.registerNode("bunny")
```

### `transform`

Move and rotate objects.

| Function | Description |
|---|---|
| `transform.setPosition(obj, x, y)` | Set x/y position of an object |
| `transform.getPositionX(obj)` | Get x position |
| `transform.getPositionY(obj)` | Get y position |
| `transform.setAngle(obj, angle)` | Set rotation angle |

### `drawing`

Draw primitive shapes.

| Function | Description |
|---|---|
| `drawing.drawLine(x, y, x2, y2)` | Draw a line |
| `drawing.drawRect(x, y, width, height)` | Draw a rectangle |
| `drawing.drawCircle(x, y, radius)` | Draw a circle |

### `pen`

Control fill and stroke style for drawing.

| Function | Description |
|---|---|
| `pen.setFillColor(r, g, b)` | Set fill colour (0–255) |
| `pen.setLineColor(r, g, b)` | Set stroke colour |
| `pen.setAlpha(obj, a)` | Set opacity (0.0–1.0) |

### `text`

Draw and update text objects.

| Function | Description |
|---|---|
| `text.drawText(s, x, y)` | Create a text object at position |
| `text.setText(obj, text)` | Update an existing text object's content |

### `math`

Standard maths functions (delegates to `Math.*`).

`abs`, `acos`, `asin`, `atan`, `atan2`, `ceil`, `cos`, `floor`, `log`, `log2`, `log10`, `pi`, `pow`, `random`, `round`, `sin`, `sqrt`, `tan`, `trunc`, `val`

```basic
dim angle
angle = math.atan2(dy, dx)
```

### `string`

String utility functions.

| Function | Description |
|---|---|
| `string.len(s)` | String length |
| `string.lcase(s)` | Lowercase |
| `string.ucase(s)` | Uppercase |
| `string.str(n)` | Number to string |
| `string.substr(s, start, end)` | Substring |
| `string.split(s, c)` | Split by character |
| `string.trim(s)` | Trim whitespace |

### `gfx`

Top-level graphics helpers.

| Function | Description |
|---|---|
| `gfx.boxCollide(a, b)` | Returns true if two objects' bounding boxes overlap |
| `gfx.getKeyDown(keycode)` | Returns true if the key is currently held |

---

## `print` Statement

Outputs to the IDE console (BottomPanel).

```basic
print "Hello, World!"
print score
```

---

## `call()` — Raw JavaScript Escape Hatch

Used internally by built-in library definitions to inject raw JavaScript. Not intended for user code.

```basic
return call("Math.abs(abs_n)")
```

---

## Typical Scene Setup (Sprite Example)

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

- `bunnysprite` is a module-level variable → `bunny.bunnysprite`
- `bunnyimage` is function-local → `onenter_bunnyimage` (temporary, only needed during setup)
- `spritemanager.create` returns the sprite handle stored at module level so it can be accessed in `onupdate`

---

## Known Gaps / To Document

- How to explicitly declare a file as a Class (vs default Module)
- `onupdate()` / game loop lifecycle hook
- Array declarations: `dim arr(10)` syntax and transpiled form
- Whether `print` accepts multiple arguments / expressions
- String concatenation syntax
- Comparison operators: `==`, `!=`, `<`, `>`, `<=`, `>=` (inferred from conditionals tests)
- Boolean operators: `and`, `or`, `not` (inferred from parser rules)
