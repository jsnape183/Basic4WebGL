# ObjectTransform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce an `ObjectTransform` class that encapsulates position logic, composed into `Sprite` (and future display objects) via a `transform` property, eliminating position-method duplication and enabling `bunny.transform.setPosition(x, y)` syntax.

**Architecture:** Two new compiler AST nodes (`PropertyMethodCall`/`PropertyMethodTerm`) handle chained method calls like `obj.prop.method(args)` using a pre-formatted chain string, bypassing symbol-lookup for deep chains. A new `transform` class descriptor generates `transform.bas`; the sprite descriptor drops `setPosition`/`getX`/`getY` and wires the transform into its constructor via a new `after` hook.

**Tech Stack:** TypeScript, Vitest, softBASIC class/descriptor generator, CompilerLib parser/transpiler rule system.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/Basic4WebGL/nodeTypes.ts` | Modify | Add `PropertyMethodCall`, `PropertyMethodTerm` |
| `src/lib/Basic4WebGL/nodes/PropertyMethodCallNode.ts` | Create | AST node: chained method call, statement context |
| `src/lib/Basic4WebGL/nodes/PropertyMethodTermNode.ts` | Create | AST node: chained method call, expression context |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule.ts` | Create | Emits `chain(args);` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule.ts` | Create | Emits `chain(args)` (no semicolon) |
| `src/lib/Basic4WebGL/parserRules/rules/ObjectPropertyRule.ts` | Modify | Detect `(` mid-chain → PropertyMethodCallNode |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | Modify | Detect `(` mid-chain → PropertyMethodTermNode |
| `src/lib/Basic4WebGL/library/generator/types.ts` | Modify | Add `after?` to constructor descriptor |
| `src/lib/Basic4WebGL/library/generator/classGenerator.ts` | Modify | Emit `after` lines in Constructor block |
| `src/lib/Basic4WebGL/library/descriptors/transform.descriptor.ts` | Create | Transform class descriptor |
| `src/lib/Basic4WebGL/defs/transform.bas` | Create | Generated transform.bas (committed) |
| `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts` | Modify | Drop position methods, add constructor `after` |
| `src/lib/Basic4WebGL/defs/sprite.bas` | Modify | Regenerated sprite.bas |
| `src/monacoHelpers/catalogue.ts` | Modify | Stub ObjectTransform entry |
| `tests/sampleFiles/chainedMethod/Actuator.bas` | Create | Minimal inner class for parser tests |
| `tests/sampleFiles/chainedMethod/Robot.bas` | Create | Outer class composing Actuator for parser tests |
| `tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts` | Create | Parser fix tests (statement + expression) |
| `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts` | Modify | Add `after` and transform descriptor tests |
| `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts` | Modify | Update for `transform.*` API, add new tests |

---

### Task 1: Add node types and register plumbing

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/PropertyMethodCallNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/PropertyMethodTermNode.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule.ts`

- [ ] **Step 1: Add the two new node types to the enum**

Edit `src/lib/Basic4WebGL/nodeTypes.ts`. Add `PropertyMethodCall` and `PropertyMethodTerm` after `PropertyTerm`:

```ts
export const nodeTypes = createEnum([
  // ... existing entries ...
  'PropertyAssign',
  'PropertyTerm',
  'PropertyMethodCall',   // ← new: chained method call statement
  'PropertyMethodTerm',   // ← new: chained method call expression
  'ConstructorDecl',
]);
```

- [ ] **Step 2: Create PropertyMethodCallNode**

Create `src/lib/Basic4WebGL/nodes/PropertyMethodCallNode.ts`:

```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a chained method call in statement context: obj.prop.method(args)
 * data is the fully-formatted chain string (e.g. "onenter_bunny.transform.setposition")
 * children[0] is the ExpressionList of arguments
 */
class PropertyMethodCallNode extends Tree {
  constructor(chain: string, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyMethodCall, chain, [args]);
    this.loc = loc;
  }
}

export default PropertyMethodCallNode;
```

- [ ] **Step 3: Create PropertyMethodTermNode**

Create `src/lib/Basic4WebGL/nodes/PropertyMethodTermNode.ts`:

```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a chained method call in expression context: obj.prop.method(args)
 * data is the fully-formatted chain string (e.g. "onenter_bunny.transform.x")
 * children[0] is the ExpressionList of arguments
 * No semicolon — used as sub-expression (e.g. RHS of assignment, function arg).
 */
class PropertyMethodTermNode extends Tree {
  constructor(chain: string, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyMethodTerm, chain, [args]);
    this.loc = loc;
  }
}

export default PropertyMethodTermNode;
```

- [ ] **Step 4: Write failing unit tests for the two transpiler rules**

Add a new `describe` block at the end of `tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts` (it already imports `@Basic4WebGL/transpilerRules` which triggers autoload, making ExpressionListRule available for `doChild`):

```ts
import PropertyMethodCallRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule';
import PropertyMethodTermRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule';

// ─── PropertyMethodCall / PropertyMethodTerm ─────────────────────────────────

describe('PropertyMethodCallRule', () => {
  test('emits chain(args); with semicolon', () => {
    const args = node(nodeTypes.ExpressionList, null, []);
    const n = node(nodeTypes.PropertyMethodCall, 'onenter_bunny.transform.setposition', [args]);
    expect(new PropertyMethodCallRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.setposition();'
    );
  });

  test('emits chain with populated args', () => {
    const args = node(nodeTypes.ExpressionList, null, [term('100'), term('200')]);
    const n = node(nodeTypes.PropertyMethodCall, 'onenter_bunny.transform.setposition', [args]);
    expect(new PropertyMethodCallRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.setposition(100,200);'
    );
  });
});

describe('PropertyMethodTermRule', () => {
  test('emits chain(args) without semicolon', () => {
    const args = node(nodeTypes.ExpressionList, null, []);
    const n = node(nodeTypes.PropertyMethodTerm, 'onenter_bunny.transform.x', [args]);
    expect(new PropertyMethodTermRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.x()'
    );
  });
});
```

- [ ] **Step 5: Run tests — expect failures on the two new describes**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
```

Expected: `PropertyMethodCallRule` and `PropertyMethodTermRule` describes fail with "Cannot find module".

- [ ] **Step 6: Create PropertyMethodCallRule**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule.ts`:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.PropertyMethodCall)
class PropertyMethodCallRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return `${node.data}(${doChild(node, 0, table)});`;
  }
}

export default PropertyMethodCallRule;
```

- [ ] **Step 7: Create PropertyMethodTermRule**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule.ts`:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.PropertyMethodTerm)
class PropertyMethodTermRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return `${node.data}(${doChild(node, 0, table)})`;
  }
}

export default PropertyMethodTermRule;
```

- [ ] **Step 8: Run tests — expect all to pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
```

Expected: All tests PASS including the two new describes.

- [ ] **Step 9: Commit**

```bash
git add src/lib/Basic4WebGL/nodeTypes.ts \
        src/lib/Basic4WebGL/nodes/PropertyMethodCallNode.ts \
        src/lib/Basic4WebGL/nodes/PropertyMethodTermNode.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
git commit -m "feat: add PropertyMethodCall/Term nodes and transpiler rules for chained method calls"
```

---

### Task 2: Sample files and ObjectPropertyRule fix (statement context)

**Files:**
- Create: `tests/sampleFiles/chainedMethod/Actuator.bas`
- Create: `tests/sampleFiles/chainedMethod/Robot.bas`
- Create: `tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ObjectPropertyRule.ts`

- [ ] **Step 1: Create Actuator.bas sample**

Create `tests/sampleFiles/chainedMethod/Actuator.bas`:

```basic
Class

function doAction(n)
    call("console.log(doaction_n)")
endfunction

function getValue()
    return call("42")
endfunction

```

- [ ] **Step 2: Create Robot.bas sample**

Create `tests/sampleFiles/chainedMethod/Robot.bas`:

```basic
Class
dim actuator as Actuator
```

- [ ] **Step 3: Write the failing test for chained statement call**

Create `tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const actuatorFile = {
  name: 'Actuator',
  source: readFileSync('tests/sampleFiles/chainedMethod/Actuator.bas', 'utf-8'),
};
const robotFile = {
  name: 'Robot',
  source: readFileSync('tests/sampleFiles/chainedMethod/Robot.bas', 'utf-8'),
};

// ─── Statement context: obj.prop.method(args) ─────────────────────────────────

describe('chained method call — statement context', () => {
  test('obj.prop.method(arg) compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction(5)',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction(5)');
  });

  test('obj.prop.method() with no args compiles', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction()',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction()');
  });
});
```

- [ ] **Step 4: Run the test — confirm it FAILS**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts
```

Expected: FAIL — parse error or "unexpected token" because `r.actuator.doAction(5)` leaves `(5)` orphaned.

- [ ] **Step 5: Fix ObjectPropertyRule — chain + `(` → PropertyMethodCallNode**

Replace the property chain loop in `src/lib/Basic4WebGL/parserRules/rules/ObjectPropertyRule.ts`.

Add imports at the top:

```ts
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
```

Replace lines 58–73 (the chain loop and `matchAndMove(tokens.Equals, ...)` block) with:

```ts
    // Otherwise: property chain — may be an assignment or a chained method call
    let chain = `${ownerFormatted}.${memberName}`;
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;

      // Chained method call: obj.prop.method(args) in statement context
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        matchAndMove(newLines, tokenStream);
        return new PropertyMethodCallNode(chain, args, loc);
      }
    }

    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);

    return new PropertyAssignNode({ chain }, expr, loc);
```

The full updated `ObjectPropertyRule.ts` becomes:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
import { newLines } from '../../parserConfig';

/**
 * Handles dot-access on Object instances in statement context.
 *
 * Three forms:
 *   obj.prop = expr               — property assignment (one or more levels)
 *   obj.prop.sub = expr           — chained property assignment
 *   obj.method(args)              — method call (delegates to FunctionCall)
 *   obj.prop.method(args)         — chained method call → PropertyMethodCallNode
 */
@RegisterParserRule('ObjectProperty')
class ObjectPropertyRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: string
  ): Tree {
    const loc = tokenStream.current().loc();
    const ownerName = data;

    const ownerSymbol = symbolTable.get(ownerName, symbolTypes.Object);
    const ownerFormatted = formatSymbol(ownerSymbol);

    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    // If the next token is '(' this is a direct method call — delegate to FunctionCall
    if (check(tokens.OpenParen, tokenStream.current())) {
      symbolTable.setScope(ownerName);
      let node: Tree;
      try {
        const functionSymbol = symbolTable.get(memberName, symbolTypes.Function);
        node = getParserRule('FunctionCall').parse(
          tokenStream,
          symbolTable,
          functionSymbol
        );
      } finally {
        symbolTable.clearScope();
      }
      return node;
    }

    // Otherwise: property chain — may be an assignment or a chained method call
    let chain = `${ownerFormatted}.${memberName}`;
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;

      // Chained method call: obj.prop.method(args) in statement context
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        matchAndMove(newLines, tokenStream);
        return new PropertyMethodCallNode(chain, args, loc);
      }
    }

    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);

    return new PropertyAssignNode({ chain }, expr, loc);
  }
}

export default ObjectPropertyRule;
```

- [ ] **Step 6: Run the test — confirm it now PASSES**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts
```

Expected: the two statement-context tests PASS. The expression-context tests don't exist yet.

- [ ] **Step 7: Run the full test suite — confirm no regressions**

```
npx vitest run
```

Expected: All previously passing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add tests/sampleFiles/chainedMethod/Actuator.bas \
        tests/sampleFiles/chainedMethod/Robot.bas \
        tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts \
        src/lib/Basic4WebGL/parserRules/rules/ObjectPropertyRule.ts
git commit -m "feat: support obj.prop.method(args) in statement context (ObjectPropertyRule)"
```

---

### Task 3: VariableFactorRule fix (expression context)

**Files:**
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`

- [ ] **Step 1: Add failing expression-context tests**

Append to `tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts`:

```ts
// ─── Expression context: x = obj.prop.method() ───────────────────────────────

describe('chained method call — expression context', () => {
  test('obj.prop.method() as RHS of assignment compiles', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    dim result',
      '    result = r.actuator.getValue()',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.getvalue()');
  });

  test('obj.prop.method() used as argument — no spurious semicolons', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction(r.actuator.getValue())',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction(');
    expect(result).not.toContain('getvalue();');   // no spurious semicolon inside args
    expect(result).toContain('actuator.getvalue()');
  });
});
```

- [ ] **Step 2: Run — confirm new tests FAIL**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts
```

Expected: the two expression-context tests FAIL.

- [ ] **Step 3: Fix VariableFactorRule — chain + `(` → PropertyMethodTermNode**

Add import at the top of `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`:

```ts
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
```

Replace lines 65–72 (the property chain while loop):

```ts
      // Property chain read: build the full chain
      let chain = `${ownerFormatted}.${memberName}`;
      while (check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        chain += `.${tokenStream.prev().text.toLowerCase()}`;

        // Chained method call: obj.prop.method(args) in expression context
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(
            tokenStream,
            symbolTable,
            undefined
          );
          return new PropertyMethodTermNode(chain, args, loc);
        }
      }
      return new PropertyTermNode(chain, loc);
```

The complete updated block in context (replacing the existing lines 65–72):

```ts
      // Property chain read: build the full chain
      let chain = `${ownerFormatted}.${memberName}`;
      while (check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        chain += `.${tokenStream.prev().text.toLowerCase()}`;

        // Chained method call: obj.prop.method(args) in expression context
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(
            tokenStream,
            symbolTable,
            undefined
          );
          return new PropertyMethodTermNode(chain, args, loc);
        }
      }
      return new PropertyTermNode(chain, loc);
```

- [ ] **Step 4: Run chained method call tests — all should PASS**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Run full test suite — confirm no regressions**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/lib/Basic4WebGL/integration/transpiler/chainedMethodCall.test.ts \
        src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts
git commit -m "feat: support obj.prop.method(args) in expression context (VariableFactorRule)"
```

---

### Task 4: Generator `after` extension

**Files:**
- Modify: `src/lib/Basic4WebGL/library/generator/types.ts`
- Modify: `src/lib/Basic4WebGL/library/generator/classGenerator.ts`
- Modify: `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`

- [ ] **Step 1: Write the failing test for `after`**

Append to `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`:

```ts
test('constructor after lines are emitted after the assignTo line', () => {
  const desc: ClassDescriptor = {
    name: 'sprite',
    properties: ['_handle'],
    constructor: {
      params: ['imagePath'],
      body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
      assignTo: '_handle',
      after: (_p, self) => [`dim transform as ObjectTransform(call("${self._handle}"))`],
    },
    methods: [],
  };
  const output = generateClass(desc);
  const lines = output.split('\n');
  const assignIdx = lines.findIndex((l) => l.includes('_handle = call('));
  const afterIdx = lines.findIndex((l) => l.includes('dim transform as ObjectTransform'));
  expect(afterIdx).toBeGreaterThan(assignIdx);
  expect(output).toContain('dim transform as ObjectTransform(call("this._handle"))');
});
```

- [ ] **Step 2: Run — confirm test FAILS**

```
npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
```

Expected: new `after` test FAILS.

- [ ] **Step 3: Add `after` to the constructor type**

In `src/lib/Basic4WebGL/library/generator/types.ts`, add `after?` to the constructor interface:

```ts
export interface ClassDescriptor {
  name: string;
  properties: string[];
  constructor?: {
    params: string[];
    body: BodyFn;
    assignTo: string;
    after?: (p: ParamProxy, self: SelfProxy) => string[];  // ← new
  };
  methods: FunctionDescriptor[];
}
```

- [ ] **Step 4: Emit `after` lines in classGenerator**

In `src/lib/Basic4WebGL/library/generator/classGenerator.ts`, update the `if (ctor)` block:

```ts
  if (ctor) {
    const ctorParams = ctor.params.join(', ');
    lines.push(`Constructor(${ctorParams})`);
    const p = makeParamProxy('constructor');
    lines.push(`    ${ctor.assignTo} = call("${ctor.body(p, self)}")`);
    if (ctor.after) {
      ctor.after(p, self).forEach((line) => lines.push(`    ${line}`));
    }
    lines.push('EndConstructor');
    lines.push('');
  }
```

- [ ] **Step 5: Run generator tests — all should pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
```

Expected: all tests PASS including the new `after` test.

- [ ] **Step 6: Run full suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/library/generator/types.ts \
        src/lib/Basic4WebGL/library/generator/classGenerator.ts \
        tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
git commit -m "feat: add constructor after hook to ClassDescriptor generator"
```

---

### Task 5: Transform descriptor and transform.bas

**Files:**
- Create: `src/lib/Basic4WebGL/library/descriptors/transform.descriptor.ts`
- Create: `src/lib/Basic4WebGL/defs/transform.bas`
- Modify: `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`

- [ ] **Step 1: Write the failing generator test for transform descriptor**

Append to `tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts`:

```ts
import { transformDescriptor } from '@Basic4WebGL/library/descriptors/transform.descriptor';

describe('transformDescriptor', () => {
  test('generates Class / EndClass wrapper', () => {
    const output = generateClass(transformDescriptor);
    expect(output.trimStart().startsWith('Class')).toBe(true);
    expect(output.trimEnd().endsWith('EndClass')).toBe(true);
  });

  test('generates dim _handle property', () => {
    expect(generateClass(transformDescriptor)).toContain('dim _handle');
  });

  test('constructor stores handle param', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('Constructor(handle)');
    expect(output).toContain('_handle = call("constructor_handle")');
  });

  test('setPosition delegates to _sb.setPosition with this._handle', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function setPosition(x, y)');
    expect(output).toContain('call("_sb.setPosition(this._handle, setposition_x, setposition_y)")');
  });

  test('x returns _sb.getPositionX', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function x()');
    expect(output).toContain('return call("_sb.getPositionX(this._handle)")');
  });

  test('y returns _sb.getPositionY', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function y()');
    expect(output).toContain('return call("_sb.getPositionY(this._handle)")');
  });
});
```

- [ ] **Step 2: Run — confirm new describe FAILS**

```
npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
```

Expected: `transformDescriptor` describe fails with "Cannot find module".

- [ ] **Step 3: Create transform.descriptor.ts**

Create `src/lib/Basic4WebGL/library/descriptors/transform.descriptor.ts`:

```ts
import { ClassDescriptor } from '../generator/types';

export const transformDescriptor: ClassDescriptor = {
  name: 'ObjectTransform',
  properties: ['_handle'],
  constructor: {
    params: ['handle'],
    body: (_p, _self) => `constructor_handle`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'x',
      params: [],
      returns: (_p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'y',
      params: [],
      returns: (_p, self) => `_sb.getPositionY(${self._handle})`,
    },
  ],
};
```

**Why `body: (_p, _self) => 'constructor_handle'` not `call(...)`:** The generator wraps the body in `call("...")`. So `call("constructor_handle")` is the correct generated output — it evaluates the JS variable `constructor_handle` (the mangled param name) and assigns it to `_handle`. This is the same pattern used throughout the .bas call() convention.

- [ ] **Step 4: Run generator tests — all should pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Generate and commit transform.bas**

Run the generator to produce `transform.bas`. Since there is no CLI for this, use `generateClass` inline and write the output. The correct content of `src/lib/Basic4WebGL/defs/transform.bas` is:

```basic
Class
dim _handle

Constructor(handle)
    _handle = call("constructor_handle")
EndConstructor

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function x()
    return call("_sb.getPositionX(this._handle)")
endfunction

function y()
    return call("_sb.getPositionY(this._handle)")
endfunction

EndClass
```

Create this file manually at `src/lib/Basic4WebGL/defs/transform.bas` exactly as above.

- [ ] **Step 6: Run full suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/transform.descriptor.ts \
        src/lib/Basic4WebGL/defs/transform.bas \
        tests/lib/Basic4WebGL/unit/generator/classGenerator.test.ts
git commit -m "feat: add ObjectTransform class descriptor and generated transform.bas"
```

---

### Task 6: Update Sprite descriptor, regenerate sprite.bas, update integration tests

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`
- Modify: `src/lib/Basic4WebGL/defs/sprite.bas`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts`

- [ ] **Step 1: Write new integration tests for transform API, update old ones**

Open `tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts`.

The file currently loads `spriteLib` from `sprite.bas`. Add `transformLib` and update/replace the existing tests:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const spriteLib = {
  name: 'sprite',
  source: readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8'),
};

const transformLib = {
  name: 'ObjectTransform',
  source: readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8'),
};

const libs = [transformLib, spriteLib];

describe('Sprite class — instantiation', () => {
  test('dim as sprite with constructor arg compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('newsprite(');
  });
});

describe('Sprite class — transform.setPosition', () => {
  test('s.transform.setPosition(x, y) compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(100, 200)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(100,200)');
  });

  test('s.transform.x() compiles and output contains x()', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim x',
      '    x = s.transform.x()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.x()');
  });

  test('s.transform.y() compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim y',
      '    y = s.transform.y()',
      'endfunction',
    ].join('\n');
    compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
  });

  test('setPosition with arithmetic args — no spurious semicolons', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(s.transform.x()+10, s.transform.y())',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(');
    expect(result).not.toContain('transform.x();');
    expect(result).not.toContain('transform.y();');
    expect(result).toContain('transform.x()+10');
  });
});

describe('Sprite class — setAlpha (still on Sprite directly)', () => {
  test('s.setAlpha(0.5) still compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setAlpha(0.5)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
  });
});

describe('Sprite class — _handle in method body', () => {
  test('sprite.bas constructor assigns _handle', () => {
    expect(spriteLib.source).toContain('_handle = call("_sb.createSprite(constructor_imagePath)")');
  });

  test('sprite.bas constructor initialises transform', () => {
    expect(spriteLib.source).toContain('dim transform as ObjectTransform(call("this._handle"))');
  });

  test('transform.bas setPosition emits this._handle', () => {
    expect(transformLib.source).toContain('this._handle');
  });
});
```

- [ ] **Step 2: Run — confirm new tests FAIL (sprite.bas not updated yet)**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts
```

Expected: tests that reference `transform.*` fail because sprite.bas still has the old flat API and transform.bas doesn't exist as a lib yet.

- [ ] **Step 3: Update sprite.descriptor.ts**

Replace the entire content of `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`:

```ts
import { ClassDescriptor } from '../generator/types';

export const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
    assignTo: '_handle',
    after: (_p, self) => [
      `dim transform as ObjectTransform(call("${self._handle}"))`,
    ],
  },
  methods: [
    {
      name: 'setAngle',
      params: ['angle'],
      body: (p, self) => `_sb.setAngle(${self._handle}, ${p.angle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};
```

**Note:** `setPosition`, `getX`, and `getY` are intentionally removed — they now live in `ObjectTransform`.

- [ ] **Step 4: Regenerate sprite.bas**

Replace the content of `src/lib/Basic4WebGL/defs/sprite.bas` with the output produced by `generateClass(spriteDescriptor)`:

```basic
Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setAngle(angle)
    call("_sb.setAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

EndClass
```

- [ ] **Step 5: Run sprite integration tests — all should PASS**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Run full test suite**

```
npx vitest run
```

Expected: all tests pass. If the old `classGenerator.test.ts` snapshot of the sprite descriptor now fails (it has its own inline descriptor with `setPosition`/`getX` — those are independent), those remain as-is. If any snapshot tests fail due to the sprite.bas change, update snapshots with `npx vitest run --reporter=verbose` and inspect manually.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts \
        src/lib/Basic4WebGL/defs/sprite.bas \
        tests/lib/Basic4WebGL/integration/transpiler/spriteClass.test.ts
git commit -m "feat: update Sprite to compose ObjectTransform — remove flat setPosition/getX/getY"
```

---

### Task 7: Catalogue stub for ObjectTransform

**Files:**
- Modify: `src/monacoHelpers/catalogue.ts`

- [ ] **Step 1: Open catalogue.ts and locate the class entry pattern**

Read `src/monacoHelpers/catalogue.ts`. Find where class entries like `sprite` are defined.

- [ ] **Step 2: Add the ObjectTransform stub entry**

Add an `ObjectTransform` entry after the existing class entries. The entry documents the three methods with a note that Monaco chained completion is a follow-up:

```ts
{
  name: 'ObjectTransform',
  kind: 'class',
  // NOTE: Monaco completion for two-level chains (bunny.transform.x())
  // requires extending the completion provider to resolve property chains.
  // This stub is present for documentation purposes only — completions
  // for transform.* will not trigger until that follow-up is implemented.
  methods: [
    {
      name: 'setPosition',
      signature: 'setPosition(x, y)',
      description: 'Move to absolute position',
      params: [
        { name: 'x', description: 'X coordinate' },
        { name: 'y', description: 'Y coordinate' },
      ],
    },
    {
      name: 'x',
      signature: 'x()',
      description: 'Get current X coordinate',
      params: [],
    },
    {
      name: 'y',
      signature: 'y()',
      description: 'Get current Y coordinate',
      params: [],
    },
  ],
},
```

Adapt the exact property names/structure to match the pattern already used in `catalogue.ts` (read the file first).

- [ ] **Step 3: Run full test suite — confirm no regressions**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/monacoHelpers/catalogue.ts
git commit -m "docs: add ObjectTransform stub entry to Monaco catalogue (completion follow-up)"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `bunny.transform.setPosition(x, y)` syntax works | Tasks 2, 3, 6 |
| `bunny.transform.x()` / `bunny.transform.y()` work | Tasks 2, 3, 6 |
| No spurious semicolons in expression context | Task 3, regression test in Task 6 |
| `ObjectTransform` class with `setPosition`, `x`, `y` | Task 5 |
| Sprite drops `setPosition`, `getX`, `getY` | Task 6 |
| Sprite constructor wires transform with handle | Tasks 4, 6 |
| Parser: `obj.prop.method(args)` — statement | Task 2 |
| Parser: `obj.prop.method(args)` — expression | Task 3 |
| Generator `after` hook | Task 4 |
| Catalogue stub with known-limitation note | Task 7 |
| Transform descriptor tests | Task 5 |
| Sprite descriptor tests (existing `classGenerator.test.ts`) | Task 6 step note |
| Existing sprite tests updated | Task 6 |

All spec requirements have a corresponding task. ✓

**No placeholders:** All code blocks are complete and concrete. ✓

**Type consistency:**
- `PropertyMethodCallNode` / `PropertyMethodTermNode` created in Task 1, used in Tasks 2 and 3 ✓
- `ClassDescriptor.constructor.after` added in Task 4, used in Tasks 5 and 6 ✓
- `transformDescriptor` created in Task 5, `transform.bas` used as lib in Task 6 ✓
- `nodeTypes.PropertyMethodCall` / `PropertyMethodTerm` added in Task 1, referenced in rules in Task 1 ✓
