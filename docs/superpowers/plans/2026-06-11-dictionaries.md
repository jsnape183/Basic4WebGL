# Dictionaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class dictionary type to softBASIC — `dim scores[]` declares a dictionary, `scores["key"] = val` sets values, `scores["key"]` reads them, with a shared collection API alongside arrays.

**Architecture:** New `[` `]` tokens are added to the lexer and TokenResolver. `DictionarySymbol` is added to the symbol table. Three new AST nodes (`DictionaryDimNode`, `DictionaryLookupNode`, `DictionaryAssignNode`) and three matching transpiler rules emit `_createDict()`, `map.set(k,v)`, and `_sbDictGet(map,k)`. `DimRule`, `VariableRule`, and `VariableFactorRule` are extended to detect dictionary symbols and dispatch to the new nodes. Unified JS helpers in `bootstrapper.html` make shared API functions (`length`, `contains`, `remove`, `clear`, `join`) work for both arrays and Maps.

**Tech Stack:** TypeScript, Vitest, softBASIC compiler pipeline (`@RegisterTranspilerRule` decorator pattern, `import.meta.glob` autoload), JavaScript Map runtime.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/Basic4WebGL/tokens.ts` | Add `OpenBracket`, `CloseBracket` token types |
| Modify | `src/lib/Basic4WebGL/TokenResolver.ts` | Add `[` `]` resolver rules |
| Modify | `src/lib/Basic4WebGL/symbolTypes.ts` | Add `DictionarySymbol` class + `Dictionary` key |
| Modify | `src/lib/Basic4WebGL/nodeTypes.ts` | Add `DictionaryDim`, `DictionaryLookup`, `DictionaryAssign` |
| Create | `src/lib/Basic4WebGL/nodes/DictionaryDimNode.ts` | AST node for `dim name[]` |
| Create | `src/lib/Basic4WebGL/nodes/DictionaryLookupNode.ts` | AST node for `name[key]` in expression |
| Create | `src/lib/Basic4WebGL/nodes/DictionaryAssignNode.ts` | AST node for `name[key] = value` |
| Create | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryDimRule.ts` | Emit `_createDict()` |
| Create | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts` | Emit `_sbDictGet(map,key)` |
| Create | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts` | Emit `map.set(key,value)` |
| Modify | `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` | Handle `dim name[]` → `DictionaryDimNode` |
| Modify | `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` | Handle `name[key] = val` → `DictionaryAssignNode` |
| Modify | `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | Handle `name[key]` → `DictionaryLookupNode` |
| Modify | `src/components/Runner/bootstrapper.html` | Add `_createDict`, `_sbDictGet`, unified collection helpers |
| Modify | `src/lib/Basic4WebGL/defs/array.bas` | Update shared functions to use unified helpers; add `length` |
| Create | `src/lib/Basic4WebGL/defs/dict.bas` | `keys`, `values`, `joinKeys` functions |
| Modify | `src/docs/manifest.ts` | Add `dict` to softCore group; add `dictionaries` to Language Guide |
| Create | `src/docs/api-reference/dict.md` | API reference page for dict module |
| Create | `src/docs/language-guide/dictionaries.md` | Language guide page for dictionaries |
| Create | `tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts` | All dictionary tests |

---

### Task 1: Write all failing tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

const arrayLib = {
  name: 'array',
  source: readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8'),
};

// dict.bas doesn't exist yet — these tests will fail until Task 6
const dictLib = () => ({
  name: 'dict',
  source: readFileSync('src/lib/Basic4WebGL/defs/dict.bas', 'utf-8'),
});

const transpileWith = (libs: { name: string; source: string }[], source: string) =>
  compiler.transpile({ lib: libs, files: [{ name: 'Main.bas', source }] });

describe('Dictionary — declaration', () => {
  test('dim scores[] at module level produces _createDict()', () => {
    const result = transpile('dim scores[]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores = _createDict()');
  });

  test('dim scores[] inside function produces let with _createDict()', () => {
    const result = transpile('function test()\n  dim scores[]\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('let test_scores = _createDict()');
  });

  test('dim scores[] = value is a compile error', () => {
    const result = transpile('dim scores[] = 5');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

describe('Dictionary — assignment', () => {
  test('scores["Alice"] = 100 emits .set("Alice",100)', () => {
    const result = transpile('dim scores[]\nscores["Alice"] = 100');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set("Alice",100)');
  });

  test('scores[42] = "hello" emits .set(42,"hello")', () => {
    const result = transpile('dim scores[]\nscores[42] = "hello"');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set(42,"hello")');
  });

  test('scores["Alice"] = 100 inside function uses function-scoped symbol', () => {
    const result = transpile([
      'function test()',
      '  dim scores[]',
      '  scores["Alice"] = 100',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('test_scores.set("Alice",100)');
  });
});

describe('Dictionary — lookup', () => {
  test('print scores["Alice"] emits _sbDictGet', () => {
    const result = transpile('dim scores[]\nprint scores["Alice"]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
  });

  test('print scores[42] emits _sbDictGet with number key', () => {
    const result = transpile('dim scores[]\nprint scores[42]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,42)');
  });

  test('dict lookup inside function uses function-scoped variable', () => {
    const result = transpile([
      'function test()',
      '  dim scores[]',
      '  print scores["key"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(test_scores,"key")');
  });

  test('dict value can be assigned to a variable', () => {
    const result = transpile([
      'dim scores[]',
      'function test()',
      '  dim x',
      '  x = scores["Alice"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
  });
});

describe('Dictionary — dict.bas API', () => {
  test('dict.keys(d) compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim k',
      '  k = dict.keys(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dict.values(d) compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim v',
      '  v = dict.values(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dict.joinKeys(d, ",") compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim s',
      '  s = dict.joinKeys(d, ",")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('array.bas — updated shared functions still work for arrays', () => {
  const withArray = (body: string) =>
    transpileWith([arrayLib], ['dim arr(0)', body].join('\n'));

  test('array.length(arr) compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.length(arr)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.join(arr, ",") still compiles after update', () => {
    const result = withArray('function test()\n  print array.join(arr, ",")\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains(arr, 42) still compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.contains(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.remove(arr, 0) still compiles', () => {
    const result = withArray('array.remove(arr, 0)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.clear(arr) still compiles', () => {
    const result = withArray('array.clear(arr)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.length(d) compiles with a dictionary', () => {
    const result = transpileWith([arrayLib], [
      'dim d[]',
      'function test()',
      '  dim x',
      '  x = array.length(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains(d, "key") compiles with a dictionary', () => {
    const result = transpileWith([arrayLib], [
      'dim d[]',
      'function test()',
      '  dim x',
      '  x = array.contains(d, "key")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — verify they all fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts
```

Expected: ALL tests FAIL. Most with "Unexpected token [" or "Cannot find transpiler rule".

- [ ] **Step 3: Commit**

```
git add tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts
git commit -m "test: add failing tests for dictionary type"
```

---

### Task 2: Foundation — tokens, symbolTypes, nodeTypes, node files

**Files:**
- Modify: `src/lib/Basic4WebGL/tokens.ts`
- Modify: `src/lib/Basic4WebGL/TokenResolver.ts`
- Modify: `src/lib/Basic4WebGL/symbolTypes.ts`
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/DictionaryDimNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/DictionaryLookupNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/DictionaryAssignNode.ts`

- [ ] **Step 1: Add `OpenBracket` and `CloseBracket` to `tokens.ts`**

In `src/lib/Basic4WebGL/tokens.ts`, add the two new tokens after `CloseParen`:

```typescript
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
  'Equals',
  // ... rest unchanged
]);
```

- [ ] **Step 2: Add `[` and `]` resolver rules to `TokenResolver.ts`**

In `src/lib/Basic4WebGL/TokenResolver.ts`, add two entries after the `)` entry (around line 80):

```typescript
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '['),
      token: tokens.OpenBracket,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, ']'),
      token: tokens.CloseBracket,
    }),
  },
```

- [ ] **Step 3: Add `DictionarySymbol` and `Dictionary` to `symbolTypes.ts`**

In `src/lib/Basic4WebGL/symbolTypes.ts`, add `Dictionary` to the `symbolTypes` object and add the `DictionarySymbol` class:

```typescript
export const symbolTypes = {
  Variable: 'Variable',
  Function: 'Function',
  Array: 'Array',
  Parameter: 'Parameter',
  Module: 'Module',
  Object: 'Object',
  Class: 'Class',
  Dictionary: 'Dictionary',
};

// ... existing FunctionSymbol and ArraySymbol unchanged ...

export class DictionarySymbol extends Symbol {
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
  }
}
```

- [ ] **Step 4: Add three node type names to `nodeTypes.ts`**

In `src/lib/Basic4WebGL/nodeTypes.ts`, add after `'SuperMethodTerm'`:

```typescript
  'DictionaryDim',
  'DictionaryLookup',
  'DictionaryAssign',
```

- [ ] **Step 5: Create `DictionaryDimNode.ts`**

```typescript
// src/lib/Basic4WebGL/nodes/DictionaryDimNode.ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DictionaryDimNode extends Tree {
  constructor(data: any, loc?: SourceLocation) {
    super(nodeTypes.DictionaryDim, data, []);
    this.loc = loc;
  }
}

export default DictionaryDimNode;
```

- [ ] **Step 6: Create `DictionaryLookupNode.ts`**

```typescript
// src/lib/Basic4WebGL/nodes/DictionaryLookupNode.ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DictionaryLookupNode extends Tree {
  constructor(data: any, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.DictionaryLookup, data, children);
    this.loc = loc;
  }
}

export default DictionaryLookupNode;
```

- [ ] **Step 7: Create `DictionaryAssignNode.ts`**

```typescript
// src/lib/Basic4WebGL/nodes/DictionaryAssignNode.ts
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseAssignableValidatorNode from '../validators/BaseAssignableValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DictionaryAssignNode extends BaseAssignableValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.DictionaryAssign, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default DictionaryAssignNode;
```

- [ ] **Step 8: Run full test suite — confirm no existing tests broken**

```
npx vitest run
```

Expected: all pre-existing tests pass. The new dictionary tests still fail (no transpiler/parser rules yet).

- [ ] **Step 9: Commit**

```
git add src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/TokenResolver.ts src/lib/Basic4WebGL/symbolTypes.ts src/lib/Basic4WebGL/nodeTypes.ts src/lib/Basic4WebGL/nodes/DictionaryDimNode.ts src/lib/Basic4WebGL/nodes/DictionaryLookupNode.ts src/lib/Basic4WebGL/nodes/DictionaryAssignNode.ts
git commit -m "feat: add dictionary tokens, symbol type, node types and node files"
```

---

### Task 3: Transpiler rules

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryDimRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts`

These are auto-loaded by `import.meta.glob` — no registration changes needed.

- [ ] **Step 1: Create `DictionaryDimRule.ts`**

```typescript
// src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryDimRule.ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryDim)
class DictionaryDimRule implements IGeneratable {
  generate(node: Tree, _table: Symbols | undefined): string {
    const rhs = '_createDict()';

    if (node.data.scope.type === scopeTypes.Class) {
      return `${node.data.scope.name}.prototype.${node.data.name} = ${rhs};`;
    }

    if (
      node.data.scope.type === scopeTypes.Function ||
      node.data.scope.type === scopeTypes.Constructor
    ) {
      return `let ${formatSymbol(node.data)} = ${rhs};`;
    }

    return `${formatSymbol(node.data)} = ${rhs};`;
  }
}

export default DictionaryDimRule;
```

- [ ] **Step 2: Create `DictionaryLookupRule.ts`**

```typescript
// src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryLookup)
class DictionaryLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `_sbDictGet(${formatSymbol(node.data)},${doChild(node, 0, table)})`;
  }
}

export default DictionaryLookupRule;
```

- [ ] **Step 3: Create `DictionaryAssignRule.ts`**

```typescript
// src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryAssign)
class DictionaryAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `${formatSymbol(node.data)}.set(${doChild(node, 0, table)},${doChild(node, 1, table)});`;
  }
}

export default DictionaryAssignRule;
```

- [ ] **Step 4: Run tests — verify nothing broken**

```
npx vitest run
```

Expected: all pre-existing tests pass. Dictionary tests still fail (parser rules not wired yet).

- [ ] **Step 5: Commit**

```
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryDimRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts
git commit -m "feat: add dictionary transpiler rules (dim, lookup, assign)"
```

---

### Task 4: Parser — DimRule extension (dictionary declaration)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`

- [ ] **Step 1: Add imports to `DimRule.ts`**

At the top of `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`, add two new imports alongside the existing ones:

```typescript
import { ArraySymbol, DictionarySymbol, symbolTypes } from '../../symbolTypes';
import DictionaryDimNode from '../../nodes/DictionaryDimNode';
```

(Replace the existing `import { ArraySymbol, symbolTypes }` line.)

- [ ] **Step 2: Add the `[` `]` branch inside `parseDeclarator`**

In `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`, inside `parseDeclarator`, add a new `else if` branch for `OpenBracket` **before** the existing `else` (plain variable) branch and **after** the `OpenParen` (array) branch. The relevant section currently ends:

```typescript
    } else {
      // ── dim name ─────────────────────────────────────────────────────────
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol, loc);
    }
```

Insert before that final `else`:

```typescript
    } else if (check(tokens.OpenBracket, tokenStream.current())) {
      // ── dim name[] ───────────────────────────────────────────────────────
      matchAndMove(tokens.OpenBracket, tokenStream);
      if (!check(tokens.CloseBracket, tokenStream.current())) {
        throw new CompilationError(
          `Dictionary declaration must use empty brackets: 'dim ${name}[]'`
        );
      }
      matchAndMove(tokens.CloseBracket, tokenStream);

      const dictSymbol = symbolTable.addTyped(
        new DictionarySymbol(
          name,
          symbolTypes.Dictionary,
          symbolTable.getScope(),
          symbolTable.getFullScopeName()
        )
      );

      if (
        nodesSoFar.length > 0 ||
        check(tokens.Comma, tokenStream.current())
      ) {
        throw new CompilationError(
          `Dictionary declaration '${name}[]' cannot appear in a multi-variable dim — move it to its own line.`
        );
      }

      return new DictionaryDimNode(dictSymbol, loc);

    } else {
```

- [ ] **Step 3: Add `DictionaryDim` to the newline-consumption check**

In the same file, in `DimRule.parse()`, update the single-declarator newline check from:

```typescript
      if (
        single.type === nodeTypes.Dim ||
        single.type === nodeTypes.TypedArrayDim
      ) {
        matchAndMove(newLines, tokenStream);
      }
```

to:

```typescript
      if (
        single.type === nodeTypes.Dim ||
        single.type === nodeTypes.TypedArrayDim ||
        single.type === nodeTypes.DictionaryDim
      ) {
        matchAndMove(newLines, tokenStream);
      }
```

- [ ] **Step 4: Run declaration tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts
```

Expected: the three `Dictionary — declaration` tests now PASS. Assignment/lookup tests still fail.

- [ ] **Step 5: Run full suite — confirm no regressions**

```
npx vitest run
```

Expected: all pre-existing tests still pass.

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/DimRule.ts
git commit -m "feat: extend DimRule to parse dim name[] as dictionary declaration"
```

---

### Task 5: Parser — VariableRule + VariableFactorRule (assignment and lookup)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`

- [ ] **Step 1: Add imports to `VariableRule.ts`**

At the top of `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, add:

```typescript
import DictionaryAssignNode from '../../nodes/DictionaryAssignNode';
```

alongside the existing node imports. Also add `symbolTypes.Dictionary` — it's already available via `import { symbolTypes, scopeTypes } from '../../symbolTypes';`.

- [ ] **Step 2: Add dictionary assignment handling to `VariableRule.ts`**

In `VariableRule.parse()`, insert the dictionary check **before** the `isArrayLike` block. The current code reads:

```typescript
    // Handle array indexing: arr(i) = v for both Array and Variable (pass-by-ref array param)
    const isArrayLike =
      symbolTable.check(name, symbolTypes.Array) || ...
```

Insert before that:

```typescript
    // Handle dictionary assignment: dict["key"] = value
    if (symbolTable.check(name, symbolTypes.Dictionary)) {
      const dictSymbol = symbolTable.get(name, symbolTypes.Dictionary);
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseBracket, tokenStream);
      matchAndMove(tokens.Equals, tokenStream);
      const valExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(newLines, tokenStream);
      return new DictionaryAssignNode(dictSymbol, [keyExpr, valExpr], loc);
    }

    // Handle array indexing: arr(i) = v ...
```

Also add `tokens.OpenBracket` and `tokens.CloseBracket` to the imports from `'../../tokens'` — they're already imported via `import tokens from '../../tokens'` so no change needed there.

- [ ] **Step 3: Add imports to `VariableFactorRule.ts`**

At the top of `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`, add:

```typescript
import DictionaryLookupNode from '@Basic4WebGL/nodes/DictionaryLookupNode';
```

alongside the existing node imports.

- [ ] **Step 4: Add dictionary lookup handling to `VariableFactorRule.ts`**

In `VariableFactorRule.parse()`, insert the `OpenBracket` check **after** the Function check and **before** the `!check(tokens.OpenParen, ...)` block. The current code reads:

```typescript
    if (symbolTable.check(name, symbolTypes.Function)) {
      return getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
```

Insert between those two blocks:

```typescript
    // Dictionary lookup in expression context: dict["key"]
    if (check(tokens.OpenBracket, tokenStream.current())) {
      const dictSymbol = symbolTable.get(name, symbolTypes.Dictionary);
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseBracket, tokenStream);
      return new DictionaryLookupNode(dictSymbol, keyExpr, loc);
    }
```

Also update the bare-reference fallback (the `!check(tokens.OpenParen, ...)` block) to recognise Dictionary symbols, so a dict passed as a function argument resolves correctly:

```typescript
    if (!check(tokens.OpenParen, tokenStream.current())) {
      let varSymbol: Symbol;
      if (symbolTable.check(name, symbolTypes.Array)) {
        varSymbol = symbolTable.get(name, symbolTypes.Array);
      } else if (symbolTable.check(name, symbolTypes.Dictionary)) {
        varSymbol = symbolTable.get(name, symbolTypes.Dictionary);
      } else {
        varSymbol = symbolTable.get(name);
      }
      if (isInstancePropertyAccess(varSymbol, symbolTable)) {
        throw new CompilationError(`'${name}' is a class property — use self.${name}`);
      }
      return new TermNode(varSymbol, new VariableNode(name), loc);
    }
```

- [ ] **Step 5: Run dictionary tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts
```

Expected: all `Declaration`, `Assignment`, and `Lookup` describe blocks now PASS. The `dict.bas API` and `array.bas` tests still fail (dict.bas doesn't exist, array.bas not yet updated).

- [ ] **Step 6: Run full suite — confirm no regressions**

```
npx vitest run
```

Expected: all pre-existing tests pass.

- [ ] **Step 7: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts
git commit -m "feat: extend VariableRule and VariableFactorRule to handle dictionary assignment and lookup"
```

---

### Task 6: Runtime helpers + .bas files

**Files:**
- Modify: `src/components/Runner/bootstrapper.html`
- Modify: `src/lib/Basic4WebGL/defs/array.bas`
- Create: `src/lib/Basic4WebGL/defs/dict.bas`

- [ ] **Step 1: Add runtime helpers to `bootstrapper.html`**

In `src/components/Runner/bootstrapper.html`, after the `_createTypedArray` block (around line 26), insert:

```javascript
      const _createDict = () => new Map();
      const _sbDictGet = (map, key) => {
        if (!map.has(key)) throw new Error(`Dictionary key not found: ${JSON.stringify(key)}`);
        return map.get(key);
      };
      const _sbLength   = x          => x instanceof Map ? x.size : x.length;
      const _sbRemove   = (col, k)   => col instanceof Map ? col.delete(k) : col.splice(k, 1);
      const _sbContains = (col, item)=> col instanceof Map ? col.has(item) : col.includes(item);
      const _sbClear    = col        => { if (col instanceof Map) col.clear(); else col.splice(0); };
      const _sbJoin     = (col, sep) => col instanceof Map
        ? Array.from(col.values()).join(sep)
        : col.join(sep);
```

- [ ] **Step 2: Update `array.bas`**

Replace the entire contents of `src/lib/Basic4WebGL/defs/array.bas` with:

```basic
' Start of Array functions
function arrLength(a): return call("arrlength_a.length"):endfunction
function length(col): return call("_sbLength(length_col)"):endfunction
function join(col, sep): return call("_sbJoin(join_col, join_sep)"):endfunction
function push(arr, item): call("push_arr.push(push_item)"):endfunction
function pop(arr): return call("pop_arr.pop()"):endfunction
function contains(col, item): return call("_sbContains(contains_col, contains_item)"):endfunction
function indexOf(arr, item): return call("indexof_arr.indexOf(indexof_item)"):endfunction
function remove(col, key): call("_sbRemove(remove_col, remove_key)"):endfunction
function clear(col): call("_sbClear(clear_col)"):endfunction
' End of Array functions
```

- [ ] **Step 3: Create `dict.bas`**

```basic
' Start of Dict functions
function keys(dic): return call("Array.from(keys_dic.keys())"):endfunction
function values(dic): return call("Array.from(values_dic.values())"):endfunction
function joinKeys(dic, sep): return call("Array.from(joinkeys_dic.keys()).join(joinkeys_sep)"):endfunction
' End of Dict functions
```

- [ ] **Step 4: Run all dictionary tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts
```

Expected: ALL tests in the file now PASS.

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: all tests pass (including pre-existing array tests).

- [ ] **Step 6: Verify the build**

```
npx vite build
```

Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

```
git add src/components/Runner/bootstrapper.html src/lib/Basic4WebGL/defs/array.bas src/lib/Basic4WebGL/defs/dict.bas
git commit -m "feat: add dictionary runtime helpers and .bas definition files"
```

---

### Task 7: Documentation

**Files:**
- Create: `src/docs/api-reference/dict.md`
- Create: `src/docs/language-guide/dictionaries.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Create `src/docs/api-reference/dict.md`**

```markdown
# dict

The `dict` module provides functions for working with dictionaries.

A dictionary stores values under named keys. Use `dim name[]` to declare one, square brackets to set and get values, and `dict.*` functions for common operations.

---

## keys

Returns an array containing all keys in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary to read from |

**Returns:** array — the keys as a new array.

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)
print array.arrLength(k)   ' 2
```

---

## values

Returns an array containing all values in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary to read from |

**Returns:** array — the values as a new array.

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim v
v = dict.values(scores)
print array.join(v, ", ")   ' 100, 80
```

---

## joinKeys

Joins all keys in the dictionary into a single string, separated by a delimiter.

| Parameter | Type | Description |
|---|---|---|
| `dic` | object | The dictionary |
| `sep` | string | The separator string |

**Returns:** string — keys joined by the separator.

```bas
dim inventory[]
inventory["sword"] = 1
inventory["shield"] = 1

dim s
s = dict.joinKeys(inventory, ", ")
print s   ' sword, shield
```
```

- [ ] **Step 2: Create `src/docs/language-guide/dictionaries.md`**

```markdown
# Dictionaries

A dictionary stores values under named keys. Each key maps to one value, and you can look up, add, or replace values at any time using square bracket syntax.

## Declaring a dictionary

Use `dim` with empty square brackets:

```bas
dim scores[]
dim inventory[]
```

Dictionaries are always empty at creation — you cannot set values in the declaration line.

## Setting values

Assign to any key using square brackets. Keys can be strings or numbers:

```bas
scores["Alice"] = 100
scores["Bob"] = 80
scores[1] = 999
```

If the key already exists, its value is replaced.

## Reading values

Read a value using the same square bracket syntax:

```bas
print scores["Alice"]   ' 100

dim x
x = scores["Bob"]
```

If the key does not exist, the game stops with the error: `Dictionary key not found: "Alice"`. Use `array.contains(d, key)` to check before reading if the key might be missing.

## Checking and removing keys

The shared collection functions work with dictionaries as well as arrays:

```bas
' Check if a key exists
if array.contains(scores, "Alice") = true
  print scores["Alice"]
endif

' Remove a key
array.remove(scores, "Bob")

' Count the number of keys
print array.length(scores)

' Empty the dictionary
array.clear(scores)
```

## Getting all keys or values

Use `dict.keys` and `dict.values` to get arrays you can work with:

```bas
dim inventory[]
inventory["sword"] = 1
inventory["potion"] = 5
inventory["shield"] = 1

dim k
k = dict.keys(inventory)
print array.arrLength(k)   ' 3
print array.join(k, ", ")  ' sword, potion, shield

dim v
v = dict.values(inventory)
print array.join(v, ", ")  ' 1, 5, 1
```

## String vs number keys

String key `"5"` and number key `5` are different keys — they do not collide:

```bas
dim d[]
d["5"] = "five as string"
d[5]   = "five as number"

print d["5"]   ' five as string
print d[5]     ' five as number
```

## Iterating over a dictionary

To loop over all keys, get them as an array first and use a `for` loop:

```bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)

dim i
for i = 0 to array.arrLength(k) - 1
  print k(i)
  print scores[k(i)]
next i
```
```

- [ ] **Step 3: Update `src/docs/manifest.ts`**

Add `dict` to the softCore group and `dictionaries` to the Language Guide topics. The updated file:

```typescript
// In the language-guide section, add after 'arrays':
{ slug: 'dictionaries', title: 'Dictionaries', file: 'language-guide/dictionaries.md' },
```

```typescript
// In the softCore group, add after 'array':
{ slug: 'dict', title: 'dict', file: 'api-reference/dict.md' },
```

- [ ] **Step 4: Verify the build**

```
npx vite build
```

Expected: build succeeds.

- [ ] **Step 5: Run full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```
git add src/docs/api-reference/dict.md src/docs/language-guide/dictionaries.md src/docs/manifest.ts
git commit -m "docs: add dictionary API reference and language guide page"
```
