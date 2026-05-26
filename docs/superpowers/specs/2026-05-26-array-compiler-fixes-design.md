# Array Compiler Fixes Design

**Date:** 2026-05-26
**Spec:** 1 of 3 — Array Support

## Goal

Fix two compiler bugs that prevent arrays from working correctly in all scope contexts and as function arguments. Align `symbolRules` pre-declaration format with `formatSymbol` to eliminate a latent naming inconsistency. This spec is a prerequisite for Specs 2 and 3.

---

## Problems

### Bug 1 — Module-level array declarations produce invalid JavaScript

`DimRule` always emits `let` regardless of scope:

```js
// dim arr(10) at module scope — INVALID JS
let main.arr = _createArray([10]);

// dim arr(10) in a function — valid
let onenter_arr = _createArray([10]);
```

`let` requires a simple identifier. `let main.arr` is a syntax error at runtime.

### Bug 2 — Arrays cannot be passed as function arguments

`VariableFactorRule` resolves bare names as type `'Variable'`. Array symbols are registered as type `'Array'`. The type check fails and the compiler throws:

```
SymbolError: Variable bullets has not been declared yet.
```

Any function call that passes an array variable — including `array.arrLength(bullets)` and `array.join(bullets, ",")` — fails to compile. The existing array module functions are non-functional as a result.

### Debt — `symbolRules` uses its own symbol formatting

`symbolRules` pre-declares variables using `let ${s.scope.name}_${s.name} = null` (underscore format). `formatSymbol` uses dot notation for module scope (`main.score`). Two functions responsible for the same variable names with different formatting logic.

---

## Solution

### Fix 1 — DimRule scope awareness

`DimRule` checks the symbol's scope type before emitting. Function-scope arrays keep `let`; module and class scope emit a plain assignment:

| Scope | Emitted JS |
|---|---|
| Function | `let onenter_arr = _createArray([10]);` |
| Module | `main.arr = _createArray([10]);` |
| Class | `ClassName.prototype.arr = _createArray([10]);` |

### Fix 2 — VariableFactorRule array expression

When no `(` follows a name in expression context, `VariableFactorRule` currently tries a `'Variable'` lookup only. Add a fallback: if the Variable lookup fails, try `'Array'`. If found, return a `TermNode` wrapping the array symbol. The existing transpiler emits `formatSymbol(node.data)` — the correct JS identifier for any scope.

**Pass-by-reference semantics:** When an array is passed to a function and modified inside, changes are visible to the caller. This is the natural JavaScript behaviour and the correct softBASIC contract.

```basic
dim enemies(5)
enemies(0) = 10
resetFirst(enemies)
print enemies(0)   ' prints 0 — mutation is visible
```

### Fix 3 — symbolRules consistency (Approach B)

`symbolRules` delegates variable name formatting to `formatSymbol` rather than its own concatenation:

```ts
// Before
.map((s) => `let ${s.scope.name}_${s.name} = null`)

// After
.map((s) => `${formatSymbol(s)} = null`)
```

One source of truth for how any symbol becomes a JS identifier. Arrays are pre-declared consistently alongside regular variables.

### Fix 4 — Array.from modernisation

Both `_createArray` and the forthcoming `_createTypedArray` (Spec 2) use the old ES5 `Array.apply(null, new Array(n)).map(fn)` pattern. Update both to use `Array.from({length: n}, fn)` — one step instead of three, no intermediate sparse array.

Updated in the same commit as Fix 1 so both helpers stay in sync.

---

## Research Task

The first implementation task is a research pass: generate actual transpiler output for module-level, class-level, and function-level declarations and confirm the exact inconsistency in `symbolRules` before making changes. This ensures the fix is grounded in observed behaviour, not assumed behaviour.

---

## Tests

### Transpiler output tests

| Input | Expected output |
|---|---|
| `dim arr(10)` at module scope | `main.arr = _createArray([10]);` (no `let`) |
| `dim arr(10)` in function | `let onenter_arr = _createArray([10]);` |
| `dim arr(10)` as class property | `ClassName.prototype.arr = _createArray([10]);` |
| `arr(0) = x` at module scope | `main.arr[0] = x;` |
| `arr(0)` in expression at module scope | `main.arr[0]` |
| Bare `arr` in function call argument | `main.arr` (reference, not indexed) |

### symbolRules consistency tests

- Any variable pre-declared by `symbolRules` uses the exact same JS identifier as `formatSymbol` produces for it
- No variable appears under two different names in the same generated output

### Behaviour tests (compile and execute)

- Array declared at module level — index read/write works at runtime
- Array passed to function, mutation inside is visible to caller
- `array.arrLength(arr)` compiles and returns correct length for a module-level array
- `array.join(arr, ",")` compiles and returns correct string for a module-level array

---

## Language Guide Updates

**Remove from Known Gaps:**
- "Array declarations: `dim arr(10)` syntax and transpiled form"

**Add to Arrays section** (see Spec 3 for the full Arrays section — this spec contributes the pass-by-reference behaviour note):

> Arrays are always passed by reference. Modifications inside a function are visible to the caller.
