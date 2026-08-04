# Class-scope array field indexing via `self` — design note

**Date:** 2026-08-04
**Status:** Shipped
**Scope:** Compiler (parser + transpiler). No softBASIC API surface change, no engine change.

---

## Symptom

A class-scope **array field**, indexed through `self` and read **in expression position**,
transpiled to a JavaScript *function call* instead of an array index:

```basic
Class
dim coins(0)

function readIt()
  dim i
  dim v
  i = 0
  v = self.coins(i)
endfunction
EndClass
```

```js
// emitted (wrong)
readit_v = this.coins(readit_i);
// expected
readit_v = this.coins[readit_i];
```

At runtime this threw `this.coins is not a function`, since `coins` is an array.

Zero compile diagnostics — like the two other compiler bugs found in the same session, it
compiled clean and failed only when the game ran.

What made it look arbitrary is that the *same field in the same class* was handled correctly
in two neighbouring forms:

```js
array.push(this.coins, spawn_n);   // bare field, no index    — always correct
this.coins[writeit_i] = 99;        // indexed WRITE           — always correct
readit_v = this.coins(readit_i);   // indexed READ            — wrong
```

---

## Root cause

softBASIC spells array indexing and method calls **identically**: `name(args)`. Nothing in the
token stream distinguishes `self.coins(0)` (index into an array field) from `self.getHp(0)`
(call a method). Resolving the ambiguity therefore requires knowing what kind of member
`coins` is — which means asking the symbol table.

Two different parser rules handle `self.member(...)`, depending on grammatical context, and
only one of them had a way to settle the ambiguity.

**Statement context** — `SelfRule`. Disambiguates *syntactically*, on lookahead alone:

```ts
if (check(tokens.OpenParen, tokenStream.current())) {
  const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
  if (check(tokens.Equals, tokenStream.current())) {
    // self.arr(i) = value  → only an array write can be followed by `=`
    return new SelfArrayAssignNode({ chain }, [args, expr], loc);
  }
  return new PropertyMethodCallNode(chain, args, loc);   // self.method(args)
}
```

A trailing `=` is decisive: a method call can never appear on the left of an assignment. So
**writes were always correct**, and `SelfArrayAssignNode`/`SelfArrayAssignRule` — the machinery
for emitting `this.coins[i] = v` — already existed.

**Expression context** — `SelfFactorRule`. Has no trailing token to look at, and simply
assumed:

```ts
if (check(tokens.OpenParen, tokenStream.current())) {
  // self.method(args) in expression context
  const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
  return new PropertyMethodTermNode(chain, args, loc);   // unconditional
}
```

Every `self.x(...)` in expression position became a method call. There was no array branch at
all, and no symbol lookup on the `(` path — even though the very same rule already performed a
class-scope symbol lookup a few lines further down, to recover the `dataType` of a *non*-indexed
`self.property` read. The information needed to settle the ambiguity was already being fetched
by this rule for a different purpose; the ambiguous path just never asked for it.

**In one sentence:** the statement form could disambiguate array-index from method-call using a
trailing `=`, and the expression form — which has no such token and must consult the symbol
table instead — never did, so it resolved every ambiguous case the same way.

This is why the bug survived: every shipped tutorial that touches a class-scope array either
passes it whole to an `array.*` function (bare, unambiguous) or writes to it by index
(disambiguated by `=`). Reading one back by index inside a method is what the coins-platformer
demo needed, and nothing before it had done that.

---

## Fix

Give the expression path the same decisiveness the statement path gets for free, by resolving
the member's *kind* before choosing a node.

1. New helper `resolveSelfMember(symbolTable, memberName, kind, accept?)`
   (`parserRules/rules/Expressions/helpers/resolveSelfMember.ts`) — looks a `self.` member up in
   the **enclosing class's own scope**, walking the inheritance chain. Deliberately class-scoped
   rather than using ordinary innermost-first resolution: a local may share the member's name,
   and `self.x` must always mean the class's `x`.
2. `SelfFactorRule`'s `(` branch resolves the member and emits an index only when it is
   provably an `Array`-kind class member and provably **not** a method:

   ```ts
   const isMethod   = resolveSelfMember(symbolTable, memberName, symbolTypes.Function) !== undefined;
   const arraySymbol = isMethod ? undefined
                                : resolveSelfMember(symbolTable, memberName, symbolTypes.Array);
   ```

   **A method of that name always wins.** This ordering is what makes the change safe: no
   `self.x(...)` that compiles today can change meaning, because the only calls that get
   re-routed are those where no method of that name exists anywhere in the class chain.
3. New `SelfArrayLookupNode` + `SelfArrayLookupRule`, the read-side mirror of the existing
   `SelfArrayAssign` pair, emitting `this.coins[i]` and chaining subscripts for multi-dimensional
   fields (`this.grid[1][2]`) exactly as the write rule already does.
4. The pre-existing `dataType` walk further down `SelfFactorRule` was folded onto the same
   helper, so the two class-scope lookups in this rule cannot drift apart. Its original
   semantics are preserved exactly via the helper's `accept` predicate, which keeps walking past
   an ancestor declaration that carried no type of its own.

`SelfArrayLookupNode` reports the resolved field's `dataType` to the type checker, mirroring
what `ArrayLookupNode` does for non-`self` arrays.

### Rejected alternatives

- **Emit an index whenever the member is an array, ignoring methods.** Simpler, but it silently
  inverts precedence if a class ever has both a method and an array field of one name. Checking
  `Function` first costs one lookup and makes the change provably non-breaking for existing code.
- **Reuse `ArrayLookupNode`.** It renders its receiver with `formatSymbol(symbol)`, which
  produces a declaration path (`scene.coins`), not the `this.`-rooted access path a class field
  needs — the same declaration-path-vs-access-path confusion that caused the object-instance
  receiver bug fixed earlier in this session. A dedicated node keeps the chain string as the
  single source of truth for the receiver, matching `SelfArrayAssignNode`.
- **Disambiguate in the transpiler instead of the parser.** By then the node type has already
  committed to "call"; the symbol table is still reachable, but the decision belongs where the
  ambiguity is first resolvable.

---

## Investigation findings beyond the original report

The bug report asked whether three neighbouring shapes were affected. Two assumptions in it were
wrong, in the *safe* direction:

- **Indexed writes (`self.arr(i) = v`) are NOT affected.** Assumed possibly broken; verified
  correct, for the structural reason above (the trailing `=`). Now pinned by regression tests
  rather than left to chance.
- **Class-scope dictionary fields are affected, but differently than the array case.** The
  hypothesis in the report was that `d["key"]`'s bracket syntax is already unambiguous and so
  dicts are fine. The syntax *is* unambiguous — but `SelfFactorRule` and `SelfRule` have no
  `OpenBracket` branch at all, so `self.scores["a"]` is simply **unimplemented** in both
  directions:
  - read → `Expected NewLine,EndOfFile,SoftNewLine got OpenBracket`
  - write → `Expected Equals got OpenBracket`

  This is a **loud compile error, not a silent miscompile** — a missing feature rather than this
  bug. Left unfixed and tracked (roadmap #14) rather than folded in here.
- **Array fields accessed from outside the class** (`someInstance.items(0)`) are likewise
  unimplemented and loud, not silently wrong: read → `Function items ... has not been declared
  yet`, write → `Expected NewLine,EndOfFile,SoftNewLine got Equals`. Tracked as roadmap #14.
- **`self.arr(0).member()`** (member access on an array element via `self`) is also unimplemented
  and loud — `TypedElementAccessNode` supports this shape for non-`self` arrays only. Tracked as
  roadmap #14.

Shapes confirmed broken *and fixed* beyond the plain assignment in the report: reads in
arithmetic, in comparisons/`if`, in `while` conditions, as `print` and module-function
arguments, in `return`, nested as their own index, multi-dimensional fields, reads inside
**constructors**, and **inherited** array fields declared on a parent class.

One unrelated pre-existing defect was observed while probing and deliberately **not** touched:
a constructor-local `dim v` emits `constructor_v = undefined` on declaration but
`constructor.v = ...` on assignment. It is independent of arrays and out of scope here.

---

## Verification

- `tests/lib/Basic4WebGL/unit/transpiler/selfArrayFieldAccess.test.ts` — 29 tests. Confirmed
  non-vacuous: with the array branch disabled, 16 fail / 13 pass, the split falling exactly
  along broken vs. already-correct paths.
- `cypress/e2e/selfArrayFieldAccess.cy.ts` — 3 specs asserting **printed values**, not just
  absence of `ERR`, so a program that runs but computes the wrong thing still fails. Each spec
  writes values through `self.arr(i) = v` and reads them back through `self.arr(i)`, so a
  regression in either direction changes the output. Confirmed non-vacuous: with the fix
  disabled, all 3 fail.
- Full `npx vitest run` (1095 passed, 1 skipped), `npx vite build`, and the complete
  `npx cypress run` suite (28 tests across 6 specs) pass, with all five pre-existing specs
  unmodified.
