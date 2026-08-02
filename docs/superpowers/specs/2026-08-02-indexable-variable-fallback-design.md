# Indexable Variable Fallback Design

## Goal

Fix a pre-existing compiler bug: a plain `dim state` variable that receives a
dictionary or array back from a function call (`state = dict.keys(scores)`,
`state = save.getAll()`) cannot be indexed (`state(i)`, `state["key"]`) —
the parser only allows bracket/paren indexing on variables registered with
symbol-table kind `Dictionary`/`Array` specifically, which requires the
narrower `dim state[]` / `dim state(N)` declaration syntax. Worse, declaring
that way up front doesn't help either: once a name is registered as
`Dictionary`/`Array` kind, the parser locks it to indexed-assignment syntax
only (`state["key"] = ...`) and rejects a bare reassignment of the whole
value (`state = someFunc()` fails to parse: "Expected OpenBracket got
Equals"). Net effect: there is currently no way to capture a dict/array
return value in a variable and then index into it.

This already silently breaks shipped docs: `dictionaries.md`'s "Iterating
over a dictionary" example (`dim k; k = dict.keys(scores); ... k(i)`) does
not actually compile. `save.md`'s `getAll()` example was written around the
limitation using `array.length`/`array.forEachKey`-style helpers instead of
direct indexing, specifically to dodge this bug (see commit `dad4b71`).

## Scope decisions (agreed 2026-08-02)

- **Both read and write get the fallback**, not read-only. `VariableRule.ts`
  already has an identical precedent for this exact shape of problem — a
  `Variable`-kind (or `Parameter`-kind) symbol used with array-style syntax
  falls back to a generic lookup (`VariableRule.ts:174-192`, the pass-by-ref
  array parameter case). Extending that same pattern to also cover
  dictionary writes, and to include plain `dim`-declared variables (not just
  parameters), avoids a surprising asymmetry where `state["k"]` reads but
  `state["k"] = v` doesn't.
- **Token-gated fallback in the parser, not a global `isMatchingType`
  change.** `symbolRules.ts`'s `isMatchingType` already has one special case
  (`expected: "Variable"` matches `actual: "Parameter"`) — widening it
  further to also match `Dictionary`/`Array` actual-kinds against a
  `Variable`/`Array`/`Dictionary` *expected* kind was considered and
  rejected: `VariableRule.ts:76`'s existing `Dictionary` check runs
  *unconditionally*, before looking at the next token, on the assumption
  (true today) that a `Dictionary`-kind symbol is always followed by `[`.
  Blindly widening the matcher would make every plain `dim x` satisfy that
  check and force the parser to demand `[` after `x` in ordinary `x = 5`
  assignments — breaking plain-variable assignment everywhere. The fix
  instead adds an explicit "is the next token actually `[`/`(`?" gate at
  each of the 4 call sites before falling back to a generic `Variable`-kind
  lookup, so behavior for existing code is provably unchanged.
- **Runtime guard only on the new fallback path, not on existing
  strictly-typed access.** Symbols declared via `dim x[]`/`dim x(N)` are
  guaranteed by construction to hold a `Map`/real array at every access —
  today's raw, unguarded codegen (`_sbDictGet`, bare `x[i]`) stays exactly
  as-is for that case, zero added overhead. Only the new
  `Variable`-kind-fallback case can genuinely hold something else at
  runtime, so only that path gets a type check and a beginner-friendly
  error, matching the existing `_sbRequireInit` message style
  (`bootstrapper.html:35`).
- **Multi-dimensional indexing through the fallback path is out of scope.**
  A loosely-typed variable only ever arises from `dim x; x = someFunc()`,
  which is always a flat (1-D) dict or array in every real use case in this
  codebase — multi-dim arrays are always declared explicitly
  (`dim grid(N,M)`), which registers `Array` kind directly and never touches
  the fallback. The new checked helpers guard only the first/outer index;
  a second dimension on a fallback symbol (unrealistic, not something any
  shipped code does) falls through to plain JS indexing same as before.

---

## Architecture

### 1. Parser: token-gated `Variable`-kind fallback at 4 call sites

**Reads — `VariableFactorRule.ts`:**
- Bracket path (`~line 94-95`, dict-style read): already inside a block only
  reached when `check(tokens.OpenBracket, ...)` is true. Change
  `symbolTable.get(name, symbolTypes.Dictionary)` to try `Dictionary` first,
  fall back to `symbolTable.get(name, symbolTypes.Variable)`.
- Paren path (`~line 158`, array-style read): already only reached when the
  next token was `(` (see the early-return `if (!check(tokens.OpenParen,
  ...))` above it). Same fallback: try `Array`, then `Variable`.

**Writes — `VariableRule.ts`:**
- Dict write (`~line 76`): currently `if
  (symbolTable.check(name, symbolTypes.Dictionary))` with no token lookahead.
  Change to: `Dictionary`-kind (unconditional, as today — grammar guarantees
  `[` follows) OR (`Variable`-kind AND next token is `[`). Resolve the
  symbol the same way: `Dictionary` if that's the real kind, else
  `Variable`.
- Array write (`isArrayLike`, `~line 174-177`): currently allows the
  `Parameter`-kind fallback when the next token is `(`. Since
  `isMatchingType` already makes a `Variable`-kind check transparently match
  `Parameter`-kind symbols, replace the `Parameter`-specific condition with
  a `Variable`-kind check (strictly more general, same behavior for
  parameters, now also covers plain `dim` variables). The existing
  fallback symbol resolution (`~line 190-192`) already does
  `symbolTable.get(name, symbolTypes.Variable)` for this branch — no change
  needed there.

A small shared helper avoids duplicating the "try specific kind, else
`Variable`" resolution logic across the 4 sites:

```ts
function resolveIndexableSymbol(
  symbolTable: Symbols,
  name: string,
  preferredKind: string
): Symbol {
  if (symbolTable.check(name, preferredKind)) {
    return symbolTable.get(name, preferredKind);
  }
  return symbolTable.get(name, symbolTypes.Variable);
}
```

Passing a plain `Variable`-kind symbol into `DictionaryLookupNode` /
`ArrayLookupNode` / `DictionaryAssignNode` / `ArrayAssignNode` is already
proven safe by the existing `Parameter`-fallback array-write path: those
nodes/rules only read `.name`/`.type` off the symbol for codegen, and
optional fields like `.classSymbol` are simply `undefined` on a `Variable`
symbol (falls through to the plain, non-typed-element codegen branch
correctly — same as it does today for array parameters).

### 2. Runtime guard: new checked helpers, existing helpers untouched

New helpers in `bootstrapper.html`, alongside `_sbDictGet`/`_sbRequireInit`:

```js
const _sbCheckedDictGet = (val, key, label) => {
  if (!(val instanceof Map)) {
    throw new Error(`'${label}' does not hold a dictionary — cannot read key ${JSON.stringify(key)}.`);
  }
  return _sbDictGet(val, key);
};
const _sbCheckedDictSet = (val, key, value, label) => {
  if (!(val instanceof Map)) {
    throw new Error(`'${label}' does not hold a dictionary — cannot set key ${JSON.stringify(key)}.`);
  }
  val.set(key, value);
};
const _sbCheckedArrayGet = (val, index, label) => {
  if (!Array.isArray(val)) {
    throw new Error(`'${label}' does not hold an array — cannot read index ${index}.`);
  }
  return val[index];
};
const _sbCheckedArraySet = (val, index, value, label) => {
  if (!Array.isArray(val)) {
    throw new Error(`'${label}' does not hold an array — cannot set index ${index}.`);
  }
  val[index] = value;
};
```

Transpiler rules branch on the symbol's actual kind (`node.data.type`,
readable off the `Symbol` the parser attached to the node):

- `DictionaryLookupRule.ts` / `DictionaryAssignRule.ts` / `ArrayLookupRule.ts`
  / `ArrayAssignRule.ts`: if `node.data.type === symbolTypes.Variable`,
  emit the checked helper call with `node.data.name` as `label`; otherwise
  keep today's raw codegen (`_sbDictGet(...)`, `sym.set(...)`, bare
  `sym[i]`) byte-for-byte unchanged.

### 3. Docs

- `save.md`: revert the `getAll()` example back to direct indexing now that
  it works, once verified by transpiling it standalone.
- `dictionaries.md`: re-verify the existing `dict.keys` iteration example
  actually compiles now; no content change expected, just confirmation.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | MODIFY | Fallback to `Variable` kind on the dict-bracket and array-paren read paths |
| `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` | MODIFY | Token-gate + fallback on the dict write path; widen array-write fallback from `Parameter`-only to `Variable` |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/helpers/resolveIndexableSymbol.ts` | CREATE | Shared "try preferred kind, else `Variable`" resolution helper (new `helpers/` dir under `Expressions`, mirroring the existing `transpilerRules/jsRules/helpers/` pattern) |
| `src/components/Runner/bootstrapper.html` | MODIFY | Add `_sbCheckedDictGet`/`_sbCheckedDictSet`/`_sbCheckedArrayGet`/`_sbCheckedArraySet` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts` | MODIFY | Branch to checked helper when symbol kind is `Variable` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts` | MODIFY | Branch to checked helper when symbol kind is `Variable` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLookupRule.ts` | MODIFY | Branch to checked helper when symbol kind is `Variable` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayAssignRule.ts` | MODIFY | Branch to checked helper when symbol kind is `Variable` |
| `src/docs/api-reference/save.md` | MODIFY | Revert `getAll()` example to direct indexing |
| `src/docs/language-guide/dictionaries.md` | VERIFY | Confirm `dict.keys` iteration example compiles; no expected content change |
| `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts` | CREATE | Transpiler-output tests for all 4 call sites |

---

## Tests

- Dict read on a plain `dim`-then-assigned variable: `dim s; s = f(); print(s["k"])` transpiles to `_sbCheckedDictGet(s,"k","s")`.
- Dict write on the same shape: `s["k"] = 1` transpiles to `_sbCheckedDictSet(s,"k",1,"s")`.
- Array read/write, same shape, via `_sbCheckedArrayGet`/`_sbCheckedArraySet`.
- Existing strictly-typed `dim d[]` / `dim a(N)` cases: transpiler output unchanged (still raw `_sbDictGet`/bare indexing, no checked-helper call) — regression guard that the fast path wasn't touched.
- Existing `Parameter`-kind array pass-by-ref case: transpiler output unchanged.
- Plain `dim x; x = 5` assignment still transpiles as ordinary assignment (regression guard for the "blindly widening isMatchingType would break this" scenario called out in Scope decisions).
- Standalone transpile check of `dictionaries.md`'s `dict.keys` example and the reverted `save.md` `getAll()` example — both must compile clean.
- If time permits: one Cypress e2e case if either doc example is also a published tutorial's code sample (check `cypress/e2e/tutorials.cy.ts` — per `CLAUDE.md`, only needed if this touches a *tutorial*, not just an API reference/language-guide doc page).

## Docs

Covered above (Architecture §3, File Map). No roadmap item is closed by
this fix — it's a bug fix restoring documented-but-broken behavior, not a
new tracked feature — so `docs/roadmap.md` / `library-roadmap.md` are not
touched.
