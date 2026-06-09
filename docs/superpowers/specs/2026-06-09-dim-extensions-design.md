# Dim Extensions Design

**Date:** 2026-06-09
**Status:** Approved

## Goal

Reduce declaration verbosity in softBASIC by allowing (1) inline initialisation on a `dim` statement and (2) multiple declarators on a single `dim` line.

---

## Supported Syntax

Each `dim` statement is a comma-separated list of independent declarators. Each declarator is one of three forms:

```basic
' Plain declaration (existing, unchanged)
dim x

' Inline init — new
dim x = 10
dim x = someVar + 1

' Object constructor (existing, unchanged)
dim x as Sprite("img.png")

' Multi-declarator — new
dim x, y, z
dim x, y, z as Sprite("img.png")       ' x=undefined, y=undefined, z=Sprite
dim x as Sprite("a"), y as Sprite("b") ' x=Sprite("a"), y=Sprite("b")
dim x = 10, y = 20, z
dim x = 10, y, z as Sprite("img.png")  ' x=10, y=undefined, z=Sprite
```

**Each `=` and `as` binds only to the name immediately before it.** Every declarator is fully independent — there is no broadcast of a type or value across the list.

### Array restriction

Array declarators (`name(dims)` and `name(dims) as Type(...)`) are **only allowed when the `dim` statement contains exactly one declarator**. Combining an array declarator with other names on the same line is a compile error.

```basic
dim x(10)                    ' OK — single array
dim x(10) as Sprite("a")     ' OK — single typed array
dim x(10), y                 ' ERROR
dim x, y(10)                 ' ERROR
```

**Error message format:**

```
Array declaration 'z(10)' cannot appear in a multi-variable dim — move it to its own line.
```

The message names the offending variable so the user knows exactly which one to extract.

---

## Transpiler Output

### `dim x = expr` (inline init)

Follows the same scoping rules as plain `dim x`:

| Scope | Output |
|-------|--------|
| Function / Constructor | `functionname_x = <expr>;` |
| Class | `ClassName.prototype.x = <expr>;` |
| Global | `ClassName.x = <expr>;` |

### Multi-declarator

Each declarator emits independently, in order, separated by newlines. No additional wrapping.

```basic
dim x = 10, y, z as Sprite("img.png")
```
```js
onenter_x = 10;
onenter_y = undefined;
onenter_z = new Sprite("img.png");
```

---

## Architecture

### New node types (`nodeTypes.ts`)

| Name | Used for |
|------|----------|
| `VariableDimAssign` | `dim x = expr` |
| `MultiDim` | Two or more declarators on one `dim` line |

Single-declarator statements still return the original node type (`VariableDimNode`, `CloneNode`, `DimNode`, `TypedArrayDimNode`) — no changes to any existing transpiler rule.

### New files

| File | Purpose |
|------|---------|
| `nodes/VariableDimAssignNode.ts` | Holds variable symbol + one expression child |
| `nodes/MultiDimNode.ts` | Holds ordered list of 2+ dim node children |
| `transpilerRules/jsRules/ruleSets/VariableDimAssignRule.ts` | Emits scoped assignment with init expression |
| `transpilerRules/jsRules/ruleSets/MultiDimRule.ts` | Concatenates children output with newlines |

### Modified files

| File | Change |
|------|--------|
| `nodeTypes.ts` | Add `VariableDimAssign`, `MultiDim` |
| `parserRules/rules/DimRule.ts` | Replace single-declarator logic with loop |

### DimRule parser loop (pseudocode)

```
match 'dim'
nodes = []

loop:
  match variable name
  if nodes.length > 0 and next is '('
    → throw CompilationError("Array declaration '<name>(...)' cannot appear in a multi-variable dim — move it to its own line.")
  if next is '='
    → parse BoolExpression → push VariableDimAssignNode
  else if next is 'as'
    → parse class + optional args → push CloneNode          [existing path]
  else if next is '('
    → parse dims [+ optional 'as' class] → push DimNode / TypedArrayDimNode   [existing path]
  else
    → push VariableDimNode                                   [existing path]
  if next is ','
    → consume comma, continue
  else
    → break

if nodes.length == 1 → return nodes[0]
else                  → return MultiDimNode(nodes)
```

The array restriction is checked at the start of each iteration after the first: if more than zero declarators have already been collected and the next token is `(`, throw immediately before consuming anything.

---

## Tests

**File:** `tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts`

Uses a `transpile` helper scoped to the tests (no lib dependencies needed for plain variable tests; Sprite lib needed for object tests).

### Inline init (`dim x = expr`)

1. `dim x = 10` compiles without diagnostics
2. `dim x = 10` emits `= 10` (not `= undefined`)
3. `dim x = "hello"` compiles without diagnostics
4. `dim x = someVar + 1` compiles without diagnostics (with `someVar` declared first)

### Multi-declarator plain

5. `dim x, y` compiles without diagnostics
6. `dim x, y` emits two separate declarations
7. `dim x, y, z` emits three declarations

### Multi-declarator objects

8. `dim x, y as Sprite("img.png")` compiles without diagnostics (with Sprite in lib)
9. `dim x, y as Sprite("img.png")` emits `x = undefined` and `y = new Sprite(...)` — `as` binds to `y` only
10. `dim x as Sprite("a"), y as Sprite("b")` compiles without diagnostics (with Sprite in lib)
11. `dim x as Sprite("a"), y as Sprite("b")` emits two `new Sprite(...)` assignments

### Combo

12. `dim x = 10, y` compiles without diagnostics
13. `dim x = 10, y` emits `= 10` for x and `= undefined` for y
14. `dim x = 10, y, z as Sprite("img.png")` compiles without diagnostics (with Sprite in lib)
15. `dim x = 10, y, z as Sprite("img.png")` emits three statements in correct order

### Array restriction

16. `dim x(10), y` produces a diagnostic containing `'x(10)'`
17. `dim x, y(10)` produces a diagnostic containing `'y(10)'`

### Regression

18. `dim x` unchanged — compiles and emits `undefined`
19. `dim x as Sprite("img.png")` unchanged — compiles and emits `new Sprite(...)`
20. `dim x(5)` unchanged — compiles and emits `_createArray([5])`

---

## Non-Goals

- `dim x = new Sprite(...)` — not supported; object construction uses `as Type(...)` exclusively
- Multi-dim array declarations (`dim x(5), y(3)`) — compiler error with clear message
