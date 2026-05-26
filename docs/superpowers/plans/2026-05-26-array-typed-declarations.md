# Array Typed Declarations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `dim arr(n) as Type(args)` syntax so arrays of typed objects can be declared and immediately populated with constructed instances, supporting all dimension counts.

**Architecture:** New `TypedArrayDim` node type. Parser `DimRule` gains a third path: after parsing the size list it checks for `as`, then parses type name and optional constructor args (reusing the existing `Clone` path). A new `TypedArrayDimRule` transpiler emits `_createTypedArray([sizes], () => new type(args))`. The `_createTypedArray` runtime helper is added to `bootstrapper.html` using the same `Array.from` pattern as the modernised `_createArray`.

**Depends on:** Plan 1 (Array Compiler Fixes) must be complete first.

**Tech Stack:** TypeScript, Vitest, softBASIC compiler, bootstrapper.html runtime

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/lib/Basic4WebGL/nodeTypes.ts` |
| Create | `src/lib/Basic4WebGL/nodes/TypedArrayDimNode.ts` |
| Modify | `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` |
| Modify | `src/components/Runner/bootstrapper.html` |
| Create | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts` |
| Modify | `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts` |

---

### Task 1: Add TypedArrayDim node type and node class

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/TypedArrayDimNode.ts`

- [ ] **Step 1: Add TypedArrayDim to nodeTypes.ts**

Open `src/lib/Basic4WebGL/nodeTypes.ts`. Add `'TypedArrayDim'` to the `createEnum` array, after `'ConstructorDecl'`:

```ts
export const nodeTypes = createEnum([
  // ... all existing entries ...
  'ConstructorDecl',
  'TypedArrayDim',
]);
```

- [ ] **Step 2: Create TypedArrayDimNode.ts**

Create `src/lib/Basic4WebGL/nodes/TypedArrayDimNode.ts`:

```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a typed array declaration: dim arr(n) as Type(args)
 * data: { arraySymbol: ArraySymbol, classSymbol: Symbol }
 * children[0]: ExpressionList of dimension sizes
 * children[1]: ExpressionList of constructor args (may be absent)
 */
class TypedArrayDimNode extends Tree {
  constructor(data: any, children: Tree[] = [], loc?: SourceLocation) {
    super(nodeTypes.TypedArrayDim, data, children);
    this.loc = loc;
  }
}

export default TypedArrayDimNode;
```

- [ ] **Step 3: Run the full suite to confirm no regressions**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/nodeTypes.ts \
        src/lib/Basic4WebGL/nodes/TypedArrayDimNode.ts
git commit -m "feat: add TypedArrayDim node type for typed array declarations"
```

---

### Task 2: Add _createTypedArray to bootstrapper

**Files:**
- Modify: `src/components/Runner/bootstrapper.html`

- [ ] **Step 1: Add _createTypedArray after _createArray in bootstrapper.html**

Open `src/components/Runner/bootstrapper.html`. After the `_createArray` function (after line 17), add:

```js
const _createTypedArrayDim = (sizes, depth, factory) => {
  if (depth === sizes.length - 1)
    return Array.from({length: sizes[depth]}, () => factory());
  return Array.from({length: sizes[depth]}, () =>
    _createTypedArrayDim(sizes, depth + 1, factory)
  );
};
const _createTypedArray = (sizes, factory) => {
  return _createTypedArrayDim(sizes, 0, factory);
};
```

- [ ] **Step 2: Run the full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/Runner/bootstrapper.html
git commit -m "feat: add _createTypedArray runtime helper for typed array declarations"
```

---

### Task 3: Add TypedArrayDimRule transpiler rule

Write the transpiler rule first (TDD: write test, run, fails with "no rule registered", implement, pass).

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`

- [ ] **Step 1: Write failing transpiler unit tests**

Open `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`. Add at the top, after existing imports:

```ts
import { node } from '@CompilerLib/tree';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Symbol, SymbolScope } from '@CompilerLib/symbols';
import { ArraySymbol } from '@Basic4WebGL/symbolTypes';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import '@Basic4WebGL/transpilerRules';
import TypedArrayDimRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule';

const variant = new BuiltInType('Variant');
const modScope = (name = 'main') => new SymbolScope(name, 'Module');
const fnScope = (name: string) => new SymbolScope(name, 'Function');
const classScope = (name: string) => new SymbolScope(name, 'Class');

const arrSym = (name: string, scope = modScope()) =>
  new ArraySymbol(name, 'Array', scope, scope.name, 1);
const classSym = (name: string) =>
  new Symbol(name, 'Class', modScope(), 'main', variant);
const term = (v: string) => node(nodeTypes.Term, v);
const emptyList = (type: number) => node(type, null, []);
```

Then add a new describe block:

```ts
describe('TypedArrayDimRule', () => {
  test('module-scope typed array without constructor args', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('10')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('enemies'),
      classSymbol: classSym('Enemy'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('main.enemies = _createTypedArray([10], () => new Enemy());');
  });

  test('module-scope typed array with constructor args', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('5')]);
    const args = node(nodeTypes.ExpressionList, null, [term('"bunny.png"')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('sprites'),
      classSymbol: classSym('Sprite'),
    }, [dims, args]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('main.sprites = _createTypedArray([5], () => new Sprite("bunny.png"));');
  });

  test('function-scope typed array retains let', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('20')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('bullets', fnScope('onenter')),
      classSymbol: classSym('Bullet'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('let onenter_bullets = _createTypedArray([20], () => new Bullet());');
  });

  test('class-scope typed array emits prototype form', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('3')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('tiles', classScope('Level')),
      classSymbol: classSym('Tile'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('Level.prototype.tiles = _createTypedArray([3], () => new Tile());');
  });

  test('multi-dimensional typed array', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('5'), term('3')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: new ArraySymbol('grid', 'Array', modScope(), 'main', 2),
      classSymbol: classSym('Tile'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('main.grid = _createTypedArray([5,3], () => new Tile());');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: FAIL — `Cannot find module TypedArrayDimRule`

- [ ] **Step 3: Create TypedArrayDimRule.ts**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts`:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.TypedArrayDim)
class TypedArrayDimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const { arraySymbol, classSymbol } = node.data;
    const sizes = doChild(node, 0, table);

    const factory =
      node.children.length > 1
        ? `() => new ${classSymbol.name}(${doChild(node, 1, table)})`
        : `() => new ${classSymbol.name}()`;

    const rhs = `_createTypedArray([${sizes}], ${factory})`;

    if (arraySymbol.scope.type === scopeTypes.Class) {
      return `${arraySymbol.scope.name}.prototype.${arraySymbol.name} = ${rhs};`;
    }

    if (
      arraySymbol.scope.type === scopeTypes.Function ||
      arraySymbol.scope.type === scopeTypes.Constructor
    ) {
      return `let ${formatSymbol(arraySymbol)} = ${rhs};`;
    }

    return `${formatSymbol(arraySymbol)} = ${rhs};`;
  }
}

export default TypedArrayDimRule;
```

- [ ] **Step 4: Register the rule**

Open `src/lib/Basic4WebGL/transpilerRules/index.ts` (or whichever file imports all ruleSets). Add:

```ts
import './jsRules/ruleSets/TypedArrayDimRule';
```

- [ ] **Step 5: Run the tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts \
        src/lib/Basic4WebGL/transpilerRules/index.ts \
        tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
git commit -m "feat: add TypedArrayDimRule transpiler for typed array declarations"
```

---

### Task 4: Update parser DimRule to emit TypedArrayDimNode

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`

- [ ] **Step 1: Write a failing integration test**

Open `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`. Add a new describe block:

```ts
describe('Typed array declaration — integration', () => {
  test('dim arr(10) as Enemy compiles to _createTypedArray', () => {
    // Requires Enemy class to be defined in lib
    const result = compiler.transpile({
      lib: [{ name: 'Enemy.bas', source: 'Class\nEndClass' }],
      files: [{ name: 'Main.bas', source: 'dim enemies(10) as Enemy' }],
    });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([10], () => new enemy())');
  });

  test('dim arr(5) as Sprite("bunny.png") compiles with constructor args', () => {
    const result = compiler.transpile({
      lib: [{ name: 'Sprite.bas', source: 'Class\nConstructor(img)\nEndConstructor\nEndClass' }],
      files: [{ name: 'Main.bas', source: 'dim sprites(5) as Sprite("bunny.png")' }],
    });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([5], () => new sprite("bunny.png"))');
  });

  test('dim arr(5, 3) as Tile() multi-dimensional', () => {
    const result = compiler.transpile({
      lib: [{ name: 'Tile.bas', source: 'Class\nEndClass' }],
      files: [{ name: 'Main.bas', source: 'dim grid(5, 3) as Tile()' }],
    });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([5,3], () => new tile())');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: FAIL — parser treats `dim arr(10) as Enemy` as array decl then `as` causes parse error

- [ ] **Step 3: Update parser DimRule**

Open `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`. Add the `TypedArrayDimNode` import and update the array path:

```ts
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
import CloneNode from '../../nodes/CloneNode';
import VariableDimNode from '../../nodes/VariableDimNode';
import DimNode from '../../nodes/DimNode';
import TypedArrayDimNode from '../../nodes/TypedArrayDimNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Dim')
class DimRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Dim, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    // dim name as Type — typed variable (existing path, unchanged)
    if (check(tokens.As, tokenStream.current())) {
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
        return new CloneNode({ object, classSymbol }, [args], loc);
      }

      return new CloneNode({ object, classSymbol }, [], loc);
    }

    // dim name — plain variable (existing path)
    if (!check(tokens.OpenParen, tokenStream.current())) {
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol, loc);
    }

    // dim name(sizes) — array declaration
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

    // dim name(sizes) as Type — typed array declaration (new path)
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
        matchAndMove(newLines, tokenStream);
        return new TypedArrayDimNode({ arraySymbol, classSymbol }, [dims, args], loc);
      }

      matchAndMove(newLines, tokenStream);
      return new TypedArrayDimNode({ arraySymbol, classSymbol }, [dims], loc);
    }

    matchAndMove(newLines, tokenStream);
    return new DimNode(arraySymbol, dims, loc);
  }
}

export default DimRule;
```

- [ ] **Step 4: Run the integration tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/DimRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
git commit -m "feat: parser supports dim arr(n) as Type(args) typed array declarations"
```

---

### Task 5: Update language guide

**Files:**
- Modify: `docs/language/softbasic-concepts.md`

- [ ] **Step 1: Add typed array declaration to the Arrays section**

Open `docs/language/softbasic-concepts.md`. In the Arrays section (added by Plan 3), locate the **Declaring arrays** subsection and add:

```markdown
### Typed array declarations

Every element is constructed immediately when `as Type` is used:

```basic
dim sprites(10) as Sprite("bunny.png")
sprites(0).setPosition(100, 200)
stage.add(sprites(0))
```

No constructor — no brackets:

```basic
dim enemies(20) as Enemy
enemies(0).init(100, 200)
```

Multi-dimensional typed arrays work the same way:

```basic
dim grid(5, 3) as Tile()
grid(2)(1).setActive(true)
```
```

- [ ] **Step 2: Run the full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add docs/language/softbasic-concepts.md
git commit -m "docs: document typed array declaration syntax in language guide"
```
