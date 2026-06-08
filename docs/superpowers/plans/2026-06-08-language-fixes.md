# Language Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 language-level issues discovered while writing a Breakout clone: for loop auto-declaration conflict, bare `return`, incorrect docs for equality operators, and confirm/document truthy `if` conditions.

**Architecture:** Three parser/transpiler changes (no new files, no new node types), one documentation update.

**Tech Stack:** TypeScript, Vitest, softBASIC compiler pipeline (lexer → parser → transpiler)

---

## Background

These issues were found by writing practical game code. Understanding them correctly:

1. **For loop + dim conflict**: `ForExpressionRule.ts` calls `symbolTable.add(name, ...)` unconditionally. If the user has already declared `dim i`, this throws `"Variable i in functionname already exists."` The fix is: if the symbol already exists, use it; if not, add it. This also means `for i = 0 to 9` with no prior `dim i` will work fine (adds `i` on the fly).

2. **Bare return**: `ReturnRule.ts` always calls `BoolExpression.parse(...)` after matching `return`. If `return` is followed directly by a newline, the expression parser sees the newline and fails. Fix: check for newline before parsing. `FunctionReturnNode.ts` and `FunctionReturnRule.ts` also need updates to handle zero children.

3. **Docs equality operator**: softBASIC uses `=` for equality comparisons (single equals, BASIC convention). The generated JS uses `==`. The docs incorrectly document the operator as `==` and `!=`. Correct values: `=` (equals), `<>` (not-equals).

4. **Truthy if conditions**: `if gfx.mouseDown()` already works — the `mouseDown` test in `softgfx.test.ts` confirms this. `RelationRule` already returns the left expression when no comparison operator follows, so `if functioncall()` and `if functioncall(arg)` both compile. Fix 4 is a confirmatory test + docs cleanup only.

---

## File Map

| File | Change |
|---|---|
| `src/lib/Basic4WebGL/parserRules/rules/ForExpressionRule.ts` | Check before add |
| `src/lib/Basic4WebGL/nodes/FunctionReturnNode.ts` | Accept null/undefined children |
| `src/lib/Basic4WebGL/parserRules/rules/ReturnRule.ts` | Check for newline before parsing expr |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionReturnRule.ts` | Handle zero children → `return;` |
| `docs/language/softbasic-concepts.md` | Fix `==`/`!=` → `=`/`<>` throughout |
| `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts` | New test file (all 4 fixes) |

---

## Task 1: Bare return support

**Files:**
- Modify: `src/lib/Basic4WebGL/nodes/FunctionReturnNode.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ReturnRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionReturnRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

// ─── Fix 1: Bare return ───────────────────────────────────────────────────────

describe('bare return — early exit from void function', () => {
  test('compiles without error', () => {
    const result = transpile([
      'function guard(x)',
      '  if x = 0',
      '    return',
      '  endif',
      '  print x',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits "return;" with no expression', () => {
    const result = transpile([
      'function guard(x)',
      '  if x = 0',
      '    return',
      '  endif',
      '  print x',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('return;');
  });

  test('return with expression still works', () => {
    const result = transpile([
      'function double(n)',
      '  return n * 2',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('return');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
```

Expected: "bare return — early exit from void function > compiles without error" FAILS with a compilation error.

- [ ] **Step 3: Update `FunctionReturnNode.ts` to accept optional children**

Current content of `src/lib/Basic4WebGL/nodes/FunctionReturnNode.ts`:
```typescript
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.FunctionReturn, data, children);
    this.dataType = children.dataType;
    this.loc = loc;
  }
}

export default FunctionReturnNode;
```

Replace with:
```typescript
import { Tree } from '@CompilerLib/tree';
import BuiltInType from '@CompilerLib/builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree | null, loc?: SourceLocation) {
    super(nodeTypes.FunctionReturn, data, children ? [children] : []);
    this.dataType = children ? children.dataType : new BuiltInType('Unknown');
    this.loc = loc;
  }
}

export default FunctionReturnNode;
```

- [ ] **Step 4: Update `ReturnRule.ts` to check for newline before parsing expression**

Current content of `src/lib/Basic4WebGL/parserRules/rules/ReturnRule.ts`:
```typescript
import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import FunctionReturnNode from '../../nodes/FunctionReturnNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Return')
class ReturnRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Return, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionReturnNode(null, expr, loc);
  }
}

export default ReturnRule;
```

Replace with:
```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import FunctionReturnNode from '../../nodes/FunctionReturnNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Return')
class ReturnRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Return, tokenStream);
    if (check(newLines, tokenStream.current())) {
      matchAndMove(newLines, tokenStream);
      return new FunctionReturnNode(null, null, loc);
    }
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionReturnNode(null, expr, loc);
  }
}

export default ReturnRule;
```

- [ ] **Step 5: Update `FunctionReturnRule.ts` to handle zero children**

Current content of `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionReturnRule.ts`:
```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.FunctionReturn)
class FunctionReturnRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `return ${doChild(node, 0, table)};`;
  }
}

export default FunctionReturnRule;
```

Replace with:
```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.FunctionReturn)
class FunctionReturnRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    if (node.children.length === 0) {
      return 'return;';
    }
    return `return ${doChild(node, 0, table)};`;
  }
}

export default FunctionReturnRule;
```

- [ ] **Step 6: Run tests to verify they pass**

```
npm test -- tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
```

Expected: all 3 bare-return tests PASS.

- [ ] **Step 7: Run full test suite to verify no regressions**

```
npm test
```

Expected: all tests pass. Pay attention to any tests that test `FunctionReturnNode` or `ReturnRule` directly.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/nodes/FunctionReturnNode.ts
git add src/lib/Basic4WebGL/parserRules/rules/ReturnRule.ts
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionReturnRule.ts
git add tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
git commit -m "feat(parser): support bare return for early exit from void functions"
```

---

## Task 2: For loop auto-declaration (use existing var if already declared)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ForExpressionRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts` (add to existing)

**Context:** `ForExpressionRule.ts` already calls `symbolTable.add(name, ...)`. This works fine when `dim i` has NOT been declared. When `dim i` HAS been declared, `add` throws "already exists". The fix is to use the existing symbol when present.

- [ ] **Step 1: Add failing tests to `language-fixes.test.ts`**

Add these tests at the bottom of the file:

```typescript
// ─── Fix 2: For loop with already-declared variable ───────────────────────────

describe('for loop — auto-declares loop variable', () => {
  test('for loop without prior dim compiles', () => {
    const result = transpile([
      'function test()',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('for loop with prior dim i compiles (no duplicate declaration error)', () => {
    const result = transpile([
      'function test()',
      '  dim i',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('for loop variable is accessible inside loop body', () => {
    const result = transpile([
      'function test()',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('test_i');
  });
});
```

- [ ] **Step 2: Run tests to verify the `dim i` + `for i` test fails**

```
npm test -- tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
```

Expected: "for loop with prior dim i compiles" FAILS with a symbol error. The "without prior dim" test may already pass.

- [ ] **Step 3: Update `ForExpressionRule.ts`**

Current content of `src/lib/Basic4WebGL/parserRules/rules/ForExpressionRule.ts`:
```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { symbolTypes } from '../../symbolTypes';
import InNode from '../../nodes/InNode';
import ToNode from '../../nodes/ToNode';
import builtInTypes from '../../builtInTypes';

@RegisterParserRule('ForExpression')
class ForExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    const forSymbol = symbolTable.add(
      name,
      symbolTypes.Variable,
      symbolTable.getScope(),
      builtInTypes.Number
    );
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return new InNode({ var: name, iterator }, [], loc);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const startExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.To, tokenStream);
    const endExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new ToNode(forSymbol, [startExpr, endExpr], loc);
  }
}

export default ForExpressionRule;
```

Replace the `symbolTable.add(...)` call with a check-then-get-or-add:

```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { symbolTypes } from '../../symbolTypes';
import InNode from '../../nodes/InNode';
import ToNode from '../../nodes/ToNode';
import builtInTypes from '../../builtInTypes';

@RegisterParserRule('ForExpression')
class ForExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    const forSymbol = symbolTable.check(name, symbolTypes.Variable)
      ? symbolTable.get(name, symbolTypes.Variable)
      : symbolTable.add(name, symbolTypes.Variable, symbolTable.getScope(), builtInTypes.Number);
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return new InNode({ var: name, iterator }, [], loc);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const startExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.To, tokenStream);
    const endExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new ToNode(forSymbol, [startExpr, endExpr], loc);
  }
}

export default ForExpressionRule;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
```

Expected: all 3 for-loop tests PASS.

- [ ] **Step 5: Run full test suite**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/ForExpressionRule.ts
git add tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
git commit -m "fix(parser): allow for loop variable to reuse existing dim declaration"
```

---

## Task 3: Docs fix — equality operators and truthy if conditions

**Files:**
- Modify: `docs/language/softbasic-concepts.md`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts` (add confirmatory tests)

**Context:** The docs contain several errors:
1. `if x == 10` — wrong. The BASIC equality operator is `=` (single equals). The lexer only has `=` (Equals token). `==` would lex as two `Equals` tokens and cause a parse error.
2. `!=` is listed as not-equals — wrong. The actual not-equals operator is `<>`.
3. The `onkeydown` example uses `if k == 32` — wrong, should be `if k = 32`.
4. The Known Gaps section says `Comparison operators: ==, !=` — needs correcting.

Fix 4 (truthy if): `if gfx.getKeyDown(37)` already compiles correctly — `RelationRule` returns the left expression when no comparison operator follows. This is confirmed by the existing `if gfx.mouseDown()` test. We add a test for the parameterised case.

- [ ] **Step 1: Add confirmatory tests for truthy if**

Add to `tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts`:

```typescript
// ─── Fix 3: Truthy if — already works, this is confirmatory ──────────────────

describe('truthy if — no = true required', () => {
  test('if functioncall() compiles without = true', () => {
    const result = transpile([
      'function isReady()',
      '  return true',
      'endfunction',
      'function test()',
      '  if isReady()',
      '    print "yes"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('if functioncall(arg) compiles without = true', () => {
    const result = transpile([
      'function check(n)',
      '  return n > 0',
      'endfunction',
      'function test()',
      '  if check(37)',
      '    print "key"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the new tests to verify they already pass**

```
npm test -- tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
```

Expected: all truthy-if tests PASS (no code change needed). If they fail, investigate before proceeding.

- [ ] **Step 3: Fix `docs/language/softbasic-concepts.md`**

Apply the following changes to `docs/language/softbasic-concepts.md`:

**3a. Fix the `onkeydown` example (lines ~197–202) — change `==` to `=`:**

Old:
```basic
function onkeydown(k)
    if k == 32          ' Space
        jump()
    endif
    if k == 37          ' Left arrow
        moveLeft()
    endif
endfunction
```

New:
```basic
function onkeydown(k)
    if k = 32          ' Space
        jump()
    endif
    if k = 37          ' Left arrow
        moveLeft()
    endif
endfunction
```

**3b. Fix the Control Flow section `if` example (line ~351) — change `==` to `=`:**

Old:
```basic
if x == 10
    print "ten"
endif
```

New:
```basic
if x = 10
    print "ten"
endif
```

**3c. Fix the Known Gaps section — correct the comparison operators:**

Old:
```markdown
- Comparison operators: `==`, `!=`, `<`, `>`, `<=`, `>=` (inferred from conditionals tests)
```

New:
```markdown
- Comparison operators: `=` (equals), `<>` (not-equals), `<`, `>`, `<=`, `>=`
- Boolean operators: `and`, `or`, `not`
```

(Move Boolean operators out of their own bullet since they're now confirmed, just merge into the operators section.)

**3d. Remove the now-redundant Boolean operators bullet** (it was listed separately — the line `- Boolean operators: and, or, not (inferred from parser rules)` can be removed since we're documenting them in 3c.)

- [ ] **Step 4: Run full test suite**

```
npm test
```

Expected: all tests still pass (docs change only, no code changes in this task).

- [ ] **Step 5: Commit**

```bash
git add docs/language/softbasic-concepts.md
git add tests/lib/Basic4WebGL/unit/transpiler/language-fixes.test.ts
git commit -m "docs: correct equality operator (= not ==) and document truthy if conditions"
```

---

## Final verification

After all tasks are committed:

- [ ] **Run the full test suite one last time**

```
npm test
```

Expected: all tests pass. The new `language-fixes.test.ts` adds tests for: bare return (3 tests), for loop auto-declare (3 tests), truthy if (2 tests) = 8 new tests total.
