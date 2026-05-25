# ObjectTransform Composition Design

## Goal

Eliminate duplicated position logic across display-object classes (`Sprite`, `Text`) by introducing a shared `ObjectTransform` class that is composed into each display object as a named `transform` property.

## Motivation

Shared position/transform logic mirrors Godot/Unity patterns and is a stepping stone for users moving toward those engines. The chained member-method syntax (`bunny.transform.setPosition(x, y)`) required to expose this API also unblocks a general parser capability (`obj.prop.method(args)`) that will be needed for future features.

---

## User-Facing API

The user writes:

```basic
function onenter()
    dim bunny as sprite("bunny.png")
    bunny.transform.setPosition(100, 200)
    dim x
    x = bunny.transform.x()
    bunny.transform.setPosition(bunny.transform.x() + 10, bunny.transform.y())
endfunction
```

`transform` is a property of any display object that participates in the 2D scene.

### `ObjectTransform` methods

| Method | Signature | Description |
|---|---|---|
| `setPosition` | `setPosition(x, y)` | Move to absolute position |
| `x` | `x()` | Get current X coordinate |
| `y` | `y()` | Get current Y coordinate |

**Out of scope (YAGNI):** `setAngle`/`getAngle` on Transform (angle stays on Sprite for now and can migrate later). `setAlpha` is a rendering property — stays on Sprite directly.

**Breaking change:** `setPosition`, `getX`, `getY` are removed from the flat Sprite API. Since no production programs use them yet, this is acceptable.

---

## Architecture

### New class: `ObjectTransform`

`ObjectTransform` is a generated softBASIC class. It holds a `_handle` (the runtime sprite/object handle passed from the parent constructor) and makes `call()` invocations against it.

Generated `src/lib/Basic4WebGL/defs/transform.bas`:

```basic
Class
dim _handle
Constructor(handle)
    _handle = call("constructor_handle")
EndConstructor
function setPosition(x, y)
    call("_sb.setPosition(this._handle, setPosition_x, setPosition_y)")
endfunction
function x()
    return call("_sb.getX(this._handle)")
endfunction
function y()
    return call("_sb.getY(this._handle)")
endfunction
EndClass
```

The `call("constructor_handle")` pattern evaluates the JS expression `constructor_handle` (the mangled parameter name) — consistent with how all `call()` strings reference parameters in the existing codebase.

### Modified class: `Sprite`

`Sprite` gains a `transform` property dimmed in the class body and initialised in the constructor by passing `this._handle` to `ObjectTransform`. The old `setPosition`, `getX`, `getY` methods are removed.

Generated `src/lib/Basic4WebGL/defs/sprite.bas`:

```basic
Class
dim _handle
dim transform
Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor
function setAngle(angle)
    call("_sb.setAngle(this._handle, setAngle_angle)")
endfunction
function setAlpha(a)
    call("_sb.setAlpha(this._handle, setAlpha_a)")
endfunction
EndClass
```

`call("this._handle")` evaluates `this._handle` in JS context at construction time — the clean hook for passing the parent handle into the child Transform without new language syntax.

### `Text` class

`Text` is not yet implemented. When it is, it gets the same treatment: `dim transform` + constructor initialisation. No action required in this spec.

---

## Descriptor / Generator Changes

**New file:** `src/lib/Basic4WebGL/defs/descriptors/transformDescriptor.ts`
- A `ClassDescriptor` with the three Transform methods (`setPosition`, `x`, `y`)
- Single source of truth — generated once, composable into any future display-object class

**Modified:** `src/lib/Basic4WebGL/defs/descriptors/spriteDescriptor.ts`
- Remove `setPosition`, `getX`, `getY` method entries
- Add a `transform` property entry (type: `ObjectTransform`) so the symbol table knows `sprite.transform` is a valid object of that class

**Modified:** generator / `.bas` emit pass
- Add `transform.bas` to the generation output
- Update `sprite.bas` generation to emit `dim transform` property and the constructor initialisation line

**Modified:** `src/monacoHelpers/catalogue.ts`
- Add an `ObjectTransform` entry with the three methods
- **Note:** The current completion provider does a single-level `module.` token parse. `bunny.transform.` is two levels deep and will not trigger completions until the provider is extended to resolve property chains. Full Monaco completion for `transform.*` is a follow-up; it does not block the compiler feature.

---

## Parser Change

### Problem

`VariableFactorRule` currently handles:
- `obj.method(args)` — method call on the first member (works)
- `obj.prop.chain` — property chain accumulation (works)
- `obj.prop.method(args)` — **broken**: the property chain loop exits when it sees `(`, leaving the argument list orphaned

### Fix

Extend the property chain loop in `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` (lines 65–72) so that when it encounters `(` after accumulating one or more chain segments, it routes to method-call parsing instead of breaking out.

**Behaviour after fix:**
- Accumulate chain segments (e.g. `transform`)
- On seeing `(`, parse the argument list
- Emit a `FunctionCall` or `FunctionTerm` node with the full chain path as the object and the final identifier as the method name

No transpiler rule changes are needed — the emitted node shapes (`FunctionCall`, `FunctionTerm`) are identical to those already produced for flat method calls.

---

## Testing

### Parser unit tests
- `obj.prop.method()` parses without error and produces the correct AST node
- `obj.prop.method(arg1, arg2)` passes arguments through correctly
- `obj.prop.method()` used as expression (RHS of assignment) produces a `FunctionTerm` node, not `FunctionCall` (no spurious semicolons)

### Integration tests (extend `spriteClass.test.ts`)
- `bunny.transform.setPosition(100, 200)` compiles without error; output contains `setposition(100,200)`
- `x = bunny.transform.x()` compiles; output contains `x()`
- `bunny.transform.setPosition(bunny.transform.x() + 10, bunny.transform.y())` compiles; output does not contain `x();` (regression guard for the statement-vs-expression semicolon bug)

### Generator unit tests
- `transformDescriptor` generates the correct `transform.bas` content
- `spriteDescriptor` no longer emits `setPosition`, `getX`, `getY`

### Updated tests
- Existing sprite integration tests that assert `setposition(`, `getx(`, `gety(` on the flat API must be updated to use `transform.*` paths.
