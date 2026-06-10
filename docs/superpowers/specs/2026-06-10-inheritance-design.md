# softBASIC Single-Level Inheritance Design

**Date:** 2026-06-10
**Status:** Approved

## Goal

Add single-level inheritance to softBASIC: the `extends` keyword, `self.` for explicit instance property access, `super()` for parent constructor calls, and `super.method()` for parent method calls. Also fixes the scope priority bug (inner scope should win) and requires explicit `self.` for all class property access.

---

## File Model

Each `.bas` file is either a **module** (static, no instantiation) or a **class** (instantiated with `dim x as ClassName`). The distinction is made by the first line of the file:

- No `class` declaration → **module**. Properties and functions are static. No `self.`, no inheritance.
- `class ClassName` → **class**. The whole file is the class body. No `endclass` — the file boundary is the class boundary. One class per file by design.

```basic
' Enemy.bas — class file
class Enemy extends BaseEnemy

constructor(x, y)
  super(x, y)
  self.health = 100
endconstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction
```

```basic
' Utils.bas — module file
dim score

function addScore(n)
  score = score + n
endfunction
```

---

## Syntax

### Class declaration with inheritance

```basic
class Boss extends Enemy
```

- `extends ParentName` is optional
- Single-level only — if `Enemy` itself already extends something, this is a compile error
- `extends` is only valid in a class file — using it in a module is a compile error

### `self` keyword

- `self` is a reserved keyword
- `self.property` reads or writes an instance property
- `self.method(args)` calls an instance method
- Inside a class body, all class-declared properties **must** be accessed via `self.` — bare name access to a class property is a compile error
- `self` used outside a class body is a compile error

### `super` in constructors

- `super(args)` calls the parent constructor with the given args at the point it appears
- If `super()` is omitted, the parent constructor is auto-called with no args before the child constructor body runs
- `super()` may only appear in a constructor — using it in a method is a compile error
- `super()` may only appear once — multiple calls in the same constructor is a compile error

### `super.method()` in methods

- `super.method(args)` calls the parent's version of `method`
- The method name must exist on the parent class — calling a non-existent parent method is a compile error
- `super.method()` used in a class with no parent is a compile error
- `super` is not valid in module files

---

## Scope Priority Fix

The existing scope priority system in `Symbols.retrieveSymbol` currently resolves names to the **outermost** matching scope. This is a bug — inner (local) scope should win. The fix: reverse the reduce so higher-index (inner) scope takes priority.

**Before fix:** class-level `dim health` wins over function-local `dim health` — local is dead code.

**After fix:** function-local `dim health` shadows class-level — standard lexical scoping.

This fix applies universally (class and module contexts). Combined with the `self.` requirement for class properties, the two changes are consistent: inside a class, `health` is always local; `self.health` is always the instance property.

---

## Compiler Changes

### 1. New tokens & keywords

Add to `tokens.ts` and `keywords.ts`:
- `Self` token → `self` keyword
- `Extends` token → `extends` keyword
- `Super` token → `super` keyword

### 2. ClassRule — parse `extends`

`ClassRule.ts` already handles `class ClassName` as the file header. Extend it to optionally parse `extends ParentName`:
- Look up `ParentName` as a class symbol
- If `ParentName` itself has a parent, throw a compile error (single-level enforced at parse time)
- Store the parent class name on the class symbol for use by the transpiler

### 3. `self.` parse path

New parse paths for:
- `self.property = expr` — assignment statement
- `self.property` — expression factor
- `self.method(args)` — method call (reuses existing call path with `this` as receiver)

Inside a class body: if a bare variable name resolves to a class-scope symbol, throw a compile error: `'health' is a class property — use self.health`.

Remove `isInstancePropertyAccess` auto-detection from `VariableFactorRule` — no longer needed.

### 4. `super` parse path

- `super(args)` in a constructor → `SuperConstructorCallNode`; if absent, auto-emitted by transpiler
- `super.method(args)` in a method → `SuperMethodCallNode`; method name validated against parent class symbols at parse time

### 5. Scope priority fix

In `Symbols.retrieveSymbol`, the reduce that resolves name conflicts between scopes:

```ts
// Before (outer wins):
return currentPriority < bestPriority ? current : best;

// After (inner wins):
return currentPriority > bestPriority ? current : best;
```

### 6. Transpiler output

| softBASIC | JavaScript |
|-----------|-----------|
| `class Boss extends Enemy` | `class Boss extends Enemy {}` |
| `self.health = 100` | `this.health = 100` |
| `self.health` | `this.health` |
| `self.method(args)` | `this.method(args)` |
| `super(x, y)` in constructor | emitted before child body: `super(x, y)` |
| `super()` omitted | auto-emits `super()` at top of constructor |
| `super.takeDamage(amount)` | `Enemy.prototype.takeDamage.call(this, amount)` |

---

## Error Handling

| Scenario | Compile Error |
|----------|--------------|
| `class Boss extends Grunt` where `Grunt` already extends something | `'Grunt' already extends 'Enemy' — inheritance cannot be chained` |
| `class Boss extends Unknown` where `Unknown` isn't defined | `Class 'Unknown' has not been declared yet` |
| Bare class property access inside class body: `health = 5` | `'health' is a class property — use self.health` |
| `super()` called in a method (not a constructor) | `super() can only be called in a constructor` |
| `super.method()` where method doesn't exist on parent | `'method' is not defined on parent class 'Enemy'` |
| `super.method()` inside a class with no parent | `'super' used in class 'Boss' which has no parent` |
| `self` used outside a class body | `'self' can only be used inside a class` |
| `extends` used in a module file | `Modules cannot use extends — only class files can inherit` |
| Multiple `super()` calls in a constructor | `super() called more than once in constructor` |

---

## Tests

### Transpiler output — inheritance

1. `class Boss extends Enemy` emits `class Boss extends Enemy {}` in JS output
2. Child constructor with explicit `super(x, y)` emits `super(x, y)` before child body
3. Child constructor with no `super()` call auto-emits `super()` at top of constructor body
4. `super.takeDamage(amount)` emits `Enemy.prototype.takeDamage.call(this, amount)`
5. Overridden method on child emits as `Boss.prototype.takeDamage = function(...)`
6. Non-overridden parent method is not re-emitted on the child

### `self.` keyword

7. `self.health = 100` inside a class emits `this.health = 100`
8. `self.health` in an expression emits `this.health`
9. `self.method(args)` emits `this.method(args)`

### Scope priority fix

10. Local `dim x` inside a function shadows a module-level `dim x` — resolves to local
11. Local `dim x` inside a class method is treated as a local (class property is `self.x`)

### Error cases

12. Chained inheritance (`extends` on a class that already extends) throws compile error
13. Bare class property access (no `self.`) inside a class method throws compile error
14. `super()` in a method body (not constructor) throws compile error
15. `super.missing()` where method doesn't exist on parent throws compile error
16. `self` used in a module throws compile error
17. Multiple `super()` calls in constructor throws compile error

---

## Non-Goals

- Multiple inheritance
- Interface / abstract class declarations
- `instanceof` checks at runtime
- Protected / private visibility modifiers
- Calling `super.property` (properties only — method calls only via `super.method()`)
- Renaming `self` to `this` or any other keyword
