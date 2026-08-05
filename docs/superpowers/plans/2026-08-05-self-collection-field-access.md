# Self/Instance Collection Field Access — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close deferred roadmap issue #14 (`docs/roadmap.md`) — three related parse gaps around class-scope array/dictionary fields:

- **(a)** `self.scores["a"]` — dictionary field read/write through `self` (currently a parse error; only plain-index array fields work today, per issue #13).
- **(b)** `someInstance.items(0)` / `someInstance.scores["a"]` — array/dict field read/write on an instance from **outside** its own class.
- **(c)** `self.bullets(0).getX()` — chaining a method call onto an element read out of a `self` array field, for arrays of a class type (the same "typed element access" shape that already works for ordinary non-`self` arrays).

All three fail today as **loud compile-time parser errors**, not silent miscompiles — this is genuinely missing grammar, not a bug fix.

**Architecture:**

Two existing chain-based nodes already solve most of this problem for `self`-only plain arrays (shipped for issue #13): `SelfArrayLookupNode`/`SelfArrayLookupRule` (read) and `SelfArrayAssignNode`/`SelfArrayAssignRule` (write). Both take a `chain` string (e.g. `"this.coins"`) rather than a symbol-derived path, which means **they are not actually self-specific** — the `chain` is just whatever JS receiver expression the caller builds. That's the key leverage point: shapes (a) and (b) don't need new self-specific machinery, they need the *same* pattern applied to more call sites and (for dicts) a new pair of dict-flavoured nodes built the same way.

Symbol resolution differs by shape but both paths already exist in the codebase:
- **Self members** resolve via `resolveSelfMember()` (`parserRules/rules/Expressions/helpers/resolveSelfMember.ts`), which walks the *current* class's inheritance chain.
- **Instance members from outside the class** resolve via `Symbols.getInScope(memberName, kind, instanceVarName)` — `DimRule`'s `symbolTable.clone()` already flattens every class member (including inherited ones) into a scope keyed by the instance variable's own bare name at `dim` time, which is exactly how method calls on external instances already resolve (`VariableFactorRule`'s `symbolTable.setScope(name)` before delegating to `FunctionFactor`). No new resolution helper is needed for (b) — just the same `getInScope` lookup, wrapped in try/catch the way `resolveSelfMember` already does.

Shape (c) reuses `TypedElementAccessNode`/`TypedElementAccessRule`, which already implements "index into a typed-element array/dict, then chain a member/method call" for the ordinary non-`self` case (`someArray(0).getX()`). It currently only knows how to build its receiver from a `collectionSymbol` via `formatSymbol()`, which produces a class/module-scoped path, not `this.x`. It gets a small extension: accept an optional pre-built `chain` string (and `name` for the error label) as an alternative to `collectionSymbol`, so the `self` path can reuse the exact same node and transpiler rule instead of forking a parallel one.

**Disambiguation rule (unchanged from #13):** a method of the same name always wins. `self.bullets(...)` / `someInstance.bullets(...)` only routes to array-indexing when the symbol table can prove, ahead of parsing the parenthesised args, that `bullets` is a declared `Array`-kind member and *not* a `Function`-kind member — exactly the existing check in `SelfFactorRule`. No `self.x(...)` or `instance.x(...)` that compiles today can change meaning.

**Scope boundary:** (c) is implemented for `self` only, matching the reported issue. Chaining a method call onto a typed array/dict **element** read through an *external* instance (`someInstance.bullets(0).getX()`) is a natural follow-on but is not one of the three reported shapes — noted as a new parking-lot item rather than folded in here, to avoid scope creep.

**Tech Stack:** TypeScript compiler (lexer/parser/transpiler), Vitest.

Spec: none written separately — this plan doc carries the full design, following the precedent of `docs/superpowers/plans/2026-08-04-self-array-field-indexing-design.md`'s sibling issues.

---

### Task 1: Self dictionary field access — read (`self.scores["a"]`)

**Files:**
- New: `src/lib/Basic4WebGL/nodes/SelfDictLookupNode.ts`
- New: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SelfDictLookupRule.ts`
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts` (add `SelfDictLookup`)
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/selfDictFieldAccess.test.ts`

- [ ] **Step 1: Write failing tests** covering: `self.scores["a"]` used in a `print`/arithmetic expression compiles to `_sbDictGet(this.scores,"a")`; the existing `self.method(args)` and `self.arr(i)` (issue #13) paths are unaffected; a class-scope `dim scores` (Dictionary) field read through `self` inside an inherited method (ancestor-declared field) also resolves.
- [ ] **Step 2: Add `SelfDictLookup` to `nodeTypes.ts`.**
- [ ] **Step 3: Add `SelfDictLookupNode`** — mirrors `SelfArrayLookupNode` exactly: `data: { chain: string; symbol: Symbol }`, sets `this.dataType = data.symbol.dataType`.
- [ ] **Step 4: Add `SelfDictLookupRule`** — `generate()` returns `` `_sbDictGet(${node.data.chain},${doChild(node, 0, table)})` `` (mirrors the untyped branch of `DictionaryLookupRule`, since a resolved class-scope Dictionary symbol is always strictly typed — no need for the checked/Variable-fallback branch that plain `dim` variables need).
- [ ] **Step 5: Wire into `SelfFactorRule.ts`** — add an `OpenBracket` branch *before* the existing `OpenParen` branch (brackets are unambiguous, no symbol lookup needed to decide *whether* to branch, but the resolved `Dictionary` symbol is still needed for `dataType`):
  ```ts
  if (check(tokens.OpenBracket, tokenStream.current())) {
    matchAndMove(tokens.OpenBracket, tokenStream);
    const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(tokens.CloseBracket, tokenStream);
    const dictSymbol = resolveSelfMember(symbolTable, memberName, symbolTypes.Dictionary);
    if (!dictSymbol) {
      throw new CompilationError(`'${memberName}' is not a declared dictionary field`);
    }
    return new SelfDictLookupNode({ chain, symbol: dictSymbol }, [keyExpr], loc);
  }
  ```
- [ ] **Step 6: Run `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/selfDictFieldAccess.test.ts`** and the full suite to confirm no regressions (`objectInstanceScoping.test.ts`, `selfArrayFieldAccess.test.ts` in particular).

### Task 2: Self dictionary field access — write (`self.scores["a"] = v`)

**Files:**
- New: `src/lib/Basic4WebGL/nodes/SelfDictAssignNode.ts`
- New: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SelfDictAssignRule.ts`
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts` (add `SelfDictAssign`)
- Modify: `src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts`
- Test: extend `tests/lib/Basic4WebGL/unit/transpiler/selfDictFieldAccess.test.ts`

- [ ] **Step 1: Write failing tests** — `self.scores["a"] = 10` compiles to `` this.scores.set("a",10); ``; existing `self.property = expr` and `self.arr(i) = v` statement forms unaffected.
- [ ] **Step 2: Add `SelfDictAssign` node type, `SelfDictAssignNode`** (plain `Tree`, `data: { chain: string }` — mirrors `SelfArrayAssignNode`, no symbol needed since the write side doesn't need `dataType`, matching the array-write precedent).
- [ ] **Step 3: Add `SelfDictAssignRule`** — `` `${node.data.chain}.set(${doChild(node,0,table)},${doChild(node,1,table)});` `` (mirrors the untyped branch of `DictionaryAssignRule`).
- [ ] **Step 4: Wire into `SelfRule.ts`** — add an `OpenBracket` branch before the existing `OpenParen` branch:
  ```ts
  if (check(tokens.OpenBracket, tokenStream.current())) {
    matchAndMove(tokens.OpenBracket, tokenStream);
    const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(tokens.CloseBracket, tokenStream);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);
    return new SelfDictAssignNode({ chain }, [keyExpr, expr], loc);
  }
  ```
- [ ] **Step 5: Run tests.**

### Task 3: External instance array/dict field access — read (`someInstance.items(0)`, `someInstance.scores["a"]`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` (the `symbolTypes.Object` branch)
- Test: `tests/lib/Basic4WebGL/unit/transpiler/instanceCollectionFieldAccess.test.ts`

- [ ] **Step 1: Write failing tests** — a class with an `Array` field and a `Dictionary` field, instantiated at module scope and read from outside via `enemy.hitpoints(0)` / `enemy.flags["stunned"]` in an expression (e.g. `print`, arithmetic); a same-named **method** on another instance is unaffected (`ship.getScore()` still calls, doesn't index); an external read of a **non-existent** member still throws the natural "has not been declared" error.
- [ ] **Step 2: Bracket branch** — in the `symbolTable.check(name, symbolTypes.Object)` block, after computing `ownerFormatted`/before the existing `Dot` check, add:
  ```ts
  if (check(tokens.OpenBracket, tokenStream.current())) {
    matchAndMove(tokens.OpenBracket, tokenStream);
    const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(tokens.CloseBracket, tokenStream);
    // handled after the member-name Dot below — see restructure note
  }
  ```
  Note: brackets/parens apply to the *member*, not the owner, so this actually has to be added after `matchAndMove(tokens.Dot, ...); matchAndMove(tokens.Variable, ...)` consumes `memberName` — restructure the existing `if (!check(Dot...))` / `matchAndMove(Dot)` / member-read block so bracket and paren checks sit side by side there, in this order: bracket (dict) → paren (array-or-method, existing branch, modified per Step 3) → dot-chain (existing) → bare property (existing).
  For the bracket branch: resolve via `let dictSymbol; try { dictSymbol = symbolTable.getInScope(memberName, symbolTypes.Dictionary, name); } catch { dictSymbol = undefined; }`; if found, `return new SelfDictLookupNode({ chain: `${ownerFormatted}.${memberName}`, symbol: dictSymbol }, [keyExpr], loc)` (the "Self" nodes are chain-generic, see Architecture — reused here for an external instance, not `self`).
- [ ] **Step 3: Paren branch disambiguation** — before delegating to `FunctionFactor` (the existing method-call path), try `symbolTable.getInScope(memberName, symbolTypes.Array, name)` in a try/catch. If it resolves, parse the `ExpressionList` args directly (don't call `FunctionFactor`) and return `new SelfArrayLookupNode({ chain: `${ownerFormatted}.${memberName}`, symbol: arraySymbol }, [args], loc)`. Otherwise fall through to the existing `symbolTable.setScope(name)` / `FunctionFactor` call unchanged.
- [ ] **Step 4: Run tests**, plus the full suite — this touches a hot, well-covered path (`objectInstanceScoping.test.ts` exercises the exact branch being restructured), so watch for regressions there specifically.

### Task 4: External instance array/dict field access — write (`someInstance.items(0) = v`, `someInstance.scores["a"] = v`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ObjectPropertyRule.ts`
- Test: extend `tests/lib/Basic4WebGL/unit/transpiler/instanceCollectionFieldAccess.test.ts`

- [ ] **Step 1: Write failing tests** — `enemy.hitpoints(0) = 50` / `enemy.flags["stunned"] = true` as statements compile correctly; `enemy.attack(target)` (plain method call statement) is unaffected; the pre-existing property-assignment and chained-method-call forms are unaffected.
- [ ] **Step 2: Bracket branch** — add before the existing `OpenParen` check: parse `[keyExpr]`, require `=`, parse the RHS expression, return `new SelfDictAssignNode({ chain: `${ownerFormatted}.${memberName}` }, [keyExpr, expr], loc)`.
- [ ] **Step 3: Paren branch disambiguation** — same pattern as Task 3 Step 3 but for the write side, matching how `SelfRule` already disambiguates: resolve `arraySymbol` via `getInScope(memberName, Array, ownerName)` (try/catch) *before* parsing args; after parsing `ExpressionList` args, if `arraySymbol` **and** the next token is `Equals`, consume `=`, parse the RHS, and return `new SelfArrayAssignNode({ chain }, [args, expr], loc)` — otherwise fall through to the existing method-call-statement return unchanged.
- [ ] **Step 4: Run tests.**

### Task 5: Chained call on a self typed-array element (`self.bullets(0).getX()`)

**Files:**
- Modify: `src/lib/Basic4WebGL/nodes/TypedElementAccessNode.ts` (doc comment only — data shape already `any`)
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedElementAccessRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/selfTypedElementAccess.test.ts`

- [ ] **Step 1: Write failing tests** — a class with `dim bullets(3) as Bullet` (typed array field): `self.bullets(0).getX()` in expression context (e.g. `print string.str(self.bullets(0).getX())`) and as a bare statement (`self.bullets(0).explode()`); confirm a same-shaped call on a **non-typed** array field (`self.coins(i)`, from issue #13) is unaffected; confirm ordinary non-`self` typed-array chaining (`bullets(0).getX()`, already shipped) is unaffected by the `TypedElementAccessRule` change.
- [ ] **Step 2: Extend `TypedElementAccessRule.generate()`** to accept either receiver shape:
  ```ts
  const { collectionSymbol, chain, memberName, kind, isStatement } = node.data;
  const name = node.data.name ?? collectionSymbol.name;
  const idx = doChild(node, 0, table);
  const formatted = chain ?? formatSymbol(collectionSymbol);
  ```
  (rest of the method unchanged — `ref`/`label`/`wrapped` derivation is already generic over `formatted`/`name`).
- [ ] **Step 3: Wire into `SelfFactorRule.ts`'s existing `arraySymbol` branch** (expression context) — when `arraySymbol.classSymbol` is set (a typed-element array) and the next token after the index args is `Dot`, parse `.innerMember(...)` / `.innerMember` and emit `TypedElementAccessNode({ chain: \`this.${memberName}\`, name: memberName, memberName: innerMember, kind: 'array', isStatement: false }, [args, innerArgs?], loc)` instead of `SelfArrayLookupNode`. Non-chained reads (no following `Dot`) keep returning `SelfArrayLookupNode` exactly as today.
- [ ] **Step 4: Wire into `SelfRule.ts`'s statement path`** — this rule currently has **no** arraySymbol-aware branch at all (only the trailing-`=` array-assign case exists). Add the same `resolveSelfMember(Function)` / `resolveSelfMember(Array)` disambiguation used in `SelfFactorRule`/#13, before parsing args: if `arraySymbol` resolves and, after parsing the index args, the next token is `Dot`, parse the chained call and emit `TypedElementAccessNode(..., isStatement: true, ...)`; otherwise fall through to the existing `Equals` (array-assign) / method-call-statement logic unchanged.
- [ ] **Step 5: Run tests.**

### Task 6: Full-suite regression pass + docs/roadmap update

- [ ] **Step 1:** `npx vitest run` — full suite green.
- [ ] **Step 2:** `npx vite build` — verify build.
- [ ] **Step 3:** Manually smoke-test in the running app (`npm run dev`) with a small scratch class exercising all three shapes together (a typed `Bullet` class, an `Enemy` class with array + dict fields, one external instance) — this is compiler/parser surface, not covered by the Cypress e2e suite's tutorial/demo scope, so this is the only real-runtime check available; no tutorial or demo needs updating.
- [ ] **Step 4: Update `docs/roadmap.md` issue #14** — mark resolved with a summary paragraph in the same style as #13/#15's entries (what shipped, what was found along the way, test files, any newly-surfaced follow-on limitation — e.g. note the external-instance typed-element-chaining boundary from the Architecture section as a new, explicitly small, open item rather than silently dropping it).
- [ ] **Step 5: `src/docs/roadmap.md`** (public-facing roadmap summary) — check whether it references this gap; update only if it does, per `CLAUDE.md`'s instruction that this file must independently stay current.
- [ ] **Step 6: Version bump** — per `CLAUDE.md`, this is a compiler bug-fix/feature closing a tracked roadmap item, not a milestone close-out, so it's a **patch** bump (`0.x.Y`) with a `src/docs/release-notes.md` entry, done only when explicitly asked to push.

---

## Notes for the implementing agent

- Every new/modified parser branch must preserve the **"method always wins"** rule from issue #13 — never resolve a member as a collection field without first proving (via `resolveSelfMember`/`getInScope` against `Function` kind, or by simple absence-of-match) that no method of that name exists. This is what makes each change provably non-breaking for code that compiles today.
- `SelfArrayLookupNode`, `SelfArrayAssignNode`, and the new `SelfDictLookupNode`/`SelfDictAssignNode` are **chain-generic**, not self-exclusive — reusing them for the external-instance case in Tasks 3–4 (rather than writing parallel `Instance*` nodes) is intentional and keeps the node count from doubling. Consider a short doc-comment update on all four acknowledging they're used for both receivers now, so a future reader isn't misled by the `Self*` name.
- Follow the existing test style in `selfArrayFieldAccess.test.ts` / `objectInstanceScoping.test.ts`: assert on the exact generated JS string for the new nodes/rules, and keep a matching "before fix" failure-mode assertion where practical so the tests are demonstrably non-vacuous.
- No engine/runtime JS files need changes — this is 100% parser/transpiler surface (lexer, symbol resolution, node/rule pairs). No `.bas` def file, engine module, or docs API reference page is affected, since nothing here changes softBASIC's public library API — it's a language-grammar gap, same classification as issue #13.
