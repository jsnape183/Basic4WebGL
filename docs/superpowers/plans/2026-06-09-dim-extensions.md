# Dim Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend softBASIC's `dim` statement to support inline initialisation (`dim x = 10`) and multiple declarators on one line (`dim x, y, z as Sprite("a")`).

**Architecture:** DimRule loops over comma-separated declarators, emitting a list of existing or new node types. Single-declarator statements return the original node type unchanged. Two or more return a `MultiDimNode` that wraps them. Two new transpiler rules emit scoped assignments and joined multi-declarations.

**Tech Stack:** TypeScript, Vitest, softBASIC compiler (parser rules + transpiler rules via decorators).

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| **Create** | `tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts` | 20 tests — all failing until Task 4 |
| **Modify** | `src/lib/Basic4WebGL/nodeTypes.ts` | Add `VariableDimAssign` and `MultiDim` |
| **Create** | `src/lib/Basic4WebGL/nodes/VariableDimAssignNode.ts` | AST node: var symbol + one expression child |
| **Create** | `src/lib/Basic4WebGL/nodes/MultiDimNode.ts` | AST node: ordered list of 2+ declarator nodes |
| **Create** | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimAssignRule.ts` | Emits scoped assignment with init expression |
| **Create** | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/MultiDimRule.ts` | Concatenates children output with newlines |
| **Modify** | `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` | Replace single-declarator logic with loop |

---

## Task 1: Write All 20 Failing Tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts`

The tests are written first — they all fail until Task 4 implements the DimRule. Write the complete file in one step.

- [ ] **Step 1: Create the test file**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

const spriteSource    = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas',     'utf-8');
const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',  'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas',          source: spriteSource    },
      { name: 'Main.bas',            source                  },
    ],
  });

// ─── Inline init ─────────────────────────────────────────────────────────────

describe('dim x = expr — inline init', () => {
  test('1. dim x = 10 compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = 10\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('2. dim x = 10 emits = 10 not = undefined', () => {
    const result = transpile('function onenter()\n  dim x = 10\nendfunction');
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).not.toContain('onenter_x = undefined');
  });

  test('3. dim x = "hello" compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = "hello"\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('4. dim x = someVar + 1 compiles without diagnostics', () => {
    const result = transpile([
      'function onenter()',
      '  dim someVar',
      '  someVar = 5',
      '  dim x = someVar + 1',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Multi-declarator plain ───────────────────────────────────────────────────

describe('dim x, y — multi-declarator plain', () => {
  test('5. dim x, y compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x, y\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('6. dim x, y emits two separate declarations', () => {
    const result = transpile('function onenter()\n  dim x, y\nendfunction');
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = undefined');
  });

  test('7. dim x, y, z emits three declarations', () => {
    const result = transpile('function onenter()\n  dim x, y, z\nendfunction');
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = undefined');
    expect(result.code).toContain('onenter_z = undefined');
  });
});

// ─── Multi-declarator objects ─────────────────────────────────────────────────

describe('dim x, y as Sprite — multi-declarator with objects', () => {
  test('8. dim x, y as Sprite("img.png") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x, y as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('9. dim x, y as Sprite("img.png") — as binds only to y', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x, y as Sprite("img.png")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = new Sprite(');
    expect(result.code).not.toContain('onenter_x = new Sprite(');
  });

  test('10. dim x as Sprite("a"), y as Sprite("b") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("a"), y as Sprite("b")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('11. dim x as Sprite("a"), y as Sprite("b") emits two new Sprite()', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("a"), y as Sprite("b")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = new Sprite(');
    expect(result.code).toContain('onenter_y = new Sprite(');
  });
});

// ─── Combo ────────────────────────────────────────────────────────────────────

describe('dim combo — mixed init forms', () => {
  test('12. dim x = 10, y compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = 10, y\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('13. dim x = 10, y — x gets 10, y gets undefined', () => {
    const result = transpile('function onenter()\n  dim x = 10, y\nendfunction');
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).toContain('onenter_y = undefined');
  });

  test('14. dim x = 10, y, z as Sprite("img.png") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x = 10, y, z as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('15. dim x = 10, y, z as Sprite("img.png") — three statements in order', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x = 10, y, z as Sprite("img.png")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).toContain('onenter_y = undefined');
    expect(result.code).toContain('onenter_z = new Sprite(');
  });
});

// ─── Array restriction ────────────────────────────────────────────────────────

describe('dim array restriction', () => {
  test("16. dim x(10), y produces diagnostic containing 'x(10)'", () => {
    const result = transpile('function onenter()\n  dim x(10), y\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toContain("'x(10)'");
  });

  test("17. dim x, y(10) produces diagnostic containing 'y(10)'", () => {
    const result = transpile('function onenter()\n  dim x, y(10)\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toContain("'y(10)'");
  });
});

// ─── Regression ───────────────────────────────────────────────────────────────

describe('dim regression — existing forms unchanged', () => {
  test('18. dim x compiles and emits undefined', () => {
    const result = transpile('function onenter()\n  dim x\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_x = undefined');
  });

  test('19. dim x as Sprite("img.png") compiles and emits new Sprite()', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_x = new Sprite(');
  });

  test('20. dim x(5) compiles and emits _createArray([5])', () => {
    const result = transpile('function onenter()\n  dim x(5)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createArray([5])');
  });
});
```

- [ ] **Step 2: Run the tests — confirm all 20 fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts
```

Expected: 20 failures (unknown token `=` after `dim x`, or unexpected comma). Tests 18–20 may pass since they use existing syntax — that is fine.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts
git commit -m "test: add 20 failing tests for dim extensions"
```

---

## Task 2: New Node Types and Node Files

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/VariableDimAssignNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/MultiDimNode.ts`

- [ ] **Step 1: Add the two new node type names to `nodeTypes.ts`**

Open `src/lib/Basic4WebGL/nodeTypes.ts`. Add `'VariableDimAssign'` and `'MultiDim'` at the end of the array, before the closing `]`:

```typescript
// existing last entry
  'TypedArrayDim',
  'VariableDimAssign',
  'MultiDim',
]);
```

Full file after edit:

```typescript
import { createEnum } from '../CompilerLib/helpers';

export const nodeTypes = createEnum([
  'Empty',
  'Root',
  'Block',
  'Expression',
  'Term',
  'Print',
  'Call',
  'CallTerm',
  'Number',
  'String',
  'Add',
  'Subtract',
  'UMinus',
  'Multiply',
  'Divide',
  'Paren',
  'VariableDim',
  'Dim',
  'Clone',
  'FunctionDecl',
  'FunctionCall',
  'FunctionReturn',
  'FunctionTerm',
  'ModuleTerm',
  'VariableList',
  'ExpressionList',
  'ArrayList',
  'ArrayLookup',
  'Assign',
  'ArrayAssign',
  'And',
  'Or',
  'Not',
  'Relation',
  'Equals',
  'NotEquals',
  'LessThan',
  'GreaterThan',
  'LessThanEqualTo',
  'GreaterThanEqualTo',
  'While',
  'If',
  'For',
  'In',
  'To',
  'Variable',
  'PropertyAssign',
  'PropertyTerm',
  'PropertyMethodCall',
  'PropertyMethodTerm',
  'ConstructorDecl',
  'TypedArrayDim',
  'VariableDimAssign',
  'MultiDim',
]);

export default nodeTypes;
```

- [ ] **Step 2: Create `VariableDimAssignNode.ts`**

```typescript
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class VariableDimAssignNode extends Tree {
  constructor(data: any | undefined, exprChild: Tree, loc?: SourceLocation) {
    super(nodeTypes.VariableDimAssign, data, [exprChild]);
    this.loc = loc;
  }
}

export default VariableDimAssignNode;
```

`data` is the variable's `Symbol` object (same shape as `VariableDimNode`). `exprChild` is the parsed expression tree stored as `children[0]`.

- [ ] **Step 3: Create `MultiDimNode.ts`**

```typescript
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class MultiDimNode extends Tree {
  constructor(declarators: Tree[], loc?: SourceLocation) {
    super(nodeTypes.MultiDim, null, declarators);
    this.loc = loc;
  }
}

export default MultiDimNode;
```

`declarators` is an ordered list of 2 or more individual dim nodes (any mix of `VariableDimNode`, `CloneNode`, `VariableDimAssignNode`). No `data` payload — everything is in `children`.

- [ ] **Step 4: Run the tests — confirm the same number fail (no regressions)**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts
```

Expected: same failure count as after Task 1. No new failures in other test suites:

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/nodeTypes.ts \
        src/lib/Basic4WebGL/nodes/VariableDimAssignNode.ts \
        src/lib/Basic4WebGL/nodes/MultiDimNode.ts
git commit -m "feat: add VariableDimAssign and MultiDim node types"
```

---

## Task 3: Transpiler Rules

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimAssignRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/MultiDimRule.ts`

These rules are auto-discovered by the glob in `transpilerRules/autoload.ts` — no manual registration needed.

- [ ] **Step 1: Create `VariableDimAssignRule.ts`**

The rule mirrors `VariableDimRule` (same scope branches, same LHS format) but substitutes the parsed expression for `undefined` on the RHS.

```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.VariableDimAssign)
class VariableDimAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const rhs = doChild(node, 0, table);

    if (node.data.scope.type === scopeTypes.Class) {
      return `${node.data.scope.name}.prototype.${node.data.name} = ${rhs};`;
    }

    if (
      node.data.scope.type === scopeTypes.Function ||
      node.data.scope.type === scopeTypes.Constructor
    ) {
      return `${node.data.scope.name}_${node.data.name} = ${rhs};`;
    }

    return `${node.data.scope.name}.${node.data.name} = ${rhs};`;
  }
}

export default VariableDimAssignRule;
```

- [ ] **Step 2: Create `MultiDimRule.ts`**

Iterates the children in order, generating each with its own registered rule, and joins them with newlines.

```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.MultiDim)
class MultiDimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return node.children
      .map((child) => getTranspilerRule(child.type).generate(child, table))
      .join('\n');
  }
}

export default MultiDimRule;
```

- [ ] **Step 3: Run the tests — confirm no new passes yet (DimRule not extended)**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts
```

Expected: same failure count. The rules are registered but the parser never produces `VariableDimAssign` or `MultiDim` nodes yet.

Also confirm no regressions in other transpiler tests:

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimAssignRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/MultiDimRule.ts
git commit -m "feat: add VariableDimAssignRule and MultiDimRule transpiler rules"
```

---

## Task 4: Extend DimRule — Make All Tests Green

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`

This is the only change that affects the parser. Replace the single-declarator body with a loop. The single-declarator fast paths (returning `nodes[0]`) preserve full backward compatibility.

- [ ] **Step 1: Replace `DimRule.ts` with the new implementation**

```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { ArraySymbol, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { CompilationError } from '@CompilerLib/errors';
import CloneNode from '../../nodes/CloneNode';
import VariableDimNode from '../../nodes/VariableDimNode';
import VariableDimAssignNode from '../../nodes/VariableDimAssignNode';
import DimNode from '../../nodes/DimNode';
import TypedArrayDimNode from '../../nodes/TypedArrayDimNode';
import MultiDimNode from '../../nodes/MultiDimNode';
import nodeTypes from '../../nodeTypes';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Dim')
class DimRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Dim, tokenStream);

    const nodes: Tree[] = [];

    do {
      matchAndMove(tokens.Variable, tokenStream);
      const name = tokenStream.prev().text.toLowerCase();

      if (check(tokens.Equals, tokenStream.current())) {
        // ── dim name = expr ──────────────────────────────────────────────────
        matchAndMove(tokens.Equals, tokenStream);
        const varSymbol = symbolTable.add(name, symbolTypes.Variable);
        const expr = getParserRule('BoolExpression').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        nodes.push(new VariableDimAssignNode(varSymbol, expr, loc));

      } else if (check(tokens.As, tokenStream.current())) {
        // ── dim name as ClassName[(args)] ────────────────────────────────────
        matchAndMove(tokens.As, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const classSymbol = symbolTable.get(
          tokenStream.prev().text,
          symbolTypes.Class
        );
        const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);

        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(
            tokenStream,
            symbolTable,
            undefined
          );
          nodes.push(new CloneNode({ object, classSymbol }, [args], loc));
        } else {
          nodes.push(new CloneNode({ object, classSymbol }, [], loc));
        }

      } else if (check(tokens.OpenParen, tokenStream.current())) {
        // ── dim name(dims) [as ClassName[(args)]] ────────────────────────────
        const dims = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );

        const arraySymbol = symbolTable.addTyped(
          new ArraySymbol(
            name,
            symbolTypes.Array,
            symbolTable.getScope(),
            symbolTable.getFullScopeName(),
            dims.children.length
          )
        );

        let arrayNode: Tree;
        if (check(tokens.As, tokenStream.current())) {
          matchAndMove(tokens.As, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const classSymbol = symbolTable.get(
            tokenStream.prev().text,
            symbolTypes.Class
          );
          if (check(tokens.OpenParen, tokenStream.current())) {
            const args = getParserRule('ExpressionList').parse(
              tokenStream,
              symbolTable,
              undefined
            );
            arrayNode = new TypedArrayDimNode(
              { arraySymbol, classSymbol },
              [dims, args],
              loc
            );
          } else {
            arrayNode = new TypedArrayDimNode(
              { arraySymbol, classSymbol },
              [dims],
              loc
            );
          }
        } else {
          arrayNode = new DimNode(arraySymbol, dims, loc);
        }

        // Array restriction: arrays are only allowed as the sole declarator.
        // Check AFTER parsing so the dim sizes are available for the error message.
        if (
          nodes.length > 0 ||
          check(tokens.Comma, tokenStream.current())
        ) {
          // Extract dimension size text from the parsed dims for the error message.
          // dims.children are BoolExpression results; for simple numeric literals
          // the top-level node's .data is the token text (e.g. "10").
          const dimSizes = dims.children
            .map((c) => (c.data !== undefined && c.data !== null ? String(c.data) : '?'))
            .join(', ');
          throw new CompilationError(
            `Array declaration '${name}(${dimSizes})' cannot appear in a multi-variable dim — move it to its own line.`
          );
        }

        nodes.push(arrayNode);

      } else {
        // ── dim name ─────────────────────────────────────────────────────────
        const varSymbol = symbolTable.add(name, symbolTypes.Variable);
        nodes.push(new VariableDimNode(varSymbol, loc));
      }

    } while (check(tokens.Comma, tokenStream.current()) && !!matchAndMove(tokens.Comma, tokenStream));

    // Single-declarator: preserve backward-compat including newline consumption for arrays.
    if (nodes.length === 1) {
      const single = nodes[0];
      if (
        single.type === nodeTypes.Dim ||
        single.type === nodeTypes.TypedArrayDim
      ) {
        matchAndMove(newLines, tokenStream);
      }
      return single;
    }

    return new MultiDimNode(nodes, loc);
  }
}

export default DimRule;
```

**Key design points:**
- `do { } while (check(Comma) && !!matchAndMove(Comma))` — the `!!matchAndMove(...)` always returns truthy (or throws), so the loop continues as long as a comma is found and consumed.
- Array restriction fires when: the array we just parsed is NOT the only declarator. `nodes.length > 0` catches `dim x, y(10)` (already have x). `check(Comma, current)` catches `dim x(10), y` (first and only so far, but more follow).
- The `dimSizes` extraction uses `.data` on the top-level expression node. For simple numeric literals like `(10)`, the expression chain collapses to a `TermNode` whose `.data` is the token text `"10"`. For complex expressions the fallback is `"?"`.
- The newline-consumption at the end preserves the original array declaration behaviour exactly. Non-array paths never consumed the newline (BlockRule's NewLineRule handles it).

- [ ] **Step 2: Run ALL dim-extensions tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts
```

Expected: **20/20 pass**.

If some fail, common causes:
- Test 2/13/15 fail with `onenter_x` not found → check that `VariableDimAssignRule` uses the Function/Constructor branch (`scope.name_varname`).
- Tests 16/17 fail with wrong message format → check that `dims.children[0].data` is `"10"` (it will be for TermNode wrapping a NumberNode).
- Tests 18/20 (regression) fail → check that the single-array path still calls `matchAndMove(newLines, tokenStream)`.

- [ ] **Step 3: Run the full transpiler test suite — no regressions**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/
```

Expected: all previously-passing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/DimRule.ts
git commit -m "feat: extend dim statement — inline init and multi-declarator support"
```

---

## Verification Checklist

After all 4 tasks:

- [ ] `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dim-extensions.test.ts` → 20/20
- [ ] `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/` → no regressions
- [ ] `npx vitest run` → full suite green
