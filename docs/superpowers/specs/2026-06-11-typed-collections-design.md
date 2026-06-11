# Typed Collections, `new` Keyword, and Typed Parameters — Design Spec

## Goal

Give softBASIC a clean, consistent way to work with collections of objects. Arrays and
dictionaries gain an optional element type. A `new` keyword creates object instances
explicitly. Function parameters gain typed declarations. Type mismatches are compile
errors. Accessing an uninitialised typed slot is a caught runtime error.

## What changes

### 1. `new` keyword

`new ClassName(args)` is a first-class expression that constructs an object. It is only
valid where the **receiving type is statically known** — a typed variable, a typed
collection element, or a typed function parameter. Using `new` where the target is a
variant is a compile error.

```bas
dim a as Sprite            ' typed variable
a = new Sprite("img.png")  ' OK — target type is known
a = new Enemy("img.png")   ' compile error — type mismatch

dim b                      ' variant
b = new Sprite("img.png")  ' compile error — cannot assign object to variant
```

`new` is also valid directly in a function call when the parameter is typed:

```bas
function spawn(s as Sprite)
  s.setPosition(0, 0)
endfunction

spawn(new Sprite("img.png"))  ' OK — param type is Sprite
```

---

### 2. Typed variables — reassignment

`dim a as Sprite` (no constructor) declares a typed but uninitialised variable. It may
later be assigned via `new`. `dim a as Sprite("img.png")` (existing form, unchanged)
also allows later reassignment:

```bas
dim a as Sprite
a = new Sprite("img.png")    ' first assignment
a = new Sprite("other.png")  ' reassignment — OK, same type

a.setPosition(0, 0)          ' compiles — type is known at compile time
```

Accessing a member before the first assignment is a runtime null-reference error.

---

### 3. Typed arrays

`dim arr(N) as ClassName` declares a typed array of N uninitialised slots. Each slot
must be assigned individually via `new`. All slots start as `null` at runtime.

```bas
dim enemies(10) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")

enemies(0).update()        ' OK — element type is Enemy
enemies(5).update()        ' runtime error — slot 5 never assigned
```

**Removed form:** `dim arr(N) as ClassName(args)` is now a **compile error**.
The message is: *"Array declaration cannot include a constructor — declare
'dim arr(N) as ClassName' and assign each element with 'arr(i) = new ClassName(...)'".*

This form was always ambiguous (does it share one instance or create N?). It is gone.

---

### 4. Typed dictionaries

`dim d[] as ClassName` declares a typed dictionary. Values must be assigned via `new`.

```bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"]   = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)  ' OK — value type is Sprite
players["ghost"].setPosition(0, 0)      ' runtime error — key not found (existing behaviour)
players["Alice"].setPosition(0, 0)      ' runtime null-ref if Alice was never assigned
```

---

### 5. Typed function parameters

All four collection parameter forms are supported alongside typed scalar parameters:

```bas
function f(a as Sprite)          ' typed scalar — member access on a compiles
function f(arr() as Sprite)      ' typed array param — element member access compiles
function f(d[] as Sprite)        ' typed dict param — value member access compiles
function f(arr())                ' untyped array param — declares it as an array
function f(d[])                  ' untyped dict param — declares it as a dict
function f(a)                    ' variant param — unchanged
```

A type mismatch at the call site is a **compile error**:

```bas
function spawn(e as Enemy)
  e.update()
endfunction

dim s as Sprite("img.png")
spawn(s)                         ' compile error — Sprite is not Enemy
spawn(new Enemy("img.png"))      ' OK
```

---

### 6. Type inference from `new` initialisers

`dim a = new ClassName(args)` is equivalent to `dim a as ClassName` followed by
`a = new ClassName(args)`. The type is inferred from the `new` expression and the
variable behaves identically to an explicitly typed variable.

```bas
dim a = new Sprite("img.png")  ' a inferred as Sprite
a.setPosition(0, 0)            ' compiles — type known
a = new Sprite("other.png")    ' OK — same type
a = new Enemy("img.png")       ' compile error — type mismatch
```

This inference applies **only** when the initialiser is a `new` expression.
`dim a = 5` remains a variant — primitive initialisers do not trigger type inference.

The parser handles this in `DimRule`: when the `= expression` form is parsed and the
expression is a `NewObjectNode`, register the variable as a typed object symbol
(equivalent to the `as ClassName` path) rather than a plain variant.

---

## Out of scope

- Full mandatory explicit typing for all variables (deferred — major language redesign)
- Return type declarations on functions
- Generic / parameterised types

---

## Compiler architecture

### New token

`New` keyword added to `tokens.ts` and resolved in `TokenResolver.ts`.

### New symbol fields

`ArraySymbol` gains an optional `classSymbol` field (populated for typed arrays, `null`
for untyped). `DictionarySymbol` gains the same optional `classSymbol`. A new
`TypedParameterSymbol` (or reuse `symbolTypes.Object`) represents typed scalar
parameters; typed collection parameters use `ArraySymbol` / `DictionarySymbol` with
`classSymbol` set.

### New AST nodes

| Node | Produced by | When |
|---|---|---|
| `NewObjectNode` | `NewObjectRule` (parser) | `new ClassName(args)` in expression |

### Parser changes

**`NewObjectRule`** — parses `new ClassName(args)`. Returns `NewObjectNode(classSymbol, args)`.
Registered as a factor-level rule, invoked from `BoolExpression` when the current token
is `New`.

**`VariableListRule`** — extended to handle typed param forms. After reading a param
name, peek for `as`, `()`, or `[]`. Register the appropriate symbol type. Typed scalar
params register as `symbolTypes.Object` in the function scope. Typed array/dict params
register as `symbolTypes.Array` / `symbolTypes.Dictionary` with `classSymbol` set.

**`DimRule`** — the `dim arr(N) as ClassName(args)` path (TypedArrayDim with constructor
args in node) becomes a `CompilationError`. The no-args path (`dim arr(N) as ClassName`)
changes semantics: emit null-initialised array instead of factory-constructed array.

**`VariableRule`** — typed variable assignment (`a = new Sprite(...)`) type-checks
the `NewObjectNode` class against the target variable's class symbol. Typed array
element assignment (`arr(i) = new Sprite(...)`) does the same. Typed dict element
assignment (`d["k"] = new Sprite(...)`) does the same.

**`VariableFactorRule`** — after resolving a typed array lookup (`arr(i)`), if the
next token is `.`, use the array's `classSymbol` to resolve the member (method or
property). Emit a null-check wrapper in the generated code. Same for typed dict lookup.

### Transpiler rule changes

**`TypedArrayDimRule`** — when `node.children.length === 1` (no constructor args), emit
`_createTypedArray([sizes], () => null)` (null-initialised slots) instead of a
factory-constructed array. The constructor-args path is now unreachable (blocked at
parse time).

**`NewObjectRule`** (new) — emits `new ClassName(args)`. Class name comes from
`classSymbol.name`; args from children.

### Runtime

One new helper in `bootstrapper.html`:

```javascript
const _sbRequireInit = (val, label) => {
  if (val == null)
    throw new Error(`Null reference: '${label}' has not been initialised`);
  return val;
};
```

The transpiler wraps typed collection element access with `_sbRequireInit` when member
access follows:

```javascript
// arr(0).update() for typed array enemies() as Enemy
_sbRequireInit(main.enemies[0], "enemies(0)").update();

// d["Alice"].setPosition() for typed dict players[] as Sprite
_sbRequireInit(_sbDictGet(main.players,"Alice"), "players[Alice]").setPosition(0,0);
```

---

## Type checking rules (compile time)

| Situation | Result |
|---|---|
| `new T(...)` assigned to typed var of type `T` | OK |
| `new T(...)` assigned to typed var of type `U` (U ≠ T) | Compile error |
| `new T(...)` assigned to variant | Compile error |
| `new T(...)` passed to typed param of type `T` | OK |
| `new T(...)` passed to typed param of type `U` (U ≠ T) | Compile error |
| Typed variable `x as T` passed to typed param `T` | OK |
| Typed variable `x as T` passed to typed param `U` | Compile error |
| Variant passed to typed param | Compile error |
| Typed param passed to variant param | OK (widening) |

---

## Documentation

Updates required after implementation:

- Language Guide: new `new-keyword.md` topic covering declaration patterns,
  `new` expressions, null-reference behaviour, and iteration over typed collections
- Language Guide: update `arrays.md` — note removed form, add typed array section
- Language Guide: update `dictionaries.md` — add typed dict section
- API Reference: no new module pages required (no new `.bas` functions)
- Existing docs: any example using `dim arr(N) as ClassName(args)` must be updated
