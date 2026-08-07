# Array Literal Syntax Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline array-literal syntax to softBASIC — `{1, 2, 3}` / `{"walls", "obstacles"}` — usable anywhere an expression is legal, including directly as a function-call argument.

**Architecture:** softBASIC's expression grammar is a precedence chain that always bottoms out at `FactorRule` (`src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`). Adding a new branch there for a `{`/`}`-delimited comma list — a new `ArrayLiteralNode` built by a new `ArrayLiteralRule` parser rule — makes literals legal everywhere an expression is legal with no other grammar changes. The transpiler side is a single new rule that emits a plain JS array literal via the existing `concatChildren` helper, so nested literals and call-argument usage fall out for free. `{`/`}` was chosen over `[`/`]` because softBASIC already spends `[`/`]` on dictionary syntax (`dim d[]`, `d["key"]`) while arrays use `(`/`)` for both declaration and indexing (`dim arr(N)`, `arr(i)`) — reusing `[`/`]` for literals too would make the same bracket carry two unrelated meanings. `{`/`}` is unused today and leaves `{"key": "value"}` as the natural future dict-literal syntax. Decision logged in `docs/roadmap.md`'s Perpetual parking lot.

**Tech Stack:** TypeScript, the hand-rolled recursive-descent lexer/parser/transpiler in `src/lib/CompilerLib/` and `src/lib/Basic4WebGL/`, Vitest for tests.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/Basic4WebGL/tokens.ts` | Add `OpenBrace`/`CloseBrace` token definitions |
| `src/lib/Basic4WebGL/TokenResolver.ts` | Lex `{` and `}` into the new tokens |
| `src/lib/Basic4WebGL/nodeTypes.ts` | Add the `ArrayLiteral` node type |
| `src/lib/Basic4WebGL/nodes/ArrayLiteralNode.ts` *(new)* | AST node for an array literal |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/ArrayLiteralRule.ts` *(new)* | Parses `{ expr, expr, ... }` into an `ArrayLiteralNode` |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts` | Add the `OpenBrace` branch that delegates to `ArrayLiteralRule` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLiteralRule.ts` *(new)* | Emits a JS array literal `[...]` |
| `tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts` | New token cases for `{`/`}` |
| `tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts` *(new)* | End-to-end compile tests for the feature |
| `src/docs/language-guide/arrays.md` | New "Array Literals" section |
| `docs/roadmap.md` | Mark the parking-lot entry shipped |

Both new parser/transpiler rule files are auto-registered — `src/lib/Basic4WebGL/parserRules/autoload.ts` and `src/lib/Basic4WebGL/transpilerRules/autoload.ts` both `import.meta.glob` every file under their respective `rules/`/`jsRules/ruleSets/` directories eagerly, so no manual registration step is needed beyond using the `@RegisterParserRule(...)` / `@RegisterTranspilerRule(...)` decorators in the new files, exactly as every existing rule does.

---

### Task 1: Lex `{` and `}` as `OpenBrace`/`CloseBrace` tokens

**Files:**
- Modify: `src/lib/Basic4WebGL/tokens.ts:17-20`
- Modify: `src/lib/Basic4WebGL/TokenResolver.ts:71-94`
- Test: `tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts`

- [ ] **Step 1: Write the failing tests**

Add two cases to the existing `operators` describe block in `tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts` (right after the `[',', tokens.Comma.name]` line):

```ts
describe('operators', () => {
  test.each([
    ['+',  tokens.Add.name],
    ['-',  tokens.Subtract.name],
    ['*',  tokens.Multiply.name],
    ['/',  tokens.Divide.name],
    ['=',  tokens.Equals.name],
    ['<',  tokens.LessThan.name],
    ['>',  tokens.GreaterThan.name],
    ['<=', tokens.LessThanEqualTo.name],
    ['>=', tokens.GreaterThanEqualTo.name],
    ['<>', tokens.NotEquals.name],
    ['(',  tokens.OpenParen.name],
    [')',  tokens.CloseParen.name],
    ['.',  tokens.Dot.name],
    [',',  tokens.Comma.name],
    ['{',  tokens.OpenBrace.name],
    ['}',  tokens.CloseBrace.name],
  ])('"%s" produces a %s token', (source, expectedName) => {
    expect(lex(source)[0].token.name).toBe(expectedName);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts`
Expected: FAIL — `tokens.OpenBrace` and `tokens.CloseBrace` are `undefined` (property doesn't exist on the `tokens` enum yet), so `expectedName` is `undefined` and/or lexing `{`/`}` throws `Unexpected token {`.

- [ ] **Step 3: Add the tokens**

In `src/lib/Basic4WebGL/tokens.ts`, add `'OpenBrace'` and `'CloseBrace'` right after `'CloseBracket'`:

```ts
export const tokens = createKeyValueEnum<TokenMatch>([
  'EndOfFile',
  'Error',
  'WhiteSpace',
  'Comment',
  'NewLine',
  'SoftNewLine',
  'Number',
  'String',
  'Add',
  'Subtract',
  'Divide',
  'Multiply',
  'OpenParen',
  'CloseParen',
  'OpenBracket',
  'CloseBracket',
  'OpenBrace',
  'CloseBrace',
  'Equals',
  // ...unchanged from here down
```

- [ ] **Step 4: Add the resolver rules**

In `src/lib/Basic4WebGL/TokenResolver.ts`, add two new resolver entries right after the existing `CloseBracket` rule (after the block matching `]`, before the `Equals` block):

```ts
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, ']'),
      token: tokens.CloseBracket,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '{'),
      token: tokens.OpenBrace,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '}'),
      token: tokens.CloseBrace,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchString(input, '=='),
      token: tokens.Equals,
    }),
  },
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts`
Expected: PASS (all cases, including the two new ones)

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/TokenResolver.ts tests/lib/Basic4WebGL/unit/lexer/tokens.test.ts
git commit -m "feat: lex { and } as OpenBrace/CloseBrace tokens"
```

---

### Task 2: `ArrayLiteral` node type and AST node

This task is pure scaffolding — nothing constructs an `ArrayLiteralNode` yet, so there is no observable behavior to test until Task 3 wires the parser rule in. Verify with a build instead (per this repo's convention: `npx vite build` is the canonical "does this compile" check, not `tsc --noEmit`).

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts:29-31`
- Create: `src/lib/Basic4WebGL/nodes/ArrayLiteralNode.ts`

- [ ] **Step 1: Add the node type**

In `src/lib/Basic4WebGL/nodeTypes.ts`, add `'ArrayLiteral'` right after `'ArrayList'`:

```ts
  'VariableList',
  'ExpressionList',
  'ArrayList',
  'ArrayLiteral',
  'ArrayLookup',
```

- [ ] **Step 2: Create the node**

Create `src/lib/Basic4WebGL/nodes/ArrayLiteralNode.ts`, modeled on `ArrayAssignNode.ts` (which explicitly types itself as `Variant`, matching how the rest of the array system is untyped end-to-end):

```ts
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ArrayLiteralNode extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ArrayLiteral, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default ArrayLiteralNode;
```

- [ ] **Step 3: Verify it builds**

Run: `npx vite build`
Expected: build succeeds (no TypeScript errors, no unused-file warnings — the file isn't imported anywhere yet, which is fine at this stage).

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/nodeTypes.ts src/lib/Basic4WebGL/nodes/ArrayLiteralNode.ts
git commit -m "feat: add ArrayLiteral node type and AST node"
```

---

### Task 3: Parser rule for `{ expr, expr, ... }`

Still scaffolding-only from a test-visibility standpoint: once this task wires `FactorRule` to recognize `{`, parsing succeeds, but transpiling still fails (no transpiler rule registered for `ArrayLiteral` yet), so `compiler.transpile` results would show a diagnostic either way. The first real green test comes in Task 4. Verify this task with a build.

**Files:**
- Create: `src/lib/Basic4WebGL/parserRules/rules/Expressions/ArrayLiteralRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts:31-41`

- [ ] **Step 1: Create the parser rule**

Create `src/lib/Basic4WebGL/parserRules/rules/Expressions/ArrayLiteralRule.ts`, modeled directly on `ExpressionListRule.ts`'s comma-loop (same empty-case handling, same brace-instead-of-paren delimiters), but parsing elements as full `BoolExpression`s (matching how call arguments are parsed) rather than the narrower `Expression` used for array *index* lists in `ArrayListRule.ts`:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLiteralNode from '@Basic4WebGL/nodes/ArrayLiteralNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('ArrayLiteral')
class ArrayLiteralRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.OpenBrace, tokenStream);

    if (check(tokens.CloseBrace, tokenStream.current())) {
      matchAndMove(tokens.CloseBrace, tokenStream);
      return new ArrayLiteralNode(null, [], loc);
    }

    const elems = [
      getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      elems.push(
        getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined)
      );
    }
    matchAndMove(tokens.CloseBrace, tokenStream);
    return new ArrayLiteralNode(null, elems, loc);
  }
}

export default ArrayLiteralRule;
```

- [ ] **Step 2: Wire it into `FactorRule`**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`, add a new branch immediately after the existing `OpenParen` block (after the `return new ParenNode(null, expr, loc);` / closing `}` at line 41, before the `Call` check at line 42):

```ts
    if (check(tokens.OpenParen, tokenStream.current())) {
      matchAndMove(tokens.OpenParen, tokenStream);

      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseParen, tokenStream);
      return new ParenNode(null, expr, loc);
    }
    if (check(tokens.OpenBrace, tokenStream.current())) {
      return getParserRule('ArrayLiteral').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
    if (check(tokens.Call, tokenStream.current())) {
```

This is the only grammar insertion point needed. Because every higher-precedence rule (`BoolExpression` → `Not` → `BoolTerm` → `BoolFactor` → `Relation` → `Expression` → `Term` → `Factor`) unconditionally delegates down to `Factor`, and because function-call arguments are parsed via `ExpressionListRule`'s own `getParserRule('BoolExpression')` calls, this one change makes `{...}` legal as a `dim` RHS, an assignment RHS, a nested literal element, and a bare call argument — with no other parser file needing changes.

- [ ] **Step 3: Verify it builds**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/ArrayLiteralRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts
git commit -m "feat: parse { expr, expr, ... } as an array literal in expression position"
```

---

### Task 4: Transpiler rule + end-to-end tests

This is where the feature becomes observable. Write the full test file first (RED — every test fails because `getTranspilerRule` has no entry for the `ArrayLiteral` node type, so `compiler.transpile` catches that internal error and returns a non-empty `diagnostics` array for every case), then add the transpiler rule (GREEN).

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLiteralRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts` *(new)*

- [ ] **Step 1: Write the failing test file**

Create `tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

describe('array literals — basic values', () => {
  test('empty literal {} compiles to an empty array', () => {
    const result = transpile('function onenter()\n  dim a = {}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = []');
  });

  test('numeric literal elements compile to a JS array', () => {
    const result = transpile('function onenter()\n  dim a = {1, 2, 3}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = [1,2,3]');
  });

  test('string literal elements compile to a JS array', () => {
    const result = transpile('function onenter()\n  dim a = {"walls", "obstacles"}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = ["walls","obstacles"]');
  });

  test('mixed-type elements compile without diagnostics (arrays are untyped)', () => {
    const result = transpile('function onenter()\n  dim a = {1, "two", true}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = [1,"two",true]');
  });
});

describe('array literals — nesting', () => {
  test('nested literals compile to nested JS arrays', () => {
    const result = transpile('function onenter()\n  dim grid = {{1, 2}, {3, 4}}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_grid = [[1,2],[3,4]]');
  });

  test('a nested literal supports 2D-style grid(i, j) indexing', () => {
    const result = transpile(
      'function onenter()\n  dim grid = {{0, 0}, {1, 0}, {0, 1}}\n  print grid(1, 0)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('grid[1][0]');
  });
});

describe('array literals — module scope', () => {
  test('module-level dim arr = {1,2,3} compiles without let', () => {
    const result = transpile('dim arr = {1, 2, 3}');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr = [1,2,3]');
    expect(result.code).not.toContain('let main.arr');
  });
});

describe('array literals — used directly as a call argument', () => {
  test('a literal can be passed inline without an intermediate dim', () => {
    const result = transpile([
      'function getFirst(a)',
      '  dim x',
      '  x = a',
      'endfunction',
      'function test()',
      '  dim x',
      '  x = getFirst({1, 2, 3})',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('[1,2,3]');
  });
});

describe('array literals — indexing after literal init', () => {
  test('a literal-initialized array supports arr(i) reads via the checked accessor', () => {
    const result = transpile('function onenter()\n  dim a = {10, 20}\n  print a(0)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedArrayGet(');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts`
Expected: FAIL — every test's `result.diagnostics` is non-empty (the transpiler throws internally on the unregistered `ArrayLiteral` node type; `src/lib/Basic4WebGL/index.ts`'s `transpile()` catches that and returns it as a diagnostic rather than throwing out of the test).

- [ ] **Step 3: Write the transpiler rule**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLiteralRule.ts`, modeled on `ArrayListRule.ts`'s use of `concatChildren`, but joined with `,` and wrapped in `[...]` to produce a genuine JS array literal (`ArrayListRule` instead joins with `][` because it emits index chains like `[i][j]`, which is a different job):

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayLiteral)
class ArrayLiteralRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `[${concatChildren(node, ',', table)}]`;
  }
}

export default ArrayLiteralRule;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Run the full unit suite to check for regressions**

Run: `npx vitest run`
Expected: PASS — in particular `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`, `dim-extensions.test.ts`, and `tests/lib/Basic4WebGL/unit/parser/tokenRuleCoverage.test.ts` (that file only asserts coverage for *statement-level* tokens — `OpenBrace` never starts a statement, so it needs no entry there and this task shouldn't touch it).

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLiteralRule.ts tests/lib/Basic4WebGL/unit/transpiler/arrayLiterals.test.ts
git commit -m "feat: transpile array literals to JS array literals"
```

---

### Task 5: Documentation

CLAUDE.md requires a docs update in the same change as any softBASIC language behavior addition. This is a Language Guide change (core syntax), not an API Reference page, so no `src/docs/manifest.ts` change is needed — `arrays.md` is already registered there.

**Files:**
- Modify: `src/docs/language-guide/arrays.md`

- [ ] **Step 1: Add the "Array Literals" section**

In `src/docs/language-guide/arrays.md`, insert a new section after `## Declaration` and before `## Access`:

```markdown
## Array Literals

You can also build an array directly with a literal — a comma-separated list of values wrapped in curly braces — instead of declaring a sized array and pushing values in one at a time:

```bas
dim enemyTypes = {"goblin", "orc", "troll"}
print enemyTypes(0)   ' goblin
```

Literals can hold numbers, strings, `true`/`false`, or other literals nested inside them:

```bas
dim grid = {{0, 0}, {1, 0}, {0, 1}}
print grid(1, 0)   ' 1
```

An empty literal `{}` creates an array with no elements — the same as `dim arr(0)`.

Array literals work anywhere an expression is allowed, including as a function argument, so you don't need to declare a temporary array just to pass one in:

```bas
setupLevel({"walls", "obstacles"})
```
```

(Note: the fenced code blocks above are nested inside the outer instruction fence for this plan step — when editing the real file, use ordinary triple-backtick `bas` fences, matching the rest of `arrays.md`.)

- [ ] **Step 2: Verify the docs page renders**

Run: `npm run dev`, open the app, navigate to Docs → Language Guide → Arrays, confirm the new "Array Literals" section appears between "Declaration" and "Access" with correctly highlighted `bas` code blocks.

- [ ] **Step 3: Commit**

```bash
git add src/docs/language-guide/arrays.md
git commit -m "docs: document array literal syntax in the Arrays language guide"
```

---

### Task 6: Close out the roadmap entry

CLAUDE.md requires roadmap docs to be updated in the same commit when a tracked item ships. The array-literal idea was logged in `docs/roadmap.md`'s Perpetual parking lot during design discussion; mark it done now that it's shipped.

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Update the parking-lot entry**

In `docs/roadmap.md`, find the bullet starting `- **Inline array-literal syntax** (`{1, 2, 3}` / `{"walls", "obstacles"}`)...` in the "Perpetual parking lot" section. Prefix the bullet's leading label with strikethrough and a `[DONE]` marker, matching the pattern used elsewhere in this file (e.g. `~~Vector math helpers~~ **[DONE]**` in `docs/language/library-roadmap.md`'s Lower Priority section):

```markdown
- ~~Inline array-literal syntax~~ **[DONE — shipped YYYY-MM-DD]** (`{1, 2, 3}` / `{"walls", "obstacles"}`) — softBASIC currently has no array-literal syntax; ...
```

Keep the rest of the bullet's text as-is (it accurately documents the feasibility analysis and delimiter decision that was actually followed) — only add the strikethrough/DONE marker and the shipped date at the front.

- [ ] **Step 2: Bump the "Last updated" line**

At the top of `docs/roadmap.md`, update:

```markdown
> Internal document. Not for publication. Last updated: 2026-08-04.
```

to the actual date this task is completed.

- [ ] **Step 3: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark array-literal syntax shipped in roadmap"
```

---

## Notes for whoever executes this plan

- **No `.bas` def file or descriptor changes.** This is core language grammar, not a library module — it doesn't touch `src/lib/Basic4WebGL/library/registry.ts` or trigger the descriptor-generator convention.
- **No `symbolTypes.ts` changes.** A literal-initialized array (`dim a = {1,2,3}`) is registered as a plain `symbolTypes.Variable` (Variant), exactly like any other `dim a = expr` — it deliberately reuses the existing runtime-checked `_sbCheckedArrayGet` indexing path (see `ArrayLookupRule.ts`) rather than being promoted to a compile-time `ArraySymbol`. This was a considered design decision (see the plan's Architecture section and the roadmap entry), not an oversight — don't "fix" it by trying to infer an `ArraySymbol` from a literal RHS unless a real performance need shows up later.
- **No Cypress e2e spec needed for this change.** Per `CLAUDE.md`, `cypress/e2e/` is only required when a change touches a published tutorial's code sample or the engine runtime. This feature is pure compiler syntax with no runtime engine involvement — the Vitest suite in Task 4 is the correct and sufficient verification layer. (If a tutorial is later rewritten to use array literals, add/update the matching Cypress spec at that time, per the existing convention.)
- **No push-related steps included** (no `package.json` version bump, no `src/docs/release-notes.md` entry) — per `CLAUDE.md`, those only happen when the user explicitly asks to push to `main`.
