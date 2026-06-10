# softBASIC Language Concepts

> Living reference document. Add to this as new behaviours are confirmed.

---

## Vision

**The most BASIC way to publish a game.**

softBASIC is not a competitor to Unity or Godot. It is not a full game engine. It is a stepping stone — a deliberately streamlined environment where the concepts you need to build simple to mid-sized 2D games are available with minimal code and no boilerplate overhead.

The benchmark for every language and library decision is: *does this make publishing a game simpler, or does it add friction?* If it adds friction without a clear payoff, it does not belong in the core language.

**What this means in practice:**

- A working game should be expressible in a handful of lines. Scaffolding, configuration, and ceremony are failure modes, not features.
- The library system is the extensibility mechanism. Core stays small; power users reach for packages.
- softBASIC teaches real game development concepts — lifecycle functions, modules, classes, composition — in a form that transfers directly to larger engines when the learner is ready to move on.

The target is developers who want to go from idea to published game as directly as possible, and learners who want to understand what a game loop actually does before a framework hides it from them.

---

## Files and Modules

Every `.bas` file is a **module** by default. A module is a static class — all its variables and functions belong to the type itself, not to instances. There is no instantiation. Think of a module like a VB6 `.bas` module or a C# `static class`.

```basic
' File: bunny.bas — automatically a module named "bunny"
dim bunnysprite

function onenter()
    bunnysprite = sprite("bunny.png")
    stage.add(bunnysprite)
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

A file is declared as a **class** by putting the `Class` keyword alone on line 1 of the file. Variables are then attached to the prototype, enabling multiple instances.

```basic
Class
dim health
dim x
dim y

function init(startX, startY)
    self.health = 100
    self.x = startX
    self.y = startY
endfunction
```

The class name is always the filename (lowercase). `Class` takes no argument — there is no `Class Dog` syntax. If you want a class named `dog`, the file must be named `Dog.bas` (or `dog.bas`).

Transpiles to:

```js
class dog {}
dog.prototype.health = undefined;
dog.prototype.x = undefined;
dog.prototype.y = undefined;
dog.prototype.init = function(init_startX, init_startY) {
    this.health = 100;
    this.x = init_startX;
    this.y = init_startY;
};
```

**Important:** `Class` must appear on line 1 of the file. Writing it anywhere else is a compilation error.

| Concept | Variable declaration | Transpiled form |
|---|---|---|
| Module (static, default) | `dim x` at top level | `moduleName.x = undefined` |
| Class (instance, `Class` on line 1) | `dim x` at top level | `className.prototype.x = undefined` |

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

## `self.`

Inside a class method or constructor, `self.` is the required prefix for accessing instance properties. Bare property access (without `self.`) is a compile error.

```basic
Class
dim health

Constructor(startHealth)
    self.health = startHealth    ' required — bare 'health = startHealth' is a compile error
EndConstructor

function takeDamage(amount)
    self.health = self.health - amount    ' both reads and writes need self.
endfunction
```

`self.` compiles to JavaScript's `this.`, binding each access to the current instance.

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

### `onupdate(delta)`

The game loop hook. Called once per frame by the PIXI ticker. Use it for movement, collision checks, and any logic that must run every frame.

```basic
function onupdate(delta)
    x = x + speed * delta
    mysprite.transform.setPosition(x, y)
endfunction
```

`delta` is the PIXI ticker delta time — `1.0` at a steady 60 fps, higher when frames are slow. Declaring the parameter is optional; omit it if you don't need frame-rate-independent movement.

### `onkeydown(keyCode)` and `onkeyup(keyCode)`

Called when a key is pressed or released. `keyCode` is the standard browser key code integer.

```basic
function onkeydown(k)
    if k = 32          ' Space
        jump()
    endif
    if k = 37          ' Left arrow
        moveLeft()
    endif
endfunction

function onkeyup(k)
    ' react to key release
endfunction
```

Common key codes: 32 = Space, 13 = Enter, 37 = Left, 38 = Up, 39 = Right, 40 = Down, 65–90 = A–Z.

Both functions are **optional** — the runtime checks for their presence before calling them. If a module does not define `onkeydown` or `onkeyup`, key events for that module are silently ignored.

---

## Constructors

Classes can define a constructor to initialise instance properties when they are created. At most one constructor per class is allowed.

**Declaration** (inside a `Class` file):

```basic
Class

dim health
dim x
dim y

Constructor(startHealth, startX, startY)
    self.health = startHealth
    self.x = startX
    self.y = startY
EndConstructor
```

**Instantiation with arguments:**

```basic
dim myCar as Car(100, 0, 0)   ' passes args to Constructor
dim myCar as Car               ' no args — works whether or not class has a Constructor
```

**Rules:**
- `Constructor` / `EndConstructor` must appear inside a `Class` file
- Parameters are accessible by name inside the constructor body
- At most one constructor per class — no overloading
- `self.` is required for all property assignments inside the constructor body
- `EndClass` is valid (it closes the class block explicitly) but optional

---

## Inheritance

A class can extend a parent class using `Class extends ParentName`. The child inherits all properties and methods of the parent.

```basic
' Enemy.bas — parent class
Class

dim health

Constructor(startHealth)
    self.health = startHealth
EndConstructor

function hit()
    self.health = self.health - 10
endfunction
```

```basic
' Boss.bas — child class
Class extends Enemy

Constructor()
    super(200)    ' calls Enemy's Constructor with startHealth = 200
EndConstructor
```

```basic
' Main.bas
dim boss as Boss()
boss.hit()          ' method inherited from Enemy
print boss.health   ' 190
```

**Rules:**
- The parent class file must appear earlier in the project file list than the child
- `super()` in a child constructor calls the parent constructor
- `super.method()` calls a parent method from a child override
- Single-level only — if `Enemy` already extends another class, `Boss extends Enemy` is a compile error
- Parent methods and properties are fully accessible on child instances

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

### File ordering for class types

**Classes must be declared before any file that uses them as a type.** The compiler processes files in project order against a shared symbol table. If `Car.bas` contains `dim carKey as Key`, then `Key.bas` must appear earlier in the project file list or the compiler will error with `Class Key has not been declared yet`.

This is a known limitation — automatic dependency ordering is planned for a future release. For now, arrange files manually: leaf classes first, files that use them after.

---

## Class Composition (Classes as Members)

A class can declare members of another class type using `dim x as ClassName`.

```basic
' Key.bas
Class
dim keyless

' Car.bas
Class
dim carKey as Key

' Main.bas
function onenter()
    dim myCar as Car
    myCar.carKey.keyless = 1
    print myCar.carKey.keyless
endfunction
```

Project file order must be: `Key.bas`, `Car.bas`, `Main.bas`.

### Instantiation

`dim x as ClassName` declares an instance variable and emits `x = new ClassName()`:

```basic
dim myCar as Car    ' → onenter_mycar = new car();
```

### Property write

Assign to a member using dot notation. Chains of any depth are supported:

```basic
myCar.carKey = myKey            ' → onenter_mycar.carkey = onenter_mykey;
myCar.carKey.keyless = 1        ' → onenter_mycar.carkey.keyless = 1;
```

### Property read

Read a member in any expression context:

```basic
result = myCar.carKey           ' → onenter_result = onenter_mycar.carkey;
print myCar.carKey.keyless      ' → _print(onenter_mycar.carkey.keyless);
```

### Naming

All identifiers are lowercased by the compiler. `myCar` and `mycar` are the same variable; `Car` and `car` refer to the same class.

---

## Control Flow

### If / EndIf

```basic
if x = 10
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

The loop counter (`i` above) is auto-declared — no prior `dim i` is needed.

---

## Operators

### Arithmetic

| Operator | Description |
|---|---|
| `+` | Addition; also string concatenation |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |

### Comparison

| Operator | Description |
|---|---|
| `=` | Equal |
| `<>` | Not equal |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

### Boolean

| Operator | Description |
|---|---|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

### String concatenation

The `+` operator concatenates strings:

```basic
dim greeting
greeting = "Hello, " + name
print "Score: " + score
```

---

## Packages

softBASIC organises built-in library modules into packages. Packages are collections of ordered source modules compiled before your project files.

**Built-in packages:**

| Package  | Removable | Modules |
|----------|-----------|---------|
| softCore | No (core) | math, string, array |
| softGfx  | Yes       | gfx, drawing, stage, pen, assetmanager, ObjectTransform, sprite, animatedsprite, text, tilemap |

**Managing packages in the editor:**

The **PACKAGES** section in the file tree panel (above FILES) shows which packages are active for the current project. Click the header to expand/collapse. Use `✕` to remove a non-core package. Click `＋` on the header to open the add-package picker and restore a removed package.

**Notes:**
- Package source is not editable from the editor
- `softCore` is always present and cannot be removed
- Package modules compile in package order, then module order within each package, before your project files

---

## Built-in Modules

These are provided by the runtime and available without import. Each maps to an underlying PIXI.js / runtime API.

Built-in modules are organised into packages — see the [Packages](#packages) section above for which package each module belongs to.

### `Sprite`

A display object wrapping a PIXI sprite. Created from a project asset image.

| Method | Signature | Description |
|---|---|---|
| Constructor | `Sprite(imagePath)` | Loads the named asset and creates the sprite |
| `setAngle` | `(angle)` | Sets rotation in degrees |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |
| `setScale` | `(sx, sy)` | Sets scale on both axes (`1` = natural size) |
| `setFlip` | `(h, v)` | Flips horizontally and/or vertically. Pass `true`/`false` for each axis. Preserves scale magnitude. |
| `setVisible` | `(v)` | Shows (`true`) or hides (`false`) the sprite without removing it from the stage |
| `setTexture` | `(path)` | Swaps the sprite image. `path` must be a pre-loaded asset (declared as a `Sprite` somewhere in the program). |
| `width` | `()` | Returns current width in pixels (after scale) |
| `height` | `()` | Returns current height in pixels (after scale) |

Position is managed via the `.transform` member — see [ObjectTransform](#objecttransform) below.

```basic
dim bunny as Sprite("bunny.png")
bunny.transform.setPosition(100, 200)
stage.add(bunny)
```

### `ObjectTransform`

A shared position interface attached to `Sprite`, `AnimatedSprite`, and `TileMap` instances as the `.transform` property. It is not instantiated directly.

| Method | Signature | Description |
|---|---|---|
| `setPosition` | `(x, y)` | Sets the object's position |
| `x` | `()` | Returns current x position |
| `y` | `()` | Returns current y position |

```basic
dim bunny as Sprite("bunny.png")
bunny.transform.setPosition(100, 200)
print bunny.transform.x()    ' 100
```

### `AnimatedSprite`

A display object backed by a sprite sheet with named animation clips.

| Method | Signature | Description |
|---|---|---|
| Constructor | `AnimatedSprite(imagePath, frameW, frameH)` | Loads the sheet and sets the frame size in pixels |
| `addAnim` | `(name, startFrame, endFrame, fps, loop)` | Register a named animation clip |
| `play` | `(name)` | Start playing a named animation |
| `isPlaying` | `(name)` | Returns true if the named animation is currently active |
| `setAngle` | `(angle)` | Sets rotation in degrees |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |
| `setScale` | `(sx, sy)` | Sets scale |
| `setFlip` | `(h, v)` | Horizontal/vertical flip |
| `setVisible` | `(v)` | Show or hide |
| `width` | `()` | Frame width in pixels |
| `height` | `()` | Frame height in pixels |

Position via `.transform` (see [ObjectTransform](#objecttransform)).

```basic
dim hero as AnimatedSprite("hero_sheet.png", 64, 64)
hero.addAnim("walk", 0, 7, 12, true)
hero.addAnim("idle", 8, 8, 1, false)
hero.play("walk")
hero.transform.setPosition(100, 200)
stage.add(hero)
```

### `TileMap`

A tile-based display object loaded from a Tiled-format JSON asset.

| Method | Signature | Description |
|---|---|---|
| Constructor | `TileMap(tilesetPath, tileW, tileH)` | Loads the tileset image and sets tile dimensions |
| `load` | `(jsonPath)` | Load tile layout from a Tiled-format JSON asset |
| `tileAt` | `(x, y)` | Returns the tile ID at grid coordinates |
| `widthPx` | `()` | Map width in pixels |
| `heightPx` | `()` | Map height in pixels |

Position via `.transform` (see [ObjectTransform](#objecttransform)).

```basic
dim map as TileMap("tiles.png", 32, 32)
map.load("level1.json")
map.transform.setPosition(0, 0)
stage.add(map)
print map.tileAt(2, 3)
```

### `Text`

A display object wrapping a PIXI text node.

| Method | Signature | Description |
|---|---|---|
| Constructor | `Text(content, x, y)` | Creates a text object at position |
| `setText` | `(content)` | Updates the displayed string |
| `setPosition` | `(x, y)` | Moves the text object |
| `setAlpha` | `(a)` | Sets opacity (0.0–1.0) |
| `setStyle` | `(size, r, g, b)` | Sets font size and fill colour in one call (r/g/b: 0–255) |

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
| `stage.width()` | Returns the canvas width in pixels |
| `stage.height()` | Returns the canvas height in pixels |
| `stage.setBackground(r, g, b)` | Sets the background colour (0–255 per channel) |

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
| `pen.setLineWidth(n)` | Set stroke width in pixels (default: 2) |

### `math`

Standard maths functions (delegates to `Math.*`).

Trig and general: `abs`, `acos`, `asin`, `atan`, `atan2`, `ceil`, `cos`, `floor`, `log`, `log2`, `log10`, `pi`, `pow`, `round`, `sign`, `sin`, `sqrt`, `tan`, `trunc`, `val`

Game utilities:

| Function | Returns | Description |
|---|---|---|
| `math.random(max)` | float | Random float 0..max |
| `math.randomint(max)` | integer | Random integer 0..max-1 |
| `math.min(a, b)` | number | Smaller of two values |
| `math.max(a, b)` | number | Larger of two values |
| `math.clamp(v, lo, hi)` | number | Constrain value to range |
| `math.lerp(a, b, t)` | number | Linear interpolation (t = 0..1) |
| `math.distance(x1, y1, x2, y2)` | number | Euclidean distance between two points |

```basic
dim angle
angle = math.atan2(dy, dx)

' Clamp speed to max
speed = math.clamp(speed, 0, maxSpeed)

' Random spawn position
x = math.randomint(800)
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
| `string.split(s, c)` | Split by character — returns array |
| `string.trim(s)` | Trim whitespace |
| `string.replace(s, a, b)` | Replace all occurrences of `a` with `b` |
| `string.contains(s, sub)` | True if `sub` is found in `s` |
| `string.indexof(s, sub)` | Index of `sub` in `s`, or -1 |
| `string.char(n)` | Character from ASCII code |
| `string.asc(s)` | ASCII code of first character |

### `gfx`

Top-level graphics helpers.

| Function | Description |
|---|---|
| `gfx.boxCollide(a, b)` | Returns true if two objects' bounding boxes overlap |
| `gfx.getKeyDown(keycode)` | Returns true if the key is currently held |
| `gfx.mouseX()` | Returns the pointer's current X position, canvas-relative |
| `gfx.mouseY()` | Returns the pointer's current Y position, canvas-relative |
| `gfx.mouseDown()` | Returns true if any mouse button is currently held |

### `assetmanager`

Low-level asset access. Most projects load assets implicitly via `Sprite`, `AnimatedSprite`, or `TileMap` constructors. Use `assetmanager` when you need to load a texture separately from its display object.

| Function | Description |
|---|---|
| `assetmanager.loadImage(name)` | Returns the texture handle for a pre-loaded asset |

---

## `print` Statement

Outputs a single expression to the IDE console (BottomPanel).

```basic
print "Hello, World!"
print score
print "Score: " + score
```

`print` accepts one expression. Use `+` to combine values in a single output line.

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
dim bunnysprite as Sprite("bunny.png")

function onenter()
    stage.add(bunnysprite)
endfunction

function onupdate(delta)
    bunnysprite.transform.setPosition(100, 200)
endfunction
```

- `dim bunnysprite as Sprite("bunny.png")` declares a module-level sprite — it is created once when the module initialises (after PIXI and assets are ready)
- `stage.add` registers the display object for rendering
- Position is set via `.transform.setPosition` — `Sprite` does not expose `setPosition` directly

---

## Arrays

### Declaring arrays

**Fixed-size** — elements pre-filled with `false`:

```basic
dim scores(10)          ' 10 elements
dim grid(5, 3)          ' 5×3 two-dimensional array
```

**Dynamic (growable)** — start empty, grow with `push`:

```basic
dim enemies(0)
array.push(enemies, newEnemy)
```

**Typed** — every element is a constructed instance:

```basic
dim sprites(10) as Sprite("bunny.png")
dim grid(5, 3) as Tile()
```

### Accessing elements

Array index uses parentheses — `arr(i)`, not `arr[i]`:

```basic
scores(0) = 100
print scores(0)

grid(2, 1) = true
print grid(2, 1)
```

### Arrays are passed by reference

Modifications inside a function are visible to the caller:

```basic
dim enemies(5)
enemies(0) = 10
resetFirst(enemies)
print enemies(0)    ' prints 0

function resetFirst(arr)
    arr(0) = 0
endfunction
```

### Array module

| Function | Returns | Description |
|---|---|---|
| `array.arrLength(arr)` | number | Number of elements |
| `array.push(arr, item)` | nothing | Add item to end |
| `array.pop(arr)` | removed value | Remove and return last item |
| `array.contains(arr, item)` | boolean | True if item is in array |
| `array.indexOf(arr, item)` | number | Index of item, or -1 if not found |
| `array.remove(arr, index)` | nothing | Remove element at index |
| `array.clear(arr)` | nothing | Empty the array |
| `array.join(arr, separator)` | string | Join elements into a string |

### Typed array declarations

Every element is constructed immediately when `as Type` is used:

```basic
dim sprites(10) as Sprite("bunny.png")
sprites(0).transform.setPosition(100, 200)
stage.add(sprites(0))
```

No constructor — no brackets:

```basic
dim enemies(20) as Enemy
enemies(0).init(100, 200)
```

Multi-dimensional typed arrays work the same way:

```basic
dim grid(5, 3) as Tile()
grid(2, 1).setActive(true)
```

### Typical usage — dynamic enemy list

```basic
dim enemies(0)

function onenter()
    for i = 0 to 9
        dim e as Enemy()
        array.push(enemies, e)
    next
endfunction

function onupdate()
    for i = 0 to array.arrLength(enemies) - 1
        enemies(i).update()
    next
endfunction
```
