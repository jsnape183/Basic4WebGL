# Array Typed Declarations Design

**Date:** 2026-05-26
**Spec:** 2 of 3 — Array Support
**Depends on:** Spec 1 (Array Compiler Fixes)

## Goal

Add `dim arr(n) as Type(args)` syntax so arrays of typed objects can be declared and immediately populated with instances. Supports all dimension counts, consistent with existing typed variable syntax.

---

## Syntax

Mirrors the existing typed variable syntax exactly:

```basic
' Existing typed variable syntax
dim bunny as Sprite("bunny.png")   ' with constructor args
dim car as Car                     ' no constructor — no brackets

' New typed array syntax
dim sprites(10) as Sprite("bunny.png")   ' 10 Sprite instances, each loaded with "bunny.png"
dim enemies(20) as Enemy                 ' 20 Enemy instances, no constructor args
dim bullets(50) as Bullet(0, 0)          ' 50 Bullet instances, each at (0,0)
dim grid(5, 3) as Tile()                 ' 5×3 grid of Tile instances
```

Every element is a fresh, independently constructed instance. The factory is called once per element.

---

## Implementation

### Parser — new `TypedArrayDimNode`

`DimRule` gains a third path. After parsing the size list `(n)` or `(n, m, ...)`, the rule checks for the `as` keyword. If present, it continues to parse the type name and optional constructor arguments using the same logic as the existing typed variable path.

A new `TypedArrayDimNode` carries:
- Dimension sizes (array of expressions)
- Type name
- Constructor argument expressions (may be empty)

A distinct node type keeps the AST clean and the transpiler rule separate from the untyped `DimNode`.

### Runtime — `_createTypedArray`

New helper added to the bootstrapper alongside the existing `_createArray`. Uses `Array.from` (consistent with the modernised `_createArray` from Spec 1):

```js
const _createTypedArrayDim = (sizes, depth, factory) => {
  if (depth === sizes.length - 1)
    return Array.from({length: sizes[depth]}, () => factory());
  return Array.from({length: sizes[depth]}, () =>
    _createTypedArrayDim(sizes, depth + 1, factory)
  );
};
const _createTypedArray = (sizes, factory) => _createTypedArrayDim(sizes, 0, factory);
```

The factory is called once per leaf element. For multi-dimensional arrays, inner arrays are constructed recursively.

### Transpiler — `TypedArrayDimRule`

New rule registered for `TypedArrayDimNode`. Scope-aware like the fixed `DimRule` from Spec 1 — no `let` for module or class scope.

```js
// dim enemies(10) as Enemy
enemies = _createTypedArray([10], () => new enemy());

// dim sprites(5) as Sprite("bunny.png")
sprites = _createTypedArray([5], () => new sprite("bunny.png"));

// dim bullets(20) as Bullet(0, 0)
bullets = _createTypedArray([20], () => new bullet(0, 0));

// dim grid(5, 3) as Tile()
grid = _createTypedArray([5, 3], () => new tile());
```

Constructor argument expressions are transpiled by reusing the existing typed variable constructor logic — no duplication.

---

## Scope Awareness

Same rules as the fixed `DimRule`:

| Scope | Emitted JS |
|---|---|
| Function | `let onenter_sprites = _createTypedArray([10], () => new sprite("bunny.png"));` |
| Module | `sprites = _createTypedArray([10], () => new sprite("bunny.png"));` |
| Class | `ClassName.prototype.sprites = _createTypedArray([10], () => new sprite("bunny.png"));` |

---

## Tests

### Transpiler output tests

| Input | Expected output |
|---|---|
| `dim enemies(10) as Enemy` | `enemies = _createTypedArray([10], () => new enemy());` |
| `dim sprites(5) as Sprite("bunny.png")` | `sprites = _createTypedArray([5], () => new sprite("bunny.png"));` |
| `dim grid(5, 3) as Tile()` | `grid = _createTypedArray([5, 3], () => new tile());` |
| Same at function scope | `let` prefix retained |
| Same at module scope | no `let` prefix |
| Same at class scope | `prototype.` form, no `let` |

### Behaviour tests (compile and execute)

- `dim sprites(5) as Sprite("bunny.png")` — `sprites(0)` is a live Sprite instance
- `sprites(0).setPosition(100, 200)` — method call works on constructed instance
- Multi-dimensional: `grid(2)(1)` returns a Tile instance
- Each element is independent — mutating `sprites(0)` does not affect `sprites(1)`

---

## Language Guide Updates

Add to the Arrays section (Spec 3 owns the full section, this spec contributes the typed declaration subsection):

### Typed array declarations

```basic
dim sprites(10) as Sprite("bunny.png")
sprites(0).setPosition(100, 200)
stage.add(sprites(0))
```

When `as Type` is used, every element is constructed immediately. No constructor = no brackets:

```basic
dim enemies(20) as Enemy
enemies(0).init(100, 200)
```

Multi-dimensional typed arrays work the same way:

```basic
dim grid(5, 3) as Tile()
grid(2)(1).setActive(true)
```
