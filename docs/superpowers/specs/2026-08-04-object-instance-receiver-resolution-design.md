# Object instance receiver resolution — design note

**Date:** 2026-08-04
**Status:** Shipped
**Scope:** Compiler (parser + transpiler). No softBASIC API surface change, no engine change.

---

## Symptom

Calling a method on a **function-scoped** object local and using its **return value in an
expression** produced JavaScript that referenced a name which does not exist at runtime:

```basic
function onenter()
  dim s as sprite("x.png")
  print string.str(s.width())
endfunction
```

```js
// emitted (wrong)
_print(string.str(main.onenter.s.width()))
// expected
_print(string.str(onenter_s.width()))
```

`main.onenter.s` is `undefined`, so the call threw
`Cannot read properties of undefined (reading 'width')`.

The same variable worked correctly for its other two uses — the constructor assignment
(`onenter_s = new _sb_sprite(...)`) and a void method call as a bare statement
(`onenter_s.setangle(1)`) — which is what made the failure look so arbitrary.

---

## Root cause

Two different parser rules handle `obj.method(...)`, depending on grammatical context, and
they derived the call target from **different sources of truth**.

**Statement context** — `ObjectPropertyRule` (reached from `VariableRule`):

```ts
const ownerSymbol = symbolTable.get(ownerName, symbolTypes.Object);
const ownerFormatted = formatSymbol(ownerSymbol);   // → "onenter_s"
const chain = `${ownerFormatted}.${memberName}`;    // → "onenter_s.setangle"
return new PropertyMethodCallNode(chain, args, loc);
```

It asks the **instance symbol** how to render itself. Correct in every scope.

**Expression context** — `VariableFactorRule`:

```ts
const ownerFormatted = formatSymbol(ownerSymbol);   // computed…
...
if (check(tokens.OpenParen, tokenStream.current())) {
  symbolTable.setScope(name);
  node = getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
    name: memberName,                               // …then thrown away
  });
}
```

It computed the correct receiver and **discarded it**, delegating to `FunctionFactorRule`,
which builds a `FunctionTermNode` carrying only the *method* symbol. `FunctionTermRule` then
re-derived the callee:

```ts
return `${formatSymbol(node.data)}(${...})`;   // Function symbol → `${fullScope}.${name}`
```

The method symbol's `fullScope` is set by `Symbols.clone()` when `DimRule` clones the class's
members into the instance's scope. It records the **lexical scope chain at the point of
declaration** — `main` → `onenter` → `s` → `"main.onenter.s"`.

That is a *declaration path*, not a *JS access path*. The transpiler's naming convention is:

| Instance declared in | JS name             | Member `fullScope` | Agree? |
|----------------------|---------------------|--------------------|--------|
| Module scope         | `main.s`            | `main.s`           | yes    |
| Function scope       | `onenter_s`         | `main.onenter.s`   | **no** |
| Class method scope   | `go_s`              | `main.go.s`        | **no** |
| Constructor (`self.`)| `this.s`            | (separate path)    | n/a    |

The two coincide **only for module-scoped instances**, because module scope is the one case
where the JS path really is dot-qualified. Every shipped tutorial reaches instance members
through `self.x` (a wholly separate rule, `SelfFactorRule`) or declares them at module level,
so the disagreement never surfaced until a demo declared `dim t as tilemap(...)` inside a
scene's `onenter()` and read `t.tileAt(x, y)`.

**In one sentence:** the JS access path for an instance member is a property of the *instance
symbol*, and cannot be reconstructed from the method symbol's lexical `fullScope`. The
statement path knew that; the expression path forgot.

`formatSymbol` was where the wrong string became visible, but it was never the defect — it was
handed a `Function` symbol and correctly formatted a function. It had no way to know the call
was being dispatched through an instance, and no access to the symbol table to find out.

---

## Fix

Thread the receiver the call site already resolved down to the node that emits the call.

1. `FunctionTermNode` gains an optional `receiver?: string` — a pre-formatted JS expression the
   call must go *through*. `undefined` means "ordinary function/module call, derive from the
   symbol as before".
2. `FunctionFactorRule` passes `data?.receiver` through to the node.
3. `FunctionTermRule` emits `` `${receiver}.${node.data.name}` `` when a receiver is present,
   and falls back to `formatSymbol(node.data)` otherwise.
4. `VariableFactorRule` supplies `receiver: ownerFormatted` — the value it was already
   computing and discarding.

After the fix both contexts resolve the receiver from the same place (the instance symbol),
so statement and expression forms can no longer disagree.

### Rejected alternatives

- **Special-case `formatSymbol`'s fallback.** This is where the wrong string appeared, but
  `formatSymbol` receives only a `Symbol` — it cannot distinguish "method of a
  function-scoped instance" from "module function" without a symbol table. Patching it would
  be guessing from the shape of a string.
- **Return `PropertyMethodTermNode` (matching `SelfFactorRule`).** Smallest and most symmetric
  change, but `PropertyMethodTermNode` is a plain `Tree` while `FunctionTermNode` extends
  `BaseParameterValidatorNode`. It would have silently dropped arity and typed-argument
  checking on every instance method call in expression context — a real regression, since
  `s.width(1,2,3)` currently reports *"Function width expects 0 arguments, but got 3."*
  (Worth noting `self.method()` genuinely has no such validation today — a separate,
  pre-existing gap this fix does not widen.)
- **Rewrite `fullScope` at clone time** so it records the JS path instead of the lexical
  chain. `fullScope` is part of `Symbols`' O(1) lookup index key and is used for symbol
  resolution throughout the compiler (and in `getSnapshot()` for editor intellisense).
  Overloading it to also mean "JS access path" would couple resolution to codegen and risk
  breaking lookups far from this bug.

---

## Cases fixed beyond the original report

The investigation matrix turned up two shapes the bug report had assumed were safe:

- **Typed function parameters** (`function useit(s as sprite)`). `VariableListRule` registers a
  typed scalar parameter via `symbolTable.clone(name, classSymbol, symbolTypes.Object)` — an
  **Object** symbol, not a `Parameter` symbol — so it hit the identical defect
  (`main.useit.s.width()`). Only the statement form (`s.setAngle(1)`) had been checked.
- **Locals inside class methods**, which emitted `main.go.s` where the correct name is `go_s`.

---

## Verification

- `tests/lib/Basic4WebGL/unit/transpiler/objectInstanceScoping.test.ts` — 18 tests. Before the
  fix: 9 failed / 9 passed, the split falling exactly along broken vs. already-correct paths.
- `cypress/e2e/objectInstanceScoping.cy.ts` — 4 specs asserting **printed values**, not just
  absence of `ERR`, so a program that runs but computes the wrong thing still fails.
  Confirmed non-vacuous: with the one-line receiver pass reverted, all 4 fail.
- Full `npx vitest run`, `npx vite build`, and the complete `npx cypress run` suite pass with
  the four pre-existing specs unmodified.
