# Class Constructors Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add constructor support to softBASIC classes, with a prerequisite fix for instance method scoping.

**Architecture:** Two-phase work — first fix the broken instance method foundation (`this` binding and class-property scoping), then add the `Constructor`/`EndConstructor` syntax and the `dim x as Type(args)` call-site extension on top.

**Tech Stack:** TypeScript, Vitest, existing parser rule / transpiler rule / AST node patterns in `src/lib/Basic4WebGL`.

---

## Background

Classes in softBASIC are declared with `Class` on line 1 of a `.bas` file. The class name is the filename (lowercase). Currently:

- `dim x as ClassName` instantiates with `x = new ClassName()` — no constructor arguments are supported.
- Instance methods on classes are emitted as arrow functions (`car.prototype.init = (p) => { ... }`), which do not bind `this`.
- Inside any class method body, bare names that resolve to class-level properties incorrectly emit the static form (`car.health`) rather than the instance form (`this.health`).

No existing tests exercise writing to or reading from class-level properties from *within* a method body, so these bugs have not surfaced yet. This feature requires fixing them first.

---

## Language Spec

### Constructor declaration

A class file may declare at most one constructor using the `Constructor` / `EndConstructor` keyword pair. It must appear at class level (not inside a function). Parameters follow the existing `functionName_paramName` convention.

```basic
' Car.bas
Class
dim health
dim x
dim y

Constructor(startHealth, startX, startY)
    health = startHealth
    x = startX
    y = startY
EndConstructor

function move(dx, dy)
    x = x + dx
    y = y + dy
endfunction
```

- The constructor is **optional**. Classes without one still instantiate with `dim myCar as Car`.
- At most **one constructor** per class — no overloading.
- Parameters use the `constructor_paramName` prefix (e.g. `constructor_startHealth`).
- Inside the constructor body, bare names that resolve to class-level properties refer to the instance property (`this.propName`). This is unambiguous because the scope rules already forbid a local variable from shadowing a class-level declaration.

### Call site

Arguments are passed inline on the `dim` line. Parentheses are required only when arguments are present:

```basic
dim myCar as Car(100, 0, 0)   ' with constructor args
dim myCar as Car               ' no constructor — unchanged
```

### Instance methods (fix)

Inside any instance method body (not just constructors), bare names that resolve to class-level properties must emit as `this.propName`. Instance methods must also be emitted as regular function expressions (not arrow functions) so `this` is correctly bound:

```basic
function move(dx, dy)
    x = x + dx
    y = y + dy
endfunction
```

---

## Transpiled Output

### Class with constructor

```js
class car {
  constructor(constructor_startHealth, constructor_startX, constructor_startY) {
    this.health = constructor_startHealth;
    this.x = constructor_startX;
    this.y = constructor_startY;
  }
}
car.prototype.health = undefined;
car.prototype.x = undefined;
car.prototype.y = undefined;
car.prototype.move = function(move_dx, move_dy) {
  this.x = this.x + move_dx;
  this.y = this.y + move_dy;
};
```

### Class without constructor (unchanged declaration, fixed method emission)

```js
class car {}
car.prototype.health = undefined;
car.prototype.move = function(move_dx, move_dy) {
  this.x = this.x + move_dx;
};
```

### Call site

```js
onenter_mycar = new car(100, 0, 0);   // with args
onenter_mycar = new car();             // without (unchanged)
```

---

## Compiler Changes

### 1. Tokens

Add `Constructor` and `EndConstructor` to the token set alongside the existing `Function` / `EndFunction` tokens.

### 2. Instance method emission fix (`FunctionDeclRule` transpiler)

When a `FunctionDeclNode`'s parent scope type is `Class`, emit a regular function expression instead of an arrow function:

- Before: `car.prototype.move = (move_dx) => { ... };`
- After: `car.prototype.move = function(move_dx) { ... };`

### 3. Instance scoping fix (`formatSymbol` + assignment paths)

Add a `Constructor` scope type alongside the existing `Function`, `Module`, `Class`, `Globals` types.

In both `formatSymbol` and the assignment transpiler path, add a rule: when the **current execution scope** is `Constructor` or a class-instance `Function`, and the referenced symbol is **declared at Class scope**, emit `this.symbolName` instead of `car.symbolName`.

The transpiler tracks execution context by threading scope through the `generate` calls (the symbol table already carries scope state set during parsing; the transpiler honours it when descending into constructor/method bodies).

### 4. New parser rule: `ConstructorRule`

Mirrors `FunctionRule`:

- Matches `Constructor(params)` / `EndConstructor`
- Opens a `Constructor` scope on the symbol table
- Parses the parameter list (same as `VariableList`)
- Parses the block body
- Returns a `ConstructorDeclNode` carrying the parameter symbols and body

Validates that at most one constructor is declared per class (compile error if a second is found).

### 5. New AST node: `ConstructorDeclNode`

Stores the constructor's parameter symbols and body children. Analogous to `FunctionDeclNode`.

### 6. New transpiler rule: `ConstructorDeclRule`

Emits the `class car { constructor(...) { ... } }` form in place of the default bare `class car {}`. When no `ConstructorDeclNode` is present in the class, the existing `class car {}` emission is unchanged.

### 7. `DimRule` extension

After matching `dim x as ClassName`, check for `(`. If present, parse an argument list using the existing `ArrayList` rule. Store the args as an optional child of the existing `CloneNode`.

### 8. `CloneNode` / `CloneRule` extension

`CloneNode` gains an optional args child. `CloneRule` emits `new car(arg1, arg2)` when args are present, `new car()` otherwise (unchanged).

---

## Test Coverage

### Unit — instance method emission fix
- A class method body that reads a class-level property emits `this.prop` not `car.prop`.
- A class method body that writes a class-level property emits `this.prop = ...`.
- A class instance method is emitted as `function(...)` not `(...)=>`.

### Unit — constructor declaration
- `Constructor(a, b)` / `EndConstructor` parses without error.
- Two constructors in one class produces a compile error.
- A constructor outside a class produces a compile error.

### Integration — transpiler output
- Class with constructor: emitted JS contains `class car { constructor(constructor_p1) { this.p = constructor_p1; } }`.
- Class without constructor: emitted JS is `class car {}` (unchanged).
- `dim x as Car(1, 2)` emits `x = new car(1, 2)`.
- `dim x as Car` still emits `x = new car()`.
- End-to-end: instantiate with constructor args, call a method that mutates instance state, verify the full output.

---

## Out of Scope

- Inheritance (not planned yet).
- Method overloading (not supported in the language).
- `this` keyword as explicit syntax — not exposed to the user; the compiler handles it transparently.
- Fixing instance method bodies in *module* context (modules are static; this fix applies to `Class`-scoped files only).
