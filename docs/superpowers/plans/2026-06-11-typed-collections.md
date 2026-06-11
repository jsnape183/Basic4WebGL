# Typed Collections, `new` Keyword, and Typed Parameters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `new` keyword, typed variables/collections, and typed function parameters to softBASIC so that collections of objects work correctly and member access on typed elements is known at compile time.

**Architecture:** A `New` token + `NewObjectNode` AST node form the expression-level foundation. DimRule, VariableRule, VariableListRule, and VariableFactorRule each get targeted extensions. Two new node types handle typed element member access. Type checking is enforced at assignment and call sites.

**Tech Stack:** TypeScript, Vitest, the softBASIC compiler pipeline (lexer → parser → AST → transpiler).

---

## File map

**New files:**
- `tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts` — all tests for this feature
- `src/lib/Basic4WebGL/nodes/NewObjectNode.ts` — AST node for `new ClassName(args)`
- `src/lib/Basic4WebGL/nodes/TypedElementAccessNode.ts` — AST node for `arr(i).method()` / `arr(i).prop` (both array and dict, both statement and expression context)
- `src/lib/Basic4WebGL/parserRules/rules/Expressions/NewObjectFactorRule.ts` — parser: `new ClassName(args)` → `NewObjectNode`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/NewObjectRule.ts` — transpiler: `NewObjectNode` → `new ClassName(args)`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedElementAccessRule.ts` — transpiler: `TypedElementAccessNode` → `_sbRequireInit(...)...`

**Modified files:**
- `src/lib/Basic4WebGL/tokens.ts` — add `New` token
- `src/lib/Basic4WebGL/TokenResolver.ts` — resolve `new` keyword
- `src/lib/Basic4WebGL/nodeTypes.ts` — add `NewObject`, `TypedElementAccess`
- `src/lib/Basic4WebGL/symbolTypes.ts` — add optional `classSymbol` field to `ArraySymbol` constructor and `DictionarySymbol` constructor
- `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts` — add `tokens.New` branch
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts` — no-children case emits `= null` instead of `= new ClassName()`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts` — null-init slots instead of factory-construction
- `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` — block constructor-args form; add type-inferring `dim a = new ClassName(args)` branch; attach `classSymbol` to object symbol
- `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` — type-check `new` assignments; variant+new error; typed array/dict element `new` assignment
- `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` — typed array/dict element member access → `TypedElementAccessNode`
- `src/lib/Basic4WebGL/parserRules/rules/VariableListRule.ts` — typed param forms; store params in node data
- `src/lib/Basic4WebGL/parserRules/rules/FunctionRule.ts` — read params from node data instead of `getAll(Parameter)`
- `src/components/Runner/bootstrapper.html` — add `_sbRequireInit` runtime helper
- `src/docs/language-guide/new-keyword.md` — new guide page
- `src/docs/language-guide/arrays.md` — typed arrays section
- `src/docs/language-guide/dictionaries.md` — typed dicts section
- `src/docs/manifest.ts` — add new-keyword page

---

## Task 1: Write all failing tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// Minimal class fixtures — file name = class name
const enemyFile = {
  name: 'Enemy',
  source: [
    'Class',
    '  function update()',
    '  endfunction',
    '  function getHealth()',
    '    return 100',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const spriteFile = {
  name: 'Sprite',
  source: [
    'Class',
    '  function setPosition(x, y)',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main', source }] });

const transpileWith = (
  files: { name: string; source: string }[],
  mainSource: string
) =>
  compiler.transpile({
    lib: [],
    files: [...files, { name: 'Main', source: mainSource }],
  });

const errMessages = (result: ReturnType<typeof transpile>) =>
  result.diagnostics.map((d) => d.message).join('; ');

// ─── new keyword — expression ──────────────────────────────────────────────

describe('new keyword — expression', () => {
  test('new Enemy() emits new Enemy() in assignment', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e as Enemy', 'e = new Enemy()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new Enemy()');
  });

  test('new Enemy("goblin") emits new Enemy("goblin")', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e as Enemy', 'e = new Enemy("goblin")'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new Enemy("goblin")');
  });
});

// ─── dim a as ClassName — null initialisation ──────────────────────────────

describe('dim a as ClassName — untyped construction now null', () => {
  test('dim e as Enemy (no args) emits = null, not = new Enemy()', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.e = null');
    expect(result.code).not.toContain('new Enemy()');
  });

  test('dim e as Enemy("img") (with args) still emits new Enemy("img")', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy("img")');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new Enemy("img")');
  });
});

// ─── dim a = new ClassName(args) — type inference ─────────────────────────

describe('dim a = new ClassName(args) — type inference', () => {
  test('dim e = new Enemy() emits main.e = new Enemy()', () => {
    const result = transpileWith([enemyFile], 'dim e = new Enemy()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.e = new Enemy()');
  });

  test('dim e = new Enemy() — subsequent method call compiles', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e = new Enemy()', 'e.update()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dim e = new Enemy() then e = new Sprite() is a type error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim e = new Enemy()', 'e = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('dim n = 5 remains a plain variant (no type inference for primitives)', () => {
    const result = transpile('dim n = 5');
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── typed variable assignment type checking ───────────────────────────────

describe('typed variable assignment — type checking', () => {
  test('assigning wrong type to typed var is a compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim e as Enemy', 'e = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('assigning new to a variant variable is a compile error', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim x', 'x = new Enemy()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/variant/i);
  });
});

// ─── typed arrays — declaration ────────────────────────────────────────────

describe('typed array — declaration', () => {
  test('dim enemies(10) as Enemy emits _createTypedArray([10], () => null)', () => {
    const result = transpileWith([enemyFile], 'dim enemies(10) as Enemy');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([10], () => null)');
    expect(result.code).not.toContain('new Enemy()');
  });

  test('dim enemies(10) as Enemy("img") is a compile error (removed form)', () => {
    const result = transpileWith(
      [enemyFile],
      'dim enemies(10) as Enemy("img")'
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/constructor/i);
  });
});

// ─── typed array — element assignment ──────────────────────────────────────

describe('typed array — element assignment', () => {
  test('enemies(0) = new Enemy() emits array[0]=new Enemy()', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim enemies(10) as Enemy', 'enemies(0) = new Enemy()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.enemies[0]=new Enemy()');
  });

  test('enemies(0) = new Sprite() is a type error (wrong class)', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim enemies(10) as Enemy', 'enemies(0) = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});

// ─── typed array — member access ───────────────────────────────────────────

describe('typed array — member access', () => {
  test('enemies(0).update() emits _sbRequireInit(...).update()', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim enemies(10) as Enemy', 'enemies(0).update()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(main.enemies[0],"enemies(0)").update()'
    );
  });

  test('enemies(i).update() uses variable index in null-check wrapper', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'dim enemies(10) as Enemy',
        'dim i',
        'i = 3',
        'enemies(i).update()',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbRequireInit(main.enemies[main.i]');
  });
});

// ─── typed dict — declaration ───────────────────────────────────────────────

describe('typed dict — declaration', () => {
  test('dim players[] as Sprite emits _createDict()', () => {
    const result = transpileWith([spriteFile], 'dim players[] as Sprite');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.players = _createDict()');
    expect(result.code).not.toContain('new Sprite()');
  });
});

// ─── typed dict — element assignment ───────────────────────────────────────

describe('typed dict — element assignment', () => {
  test('players["Alice"] = new Sprite() emits .set("Alice",new Sprite())', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"] = new Sprite()',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.players.set("Alice",new Sprite())');
  });

  test('players["Alice"] = new Enemy() is a type error (wrong class)', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"] = new Enemy()',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});

// ─── typed dict — member access ─────────────────────────────────────────────

describe('typed dict — member access', () => {
  test('players["Alice"].setPosition(0,0) emits _sbRequireInit(_sbDictGet(...)).setPosition(0,0)', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"].setPosition(0, 0)',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(_sbDictGet(main.players,"Alice"),"players[Alice]").setPosition(0,0)'
    );
  });
});

// ─── typed parameters ──────────────────────────────────────────────────────

describe('typed function parameters', () => {
  test('typed scalar param — member access compiles', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'function spawn(e as Enemy)',
        '  e.update()',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('untyped array param f(arr()) — arr treated as array inside function', () => {
    const result = transpile(
      [
        'function sum(arr())',
        '  dim x',
        '  x = arr(0)',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('typed array param f(arr() as Enemy) — element member access compiles', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'function processAll(arr() as Enemy)',
        '  arr(0).update()',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('untyped dict param f(d[]) — d treated as dict inside function', () => {
    const result = transpile(
      [
        'dim scores[]',
        'function read(d[])',
        '  dim x',
        '  x = d["key"]',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('typed dict param f(d[] as Sprite) — value member access compiles', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'function process(d[] as Sprite)',
        '  d["Alice"].setPosition(0, 0)',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── call-site type checking ───────────────────────────────────────────────

describe('call-site type checking', () => {
  test('passing new Enemy() to typed Sprite param is a compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'spawn(new Enemy())',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('passing new Sprite() to typed Sprite param is OK', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'spawn(new Sprite())',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('passing typed var of wrong class to typed param is compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'dim e as Enemy("img")',
        'spawn(e)',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});
```

- [ ] **Step 2: Run tests to confirm all fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts
```

Expected: All tests fail (most with parse or compile errors — `new` is not yet a keyword).

- [ ] **Step 3: Commit the failing tests**

```
git add tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts
git commit -m "test: add failing tests for typed collections, new keyword, and typed parameters"
```

---

## Task 2: `new` keyword foundation — token, node, transpiler rule, FactorRule

**Files:**
- Modify: `src/lib/Basic4WebGL/tokens.ts`
- Modify: `src/lib/Basic4WebGL/TokenResolver.ts`
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/NewObjectNode.ts`
- Create: `src/lib/Basic4WebGL/parserRules/rules/Expressions/NewObjectFactorRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/NewObjectRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`

- [ ] **Step 1: Add `New` token**

In `src/lib/Basic4WebGL/tokens.ts`, add `New` after `Super` in the `createKeyValueEnum` call. The exact position matters for `createKeyValueEnum` — just add it to the existing list.

Find the line with `Super` and add `New` after it:

```typescript
// Before:
Super: 'Super',

// After:
Super: 'Super',
New: 'New',
```

- [ ] **Step 2: Resolve `new` keyword in TokenResolver**

In `src/lib/Basic4WebGL/TokenResolver.ts`, add a resolver for `new` alongside the other keywords. Find where `super` is resolved (it uses `matchPattern`) and add a similar entry for `new`:

```typescript
{ match: matchPattern(/^new\b/i), token: tokens.New },
```

Place it after the `super` resolver, before whitespace/fallback resolvers.

- [ ] **Step 3: Add `NewObject` and `TypedElementAccess` to nodeTypes**

In `src/lib/Basic4WebGL/nodeTypes.ts`, add two new types at the end of the enum/object:

```typescript
NewObject: 'NewObject',
TypedElementAccess: 'TypedElementAccess',
```

- [ ] **Step 4: Create `NewObjectNode.ts`**

Create `src/lib/Basic4WebGL/nodes/NewObjectNode.ts`:

```typescript
import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class NewObjectNode extends Tree {
  constructor(data: any, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.NewObject, data, children);
    this.loc = loc;
  }
}

export default NewObjectNode;
```

`data` will be `{ classSymbol }`. `children` will be `[argsNode]` when there are constructor args (an ExpressionList), or `[]` when no args.

- [ ] **Step 5: Create `NewObjectFactorRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/Expressions/NewObjectFactorRule.ts`:

```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, { RegisterParserRule } from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import NewObjectNode from '@Basic4WebGL/nodes/NewObjectNode';

@RegisterParserRule('NewObjectFactor')
class NewObjectFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.New, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const className = tokenStream.prev().text;
    const classSymbol = symbolTable.get(className, symbolTypes.Class);

    if (check(tokens.OpenParen, tokenStream.current())) {
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new NewObjectNode({ classSymbol }, [args], loc);
    }
    return new NewObjectNode({ classSymbol }, [], loc);
  }
}

export default NewObjectFactorRule;
```

- [ ] **Step 6: Add `New` case to `FactorRule.ts`**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`, find the section that dispatches based on token type. Add a check for `tokens.New` before or after the `tokens.Super` case:

```typescript
if (check(tokens.New, tokenStream.current())) {
  return getParserRule('NewObjectFactor').parse(tokenStream, symbolTable, undefined);
}
```

- [ ] **Step 7: Create `NewObjectRule.ts` (transpiler)**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/NewObjectRule.ts`:

```typescript
import { IGeneratable, RegisterTranspilerRule } from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.NewObject)
class NewObjectRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const className = node.data.classSymbol.name;
    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `new ${className}(${args})`;
    }
    return `new ${className}()`;
  }
}

export default NewObjectRule;
```

Note: no trailing `;` — this is an expression node used inside assignments.

- [ ] **Step 8: Verify tests now compile `new` expressions**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts
```

The `new keyword — expression` tests should move from parse errors to closer to passing. Other tests still fail.

- [ ] **Step 9: Verify build still passes**

```
npx vite build
```

- [ ] **Step 10: Commit**

```
git add src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/TokenResolver.ts \
  src/lib/Basic4WebGL/nodeTypes.ts \
  src/lib/Basic4WebGL/nodes/NewObjectNode.ts \
  src/lib/Basic4WebGL/parserRules/rules/Expressions/NewObjectFactorRule.ts \
  src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts \
  src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/NewObjectRule.ts
git commit -m "feat: add New token, NewObjectNode, and NewObjectRule transpiler"
```

---

## Task 3: Symbol extensions — `classSymbol` on ArraySymbol and DictionarySymbol

**Files:**
- Modify: `src/lib/Basic4WebGL/symbolTypes.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` (attach classSymbol to object symbol)

- [ ] **Step 1: Extend `ArraySymbol` with optional `classSymbol`**

In `src/lib/Basic4WebGL/symbolTypes.ts`, update `ArraySymbol`:

```typescript
export class ArraySymbol extends Symbol {
  dimensions: number;
  classSymbol: any | null;
  constructor(name: string, type: string, scope: any, fullScope: string, dimensions: number, classSymbol: any = null) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.dimensions = dimensions;
    this.classSymbol = classSymbol;
  }
}
```

- [ ] **Step 2: Extend `DictionarySymbol` with optional `classSymbol`**

In `src/lib/Basic4WebGL/symbolTypes.ts`, update `DictionarySymbol`:

```typescript
export class DictionarySymbol extends Symbol {
  classSymbol: any | null;
  constructor(name: string, type: string, scope: any, fullScope: string, classSymbol: any = null) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.classSymbol = classSymbol;
  }
}
```

- [ ] **Step 3: Attach `classSymbol` to Object symbols in `DimRule`**

In `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`, find the `as ClassName` branch where `symbolTable.clone` is called (around line 84). Immediately after the `clone` call, add:

```typescript
const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);
(object as any).classSymbol = classSymbol;  // ← add this line
```

This also covers the inheritance `while (ancestor.parentClassName)` loop below — the classSymbol reflects the declared (static) type, not the parent.

- [ ] **Step 4: Run all tests to confirm no regressions**

```
npx vitest run
```

Expected: same count as before (752 passing), no new failures.

- [ ] **Step 5: Commit**

```
git add src/lib/Basic4WebGL/symbolTypes.ts src/lib/Basic4WebGL/parserRules/rules/DimRule.ts
git commit -m "feat: add optional classSymbol field to ArraySymbol and DictionarySymbol"
```

---

## Task 4: DimRule changes — null init, remove constructor-args form, type-inferring `dim a = new`

**Files:**
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`

### 4a: `dim a as Sprite` (no args) → null

- [ ] **Step 1: Change `CloneRule` no-children case to emit `null`**

In `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts`:

```typescript
generate(node: Tree, table: Symbols): string {
  const lhs = formatSymbol(node.data.object);
  const className = node.data.classSymbol.name;

  if (node.children.length > 0) {
    const args = doChild(node, 0, table);
    return `${lhs} = new ${className}(${args});`;
  }
  return `${lhs} = null;`;  // was: `${lhs} = new ${className}();`
}
```

- [ ] **Step 2: Run null-init tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

The `dim a as ClassName — untyped construction now null` tests should now pass.

### 4b: `dim arr(10) as Sprite` (no args) → null-init slots

- [ ] **Step 3: Change `TypedArrayDimRule` to null-init slots**

In `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts`, replace the `factory` logic:

```typescript
generate(node: Tree, table: Symbols | undefined): string {
  const { arraySymbol, classSymbol } = node.data;
  const sizes = doChild(node, 0, table);

  // Always null-initialised — constructor-args form is blocked at parse time (Task 4c)
  const rhs = `_createTypedArray([${sizes}], () => null)`;

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
```

Also update the `ArraySymbol` stored in `TypedArrayDimNode.data.arraySymbol` to include `classSymbol`. Do this in `DimRule` (Step 4 below).

### 4c: Block constructor-args form in DimRule

- [ ] **Step 4: Throw for `dim arr(N) as ClassName(args)` in `DimRule`**

In `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`, find the typed array branch (around line 126). Replace the `if (check(tokens.OpenParen, ...))` block that creates a 2-child `TypedArrayDimNode`:

```typescript
if (check(tokens.As, tokenStream.current())) {
  matchAndMove(tokens.As, tokenStream);
  matchAndMove(tokens.Variable, tokenStream);
  const classSymbol = symbolTable.get(
    tokenStream.prev().text,
    symbolTypes.Class
  );

  // Block the old constructor-args form: dim arr(N) as ClassName(args)
  if (check(tokens.OpenParen, tokenStream.current())) {
    throw new CompilationError(
      `Array declaration cannot include a constructor — declare 'dim ${name}(N) as ${classSymbol.name}' and assign each element with '${name}(i) = new ${classSymbol.name}(...)'`
    );
  }

  // Store classSymbol on the ArraySymbol for type checking during assignments
  (arraySymbol as any).classSymbol = classSymbol;

  arrayNode = new TypedArrayDimNode(
    { arraySymbol, classSymbol },
    [dims],
    loc
  );
}
```

### 4d: Type-inferring `dim a = new ClassName(args)`

- [ ] **Step 5: Add type-inference branch in `DimRule.parseDeclarator`**

In `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`, find the `= expr` branch (around line 65). Replace it:

```typescript
if (check(tokens.Equals, tokenStream.current())) {
  matchAndMove(tokens.Equals, tokenStream);

  if (check(tokens.New, tokenStream.current())) {
    // Type-inferring form: dim a = new ClassName(args)
    // Parse manually so we can register 'a' as a typed Object before parsing the expression
    matchAndMove(tokens.New, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const className = tokenStream.prev().text;
    const classSymbol = symbolTable.get(className, symbolTypes.Class);

    const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);
    (object as any).classSymbol = classSymbol;

    // Pull inherited members (mirrors the 'dim a as ClassName' path)
    let ancestor = classSymbol;
    while (ancestor.parentClassName) {
      const parentClass = symbolTable.get(ancestor.parentClassName, symbolTypes.Class);
      symbolTable.mergeSymbolsIntoScope(name, ancestor.parentClassName);
      ancestor = parentClass;
    }

    // Parse optional constructor args
    let newNode: Tree;
    if (check(tokens.OpenParen, tokenStream.current())) {
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      newNode = new NewObjectNode({ classSymbol }, [args], loc);
    } else {
      newNode = new NewObjectNode({ classSymbol }, [], loc);
    }

    return new AssignNode(object, newNode, loc);
  }

  // Plain variant form: dim a = expr
  const varSymbol = symbolTable.add(name, symbolTypes.Variable);
  const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
  return new VariableDimAssignNode(varSymbol, expr, loc);
}
```

Add the necessary imports at the top of DimRule.ts:

```typescript
import NewObjectNode from '../../nodes/NewObjectNode';
import AssignNode from '../../nodes/AssignNode';
```

- [ ] **Step 6: Run the target tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

Expected passing: all `dim a as ClassName`, `dim a = new`, and `typed array — declaration` tests.

- [ ] **Step 7: Run full suite to verify no regressions**

```
npx vitest run
```

Check that typed array tests in `arrays.test.ts` still pass (they test the old constructor-args form via direct node construction, not via source code, so they should still pass — but verify).

- [ ] **Step 8: Commit**

```
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts \
  src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule.ts \
  src/lib/Basic4WebGL/parserRules/rules/DimRule.ts
git commit -m "feat: null-init untyped construction, block array constructor form, add dim a = new type inference"
```

---

## Task 5: VariableRule — type-checked `new` assignment

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`

This task makes `a = new Sprite(...)` type-check, `arr(0) = new Enemy(...)` type-check, dict element `new` assignment type-check, and `variant = new X()` a compile error.

- [ ] **Step 1: Import `NewObjectNode` and `nodeTypes` in VariableRule**

At the top of `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, add:

```typescript
import NewObjectNode from '../../nodes/NewObjectNode';
import nodeTypes from '../../nodeTypes';
```

- [ ] **Step 2: Add type check in the Object assignment path**

In `VariableRule`, find the Object assignment path (around line 43). After parsing `expr`, add a type check:

```typescript
// No dot → plain assignment to an object-typed variable
const objSymbol = symbolTable.get(name, symbolTypes.Object);
matchAndMove(tokens.Equals, tokenStream);
const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
matchAndMove(newLines, tokenStream);

// Type check: if assigning new X(), verify class matches
if (expr.type === nodeTypes.NewObject) {
  const objClass = (objSymbol as any).classSymbol?.name;
  const newClass = (expr as NewObjectNode).data.classSymbol.name;
  if (objClass && objClass !== newClass) {
    throw new CompilationError(
      `Type mismatch: '${name}' is typed as '${objClass}' but 'new ${newClass}' was assigned`
    );
  }
}

if (isInstancePropertyAccess(objSymbol, symbolTable)) {
  return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
}
return new AssignNode(objSymbol, expr, loc);
```

- [ ] **Step 3: Add type check in the typed array element assignment path**

In `VariableRule`, find the `isArrayLike` section (around line 85). After parsing dims and expr, add:

```typescript
const arraySymbol = symbolTable.check(name, symbolTypes.Array)
  ? symbolTable.get(name, 'Array')
  : symbolTable.get(name, symbolTypes.Variable);

// Type check for typed arrays: arr(0) = new ClassName(...)
if (expr.type === nodeTypes.NewObject) {
  const arrClass = (arraySymbol as any).classSymbol?.name;
  const newClass = (expr as NewObjectNode).data.classSymbol.name;
  if (arrClass && arrClass !== newClass) {
    throw new CompilationError(
      `Type mismatch: '${name}' holds elements of type '${arrClass}' but 'new ${newClass}' was assigned`
    );
  }
}

return new ArrayAssignNode(arraySymbol, [dims, expr], loc);
```

- [ ] **Step 4: Add type check in the typed dict element assignment path**

In `VariableRule`, find the dictionary assignment section (around line 65). After parsing `valExpr`, add:

```typescript
// Type check for typed dicts: d["key"] = new ClassName(...)
if (valExpr.type === nodeTypes.NewObject) {
  const dictClass = (dictSymbol as any).classSymbol?.name;
  const newClass = (valExpr as NewObjectNode).data.classSymbol.name;
  if (dictClass && dictClass !== newClass) {
    throw new CompilationError(
      `Type mismatch: '${name}' holds values of type '${dictClass}' but 'new ${newClass}' was assigned`
    );
  }
}
```

- [ ] **Step 5: Add variant + new compile error**

In `VariableRule`, find the plain variable assignment path at the bottom (around line 107). After parsing `expr`, add:

```typescript
const varSymbol = symbolTable.get(name, symbolTypes.Variable);
if (isInstancePropertyAccess(varSymbol, symbolTable)) {
  throw new CompilationError(`'${name}' is a class property — use self.${name}`);
}
matchAndMove(tokens.Equals, tokenStream);
const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
matchAndMove(newLines, tokenStream);

// Variant cannot receive object instances
if (expr.type === nodeTypes.NewObject) {
  throw new CompilationError(
    `Cannot assign object to variant variable '${name}'. Declare it typed: 'dim ${name} as ${(expr as NewObjectNode).data.classSymbol.name}'`
  );
}

return new AssignNode(varSymbol, expr, loc);
```

- [ ] **Step 6: Run the target tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

Expected passing: all `typed variable assignment`, `typed array — element assignment`, and `typed dict — element assignment` tests.

- [ ] **Step 7: Full suite**

```
npx vitest run
```

- [ ] **Step 8: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts
git commit -m "feat: type-check new assignments in VariableRule, error on variant + new"
```

---

## Task 6: VariableListRule — typed function parameters

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableListRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/FunctionRule.ts`

The current `VariableListRule` only handles plain `name, name, name` params. We extend it to handle five forms:

| Form | Registers as |
|---|---|
| `name` | `symbolTypes.Parameter` (unchanged) |
| `name as ClassName` | `symbolTypes.Object` via `clone` (with `classSymbol` attached) |
| `name()` | `ArraySymbol` (no `classSymbol`) |
| `name() as ClassName` | `ArraySymbol` (with `classSymbol`) |
| `name[]` | `DictionarySymbol` (no `classSymbol`) |
| `name[] as ClassName` | `DictionarySymbol` (with `classSymbol`) |

All are tagged with `(sym as any).isParam = true` and stored in the node's `data.params` list so `FunctionRule` can collect them.

- [ ] **Step 1: Rewrite `VariableListRule.ts`**

Replace the entire file:

```typescript
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, { RegisterParserRule } from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { ArraySymbol, DictionarySymbol, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import VariableListNode from '../../nodes/VariableLIstNode';
import TermNode from '../../nodes/TermNode';
import VariableNode from '../../nodes/VariableNode';

@RegisterParserRule('VariableList')
class VariableListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    const list: Tree[] = [];
    const paramSymbols: any[] = [];

    while (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
      const name = tokenStream.prev().text.toLowerCase();
      let sym: any;

      if (check(tokens.OpenParen, tokenStream.current())) {
        // arr() or arr() as ClassName
        matchAndMove(tokens.OpenParen, tokenStream);
        matchAndMove(tokens.CloseParen, tokenStream);
        sym = symbolTable.addTyped(
          new ArraySymbol(name, symbolTypes.Array, symbolTable.getScope(), symbolTable.getFullScopeName(), 1)
        );
        if (check(tokens.As, tokenStream.current())) {
          matchAndMove(tokens.As, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const classSymbol = symbolTable.get(tokenStream.prev().text, symbolTypes.Class);
          sym.classSymbol = classSymbol;
        }

      } else if (check(tokens.OpenBracket, tokenStream.current())) {
        // d[] or d[] as ClassName
        matchAndMove(tokens.OpenBracket, tokenStream);
        matchAndMove(tokens.CloseBracket, tokenStream);
        sym = symbolTable.addTyped(
          new DictionarySymbol(name, symbolTypes.Dictionary, symbolTable.getScope(), symbolTable.getFullScopeName())
        );
        if (check(tokens.As, tokenStream.current())) {
          matchAndMove(tokens.As, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const classSymbol = symbolTable.get(tokenStream.prev().text, symbolTypes.Class);
          sym.classSymbol = classSymbol;
        }

      } else if (check(tokens.As, tokenStream.current())) {
        // a as ClassName — typed scalar param
        matchAndMove(tokens.As, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const classSymbol = symbolTable.get(tokenStream.prev().text, symbolTypes.Class);
        sym = symbolTable.clone(name, classSymbol, symbolTypes.Object);
        sym.classSymbol = classSymbol;

        // Pull in inherited members so method calls on the param compile
        let ancestor = classSymbol;
        while (ancestor.parentClassName) {
          symbolTable.mergeSymbolsIntoScope(name, ancestor.parentClassName);
          ancestor = symbolTable.get(ancestor.parentClassName, symbolTypes.Class);
        }

      } else {
        // Plain variant param (unchanged)
        sym = symbolTable.add(name, symbolTypes.Parameter);
      }

      sym.isParam = true;
      paramSymbols.push(sym);
      list.push(new TermNode(sym, new VariableNode(name), loc));

      if (!check(tokens.Comma, tokenStream.current())) break;
      matchAndMove(tokens.Comma, tokenStream);
    }

    return new VariableListNode({ params: paramSymbols }, list, loc);
  }
}

export default VariableListRule;
```

- [ ] **Step 2: Update `FunctionRule` to read params from node data**

In `src/lib/Basic4WebGL/parserRules/rules/FunctionRule.ts`, change the parameter collection from `getAll` to reading from the node:

```typescript
variables = getParserRule('VariableList').parse(tokenStream, symbolTable, undefined);
// Read params from VariableListNode data (supports typed params); fallback to getAll for safety
parameters = (variables.data as any)?.params
  ?? symbolTable.getAll(symbolTypes.Parameter, symbolTable.getScope(), symbolTable.getFullScopeName());
```

- [ ] **Step 3: Run the typed parameters tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

Expected passing: all `typed function parameters` tests.

- [ ] **Step 4: Full suite — ensure existing param tests still pass**

```
npx vitest run
```

The existing function/param tests in other test files should be unaffected since untyped params still register as `symbolTypes.Parameter` and are collected via `data.params`.

- [ ] **Step 5: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/VariableListRule.ts \
  src/lib/Basic4WebGL/parserRules/rules/FunctionRule.ts
git commit -m "feat: extend VariableListRule to support typed scalar, array, and dict parameters"
```

---

## Task 7: Typed element member access — `TypedElementAccessNode` + runtime helper

**Files:**
- Create: `src/lib/Basic4WebGL/nodes/TypedElementAccessNode.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedElementAccessRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`
- Modify: `src/components/Runner/bootstrapper.html`

### Node and transpiler rule

The `TypedElementAccessNode` handles four cases via its data:

```
data: {
  collectionSymbol,  // ArraySymbol or DictionarySymbol
  memberName,        // string — method or property name
  label,             // string — error label for _sbRequireInit, e.g. "enemies(0)" or "players[Alice]"
  kind,              // 'array' | 'dict'
  isMethod,          // boolean — true for method calls (statement), false for property reads (expression)
}
children: [indexExpr, ?argsNode]
```

The transpiler emits:
- Array method: `_sbRequireInit(coll[idx],"label").method(args);`
- Array property: `_sbRequireInit(coll[idx],"label").prop`
- Dict method: `_sbRequireInit(_sbDictGet(coll,key),"label").method(args);`
- Dict property: `_sbRequireInit(_sbDictGet(coll,key),"label").prop`

- [ ] **Step 1: Create `TypedElementAccessNode.ts`**

Create `src/lib/Basic4WebGL/nodes/TypedElementAccessNode.ts`:

```typescript
import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class TypedElementAccessNode extends Tree {
  constructor(data: any, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.TypedElementAccess, data, children);
    this.loc = loc;
  }
}

export default TypedElementAccessNode;
```

- [ ] **Step 2: Create `TypedElementAccessRule.ts` (transpiler)**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedElementAccessRule.ts`:

```typescript
import { IGeneratable, RegisterTranspilerRule } from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.TypedElementAccess)
class TypedElementAccessRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const { collectionSymbol, memberName, label, kind, isMethod } = node.data;
    const formatted = formatSymbol(collectionSymbol);
    const idx = doChild(node, 0, table);

    const ref =
      kind === 'array'
        ? `${formatted}[${idx}]`
        : `_sbDictGet(${formatted},${idx})`;

    const wrapped = `_sbRequireInit(${ref},"${label}")`;

    if (isMethod) {
      const args = node.children.length > 1 ? doChild(node, 1, table) : '';
      return `${wrapped}.${memberName}(${args});`;
    }
    return `${wrapped}.${memberName}`;
  }
}

export default TypedElementAccessRule;
```

### Parser — statement context (VariableRule)

Statement context is when the line starts with a variable name as a statement. For typed array elements, after parsing `arr(0)`, we check for `.` and build a `TypedElementAccessNode` (isMethod: true).

- [ ] **Step 3: Extend `VariableRule` for typed array element member calls**

In `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, add imports:

```typescript
import TypedElementAccessNode from '../../nodes/TypedElementAccessNode';
```

In the `isArrayLike` section, BEFORE parsing dims and expr, check if this is a typed array with member access. Insert this block after `const isArrayLike = ...`:

```typescript
// Typed array element method call: enemies(0).update()
if (symbolTable.check(name, symbolTypes.Array)) {
  const arraySym = symbolTable.get(name, symbolTypes.Array) as any;
  if (arraySym.classSymbol) {
    // Peek: parse dims, then check for '.'
    const dims = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
    matchAndMove(tokens.CloseParen, tokenStream);
    if (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text.toLowerCase();
      const label = `${name}(${name})`;  // placeholder — transpiler uses generated index
      if (check(tokens.OpenParen, tokenStream.current())) {
        // Method call
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        matchAndMove(tokens.CloseParen, tokenStream);
        matchAndMove(newLines, tokenStream);
        return new TypedElementAccessNode(
          { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: true },
          [dims, args],
          loc
        );
      }
      // Property read as statement (unusual but valid)
      matchAndMove(newLines, tokenStream);
      return new TypedElementAccessNode(
        { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: false },
        [dims],
        loc
      );
    }
    // No dot — fall through to regular array assignment by re-entering the parse
    // This requires backtracking; instead, handle the assignment here:
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);

    if (expr.type === nodeTypes.NewObject) {
      const arrClass = arraySym.classSymbol?.name;
      const newClass = (expr as any).data.classSymbol.name;
      if (arrClass && arrClass !== newClass) {
        throw new CompilationError(
          `Type mismatch: '${name}' holds elements of type '${arrClass}' but 'new ${newClass}' was assigned`
        );
      }
    }
    return new ArrayAssignNode(arraySym, [dims, expr], loc);
  }
}
```

> **Note:** The label `${name}(0)` is a static placeholder in the error message. The actual index shown in the error is the label string — for a cleaner error, use the source text of the dim expr. For v1, `${name}(0)` is acceptable.

**Important:** The `VariableRule` parsing of `isArrayLike` already consumes `(dims)` via `ExpressionList` which calls `matchAndMove(tokens.OpenParen)` internally. But looking at the existing code more carefully:

```typescript
const isArrayLike =
  symbolTable.check(name, symbolTypes.Array) ||
  (check(tokens.OpenParen, tokenStream.current()) &&
    symbolTable.check(name, symbolTypes.Parameter));
if (isArrayLike) {
  const dims = getParserRule('ExpressionList').parse(...);
```

`ExpressionList` consumes `(dims)` including the parens. So after `dims`, the current token would be after `)`. This means in Step 3 above, after `getParserRule('ExpressionList').parse(...)`, we don't need another `matchAndMove(tokens.CloseParen)` — it's already consumed. Remove that line from the code above.

The revised Step 3 block — typed array check goes BEFORE the `isArrayLike` check and replaces it for the typed case:

```typescript
// ── Typed array element member call: enemies(0).update() ─────────────────────
if (symbolTable.check(name, symbolTypes.Array)) {
  const arraySym = symbolTable.get(name, symbolTypes.Array) as any;
  if (arraySym.classSymbol) {
    const dims = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
    if (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text.toLowerCase();
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        matchAndMove(newLines, tokenStream);
        return new TypedElementAccessNode(
          { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: true },
          [dims, args],
          loc
        );
      }
      matchAndMove(newLines, tokenStream);
      return new TypedElementAccessNode(
        { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: false },
        [dims],
        loc
      );
    }
    // No dot — typed array element assignment: enemies(0) = new Enemy()
    matchAndMove(tokens.Equals, tokenStream);
    const valExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);
    if (valExpr.type === nodeTypes.NewObject) {
      const arrClass = arraySym.classSymbol?.name;
      const newClass = (valExpr as any).data.classSymbol.name;
      if (arrClass && arrClass !== newClass) {
        throw new CompilationError(
          `Type mismatch: '${name}' holds elements of type '${arrClass}' but 'new ${newClass}' was assigned`
        );
      }
    }
    return new ArrayAssignNode(arraySym, [dims, valExpr], loc);
  }
}
```

This block should go AFTER the `symbolTypes.Object` check and BEFORE the `isArrayLike` check.

**Also extend for typed dict member calls** in `VariableRule`. Find the dictionary assignment section:

```typescript
// ── Typed dict element member call: players["Alice"].setPosition(0,0) ────────
if (symbolTable.check(name, symbolTypes.Dictionary)) {
  const dictSym = symbolTable.get(name, symbolTypes.Dictionary) as any;
  matchAndMove(tokens.OpenBracket, tokenStream);
  const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
  matchAndMove(tokens.CloseBracket, tokenStream);

  if (dictSym.classSymbol && check(tokens.Dot, tokenStream.current())) {
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();
    if (check(tokens.OpenParen, tokenStream.current())) {
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new TypedElementAccessNode(
        { collectionSymbol: dictSym, memberName, label: `${name}[...]`, kind: 'dict', isMethod: true },
        [keyExpr, args],
        loc
      );
    }
    matchAndMove(newLines, tokenStream);
    return new TypedElementAccessNode(
      { collectionSymbol: dictSym, memberName, label: `${name}[...]`, kind: 'dict', isMethod: false },
      [keyExpr],
      loc
    );
  }

  // No dot (or untyped dict) — regular dict assignment
  matchAndMove(tokens.Equals, tokenStream);
  const valExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
  matchAndMove(newLines, tokenStream);
  if (dictSym.classSymbol && valExpr.type === nodeTypes.NewObject) {
    const dictClass = dictSym.classSymbol?.name;
    const newClass = (valExpr as any).data.classSymbol.name;
    if (dictClass && dictClass !== newClass) {
      throw new CompilationError(
        `Type mismatch: '${name}' holds values of type '${dictClass}' but 'new ${newClass}' was assigned`
      );
    }
  }
  return new DictionaryAssignNode(dictSym, [keyExpr, valExpr], loc);
}
```

This REPLACES the existing `symbolTable.check(name, symbolTypes.Dictionary)` block in VariableRule.

### Parser — expression context (VariableFactorRule)

Expression context is `arr(i).prop` used inside an expression (e.g. `print arr(0).x` or `dim x = arr(0).value`).

- [ ] **Step 4: Extend `VariableFactorRule` for typed element member access**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`, add imports:

```typescript
import TypedElementAccessNode from '@Basic4WebGL/nodes/TypedElementAccessNode';
```

After the `ArrayLookupNode` creation (currently the last line before return), add a check for typed array member access in expression context:

Find the end of the rule (around line 119-127):
```typescript
matchAndMove(tokens.OpenParen, tokenStream);
const elems = getParserRule('ArrayList').parse(tokenStream, symbolTable, undefined);
matchAndMove(tokens.CloseParen, tokenStream);

return new ArrayLookupNode(symbolTable.get(name, symbolTypes.Array), elems, loc);
```

Replace with:
```typescript
matchAndMove(tokens.OpenParen, tokenStream);
const elems = getParserRule('ArrayList').parse(tokenStream, symbolTable, undefined);
matchAndMove(tokens.CloseParen, tokenStream);

const arraySym = symbolTable.get(name, symbolTypes.Array) as any;

// Typed array element property access in expression context: arr(0).prop
if ((arraySym as any).classSymbol && check(tokens.Dot, tokenStream.current())) {
  matchAndMove(tokens.Dot, tokenStream);
  matchAndMove(tokens.Variable, tokenStream);
  const memberName = tokenStream.prev().text.toLowerCase();
  // Method call in expression context (returns a value): arr(0).getX()
  if (check(tokens.OpenParen, tokenStream.current())) {
    const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
    return new TypedElementAccessNode(
      { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: false },
      [elems, args],
      loc
    );
  }
  // Property read in expression context: arr(0).x
  return new TypedElementAccessNode(
    { collectionSymbol: arraySym, memberName, label: `${name}(0)`, kind: 'array', isMethod: false },
    [elems],
    loc
  );
}

return new ArrayLookupNode(arraySym, elems, loc);
```

Also extend the dictionary lookup section in `VariableFactorRule` (around line 93):

```typescript
if (check(tokens.OpenBracket, tokenStream.current())) {
  const dictSym = symbolTable.get(name, symbolTypes.Dictionary) as any;
  matchAndMove(tokens.OpenBracket, tokenStream);
  const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
  matchAndMove(tokens.CloseBracket, tokenStream);

  // Typed dict element property access: d["key"].prop or d["key"].method()
  if (dictSym.classSymbol && check(tokens.Dot, tokenStream.current())) {
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();
    if (check(tokens.OpenParen, tokenStream.current())) {
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new TypedElementAccessNode(
        { collectionSymbol: dictSym, memberName, label: `${name}[...]`, kind: 'dict', isMethod: false },
        [keyExpr, args],
        loc
      );
    }
    return new TypedElementAccessNode(
      { collectionSymbol: dictSym, memberName, label: `${name}[...]`, kind: 'dict', isMethod: false },
      [keyExpr],
      loc
    );
  }

  return new DictionaryLookupNode(dictSym, keyExpr, loc);
}
```

### Runtime helper

- [ ] **Step 5: Add `_sbRequireInit` to `bootstrapper.html`**

In `src/components/Runner/bootstrapper.html`, find the block of `const _sb...` helper definitions (near `_createDict`, `_sbDictGet`). Add:

```javascript
const _sbRequireInit = (val, label) => {
  if (val == null)
    throw new Error(`Null reference: '${label}' has not been initialised. Assign a value with 'new' before accessing members.`);
  return val;
};
```

- [ ] **Step 6: Run the target tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

Expected passing: all `typed array — member access` and `typed dict — member access` tests.

- [ ] **Step 7: Full suite**

```
npx vitest run
```

- [ ] **Step 8: Verify build**

```
npx vite build
```

- [ ] **Step 9: Commit**

```
git add src/lib/Basic4WebGL/nodes/TypedElementAccessNode.ts \
  src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedElementAccessRule.ts \
  src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts \
  src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts \
  src/components/Runner/bootstrapper.html
git commit -m "feat: typed element member access with null-check wrapper, add _sbRequireInit helper"
```

---

## Task 8: Call-site type checking

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/FunctionFactorRule.ts` (or `FunctionCallRule.ts`)

When a typed-param function is called, check argument types for `NewObjectNode` arguments and bare Object variable references.

- [ ] **Step 1: Locate where function call arguments are collected**

The function call argument list is parsed in the rule handling `functionName(args)` in expression context. Find `FunctionFactorRule.ts` in `src/lib/Basic4WebGL/parserRules/rules/Expressions/`. Read it to understand how `args` are collected and how `functionSymbol.parameters` is available.

- [ ] **Step 2: Add call-site type checking after argument parsing**

After the args are parsed and before returning the call node, add type checking for each argument against the corresponding parameter:

```typescript
// Type check: verify args match typed params
if (functionSymbol && functionSymbol.parameters) {
  const argNodes = args?.children ?? [];
  functionSymbol.parameters.forEach((param: any, i: number) => {
    const paramClass = param?.classSymbol?.name;
    if (!paramClass) return; // untyped param — skip

    const argNode = argNodes[i];
    if (!argNode) return; // missing arg — not our job to error here

    if (argNode.type === nodeTypes.NewObject) {
      const argClass = argNode.data.classSymbol.name;
      if (argClass !== paramClass) {
        throw new CompilationError(
          `Type mismatch at argument ${i + 1}: parameter '${param.name}' expects '${paramClass}' but got 'new ${argClass}'`
        );
      }
    } else if (argNode.data && (argNode.data as any).classSymbol) {
      // Bare Object variable reference (TermNode wrapping an Object symbol)
      const argClass = (argNode.data as any).classSymbol.name;
      if (argClass !== paramClass) {
        throw new CompilationError(
          `Type mismatch at argument ${i + 1}: parameter '${param.name}' expects '${paramClass}' but got '${argClass}'`
        );
      }
    }
  });
}
```

Import `nodeTypes` at the top of the rule file if not already imported.

- [ ] **Step 3: Run call-site type checking tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts --reporter=verbose
```

Expected passing: all `call-site type checking` tests.

- [ ] **Step 4: Full suite**

```
npx vitest run
```

Expected: all 752+ tests passing, no regressions.

- [ ] **Step 5: Verify build**

```
npx vite build
```

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/FunctionFactorRule.ts
git commit -m "feat: call-site type checking for typed function parameters"
```

---

## Task 9: Documentation

**Files:**
- Create: `src/docs/language-guide/new-keyword.md`
- Modify: `src/docs/language-guide/arrays.md`
- Modify: `src/docs/language-guide/dictionaries.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Create `new-keyword.md`**

Create `src/docs/language-guide/new-keyword.md`:

````markdown
# The `new` Keyword

The `new` keyword creates an object instance. It is used to assign objects to typed variables and typed collection slots.

## Typed variables

Declare a typed variable with `dim name as ClassName`, then assign with `new`:

```bas
dim player as Sprite
player = new Sprite("hero.png")

player.setPosition(100, 200)
```

You can also declare and initialise in one line using type inference:

```bas
dim player = new Sprite("hero.png")

player.setPosition(100, 200)   ' type is inferred — member access compiles
```

## Reassignment

A typed variable can be reassigned at any time with the same type:

```bas
dim player as Sprite
player = new Sprite("hero.png")
' later...
player = new Sprite("hero2.png")   ' OK — same type
```

Assigning the wrong type is a compile error:

```bas
dim player as Sprite
player = new Enemy("goblin.png")   ' compile error — type mismatch
```

## Typed arrays

Declare a typed array with `dim arr(N) as ClassName`. All slots start empty — assign each slot with `new`:

```bas
dim enemies(10) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")

enemies(0).update()   ' OK — element type is Enemy
```

Accessing a slot before assigning it is a runtime error. Assign all the slots you plan to use before calling methods on them.

## Typed dictionaries

Declare a typed dictionary with `dim d[] as ClassName`. Keys start empty — assign each key with `new`:

```bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"] = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)
```

## Typed parameters

Functions can accept typed parameters. Member access on typed parameters compiles:

```bas
function spawn(e as Enemy)
  e.update()
endfunction

spawn(new Enemy("goblin.png"))
```

Passing the wrong type is a compile error:

```bas
dim s as Sprite("hero.png")
spawn(s)   ' compile error — Sprite is not Enemy
```

## Null reference errors

Accessing a member on a typed variable or collection slot that has not been assigned gives a runtime error:

```
Null reference: 'enemies(5)' has not been initialised. Assign a value with 'new' before accessing members.
```

Always assign slots before calling methods on them.
````

- [ ] **Step 2: Update `arrays.md` — add typed arrays section**

In `src/docs/language-guide/arrays.md`, find the end of the file and append a new section:

````markdown
## Typed arrays

A typed array holds elements of a specific class. Declare it with `dim arr(N) as ClassName` and assign each slot individually with `new`:

```bas
dim enemies(3) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")
enemies(2) = new Enemy("troll.png")

enemies(0).update()
```

All slots start empty. Accessing an unassigned slot stops the game with a null reference error. See [The `new` Keyword](new-keyword.md) for the full reference.
````

- [ ] **Step 3: Update `dictionaries.md` — add typed dicts section**

In `src/docs/language-guide/dictionaries.md`, append at the end:

````markdown
## Typed dictionaries

A typed dictionary holds values of a specific class. Declare it with `dim d[] as ClassName` and assign each key with `new`:

```bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"] = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)
```

Values not yet assigned give a runtime error if accessed. See [The `new` Keyword](new-keyword.md).
````

- [ ] **Step 4: Update `manifest.ts`**

In `src/docs/manifest.ts`, add `new-keyword` to the Language Guide topic list. Place it after `dictionaries`:

```typescript
{ slug: 'new-keyword', title: 'The new Keyword', file: 'language-guide/new-keyword.md' },
```

- [ ] **Step 5: Verify build**

```
npx vite build
```

- [ ] **Step 6: Run full test suite**

```
npx vitest run
```

Expected: all tests passing.

- [ ] **Step 7: Commit**

```
git add src/docs/language-guide/new-keyword.md \
  src/docs/language-guide/arrays.md \
  src/docs/language-guide/dictionaries.md \
  src/docs/manifest.ts
git commit -m "docs: add new-keyword language guide, update arrays and dictionaries guides"
```

---

## Self-review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| `new ClassName(args)` expression | Task 2 |
| `dim a as Sprite` → null (no eager construction) | Task 4a |
| `dim a = new Sprite(...)` type inference | Task 4d |
| `dim a as Sprite("img")` (with args) unchanged | Task 4a — CloneRule only changes no-children path |
| `a = new Sprite(...)` type checks | Task 5 |
| Variant + new → compile error | Task 5 |
| `dim arr(10) as Sprite` → null-init slots | Task 4b |
| `dim arr(10) as Sprite("img")` → compile error (removed form) | Task 4c |
| `arr(0) = new Enemy(...)` type checks | Task 5 / Task 7 |
| `arr(0).method()` → `_sbRequireInit(...)` | Task 7 |
| `dim d[] as Sprite` → typed dict declaration | Task 3 (classSymbol attached in DimRule for dict) |
| `d["k"] = new Sprite(...)` type checks | Task 5 / Task 7 |
| `d["k"].method()` → `_sbRequireInit(...)` | Task 7 |
| Typed scalar param `a as ClassName` | Task 6 |
| Typed array param `arr() as ClassName` | Task 6 |
| Typed dict param `d[] as ClassName` | Task 6 |
| Untyped array param `arr()` | Task 6 |
| Untyped dict param `d[]` | Task 6 |
| Call-site type checking | Task 8 |
| `_sbRequireInit` runtime helper | Task 7 |
| Documentation | Task 9 |

### Gap check

**Typed dict declaration with `classSymbol` in DimRule:** Task 3 (symbol extensions) handles `ArraySymbol` and `DictionarySymbol` classSymbol fields. But DimRule currently creates `DictionaryDimNode` without a `classSymbol`. The `dim d[] as Sprite` form needs to be added to DimRule's `OpenBracket` branch.

This is a gap — add it to Task 4c. In DimRule's `OpenBracket` section, after creating the `DictionarySymbol`, check for `as ClassName`:

```typescript
} else if (check(tokens.OpenBracket, tokenStream.current())) {
  matchAndMove(tokens.OpenBracket, tokenStream);
  if (!check(tokens.CloseBracket, tokenStream.current())) {
    throw new CompilationError(`Dictionary declaration must use empty brackets: 'dim ${name}[]'`);
  }
  matchAndMove(tokens.CloseBracket, tokenStream);

  const dictSymbol = symbolTable.addTyped(
    new DictionarySymbol(name, symbolTypes.Dictionary, symbolTable.getScope(), symbolTable.getFullScopeName())
  );

  // NEW: typed dict — dim d[] as ClassName
  if (check(tokens.As, tokenStream.current())) {
    matchAndMove(tokens.As, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const classSymbol = symbolTable.get(tokenStream.prev().text, symbolTypes.Class);
    dictSymbol.classSymbol = classSymbol;
  }

  if (nodesSoFar.length > 0 || check(tokens.Comma, tokenStream.current())) {
    throw new CompilationError(`Dictionary declaration '${name}[]' cannot appear in a multi-variable dim — move it to its own line.`);
  }

  return new DictionaryDimNode(dictSymbol, loc);
}
```

Add this to Task 4c's implementation steps.

**ExpressionList parens:** The `ExpressionList` parser rule consumes `(`, the list, and `)`. In Task 7's VariableRule code, after `getParserRule('ExpressionList').parse(...)` for method args, there should be no additional `matchAndMove(tokens.CloseParen, ...)`. The note in Task 7 Step 3 already flags this — verify during implementation.

**TypedElementAccessRule label accuracy:** The label `"enemies(0)"` in the error message is static. This is acceptable for v1 — the slot index isn't known at compile time and a static label is sufficient for debugging.

**isMethod flag for expression-context method calls:** In VariableFactorRule (Task 7 Step 4), method calls in expression context (`dim x = arr(0).getX()`) use `isMethod: false` in the data so no trailing `;` is emitted. This is correct — the `isMethod: false` path in the transpiler emits without semicolon.
