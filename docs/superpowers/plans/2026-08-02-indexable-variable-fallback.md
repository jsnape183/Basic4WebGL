# Indexable Variable Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a plain `dim state` variable that receives a dictionary/array back from a function call (`state = save.getAll()`, `k = dict.keys(scores)`) be indexed with `state["key"]` / `k(i)`, for both reads and writes, with a friendly runtime error if the value turns out not to actually be a dictionary/array.

**Architecture:** Four parser call sites (2 reads in `VariableFactorRule.ts`, 2 writes in `VariableRule.ts`) currently require a symbol to be registered with kind `Dictionary`/`Array` before allowing bracket/paren indexing. Each gets a token-gated fallback to a generic `Variable`-kind lookup via a new shared helper, `resolveIndexableSymbol`. Because a `Variable`-kind symbol isn't statically guaranteed to hold a dict/array, the four transpiler codegen rules (`DictionaryLookupRule`, `DictionaryAssignRule`, `ArrayLookupRule`, `ArrayAssignRule`) branch on the resolved symbol's kind: strictly-typed symbols keep today's raw, unguarded codegen byte-for-byte; the new fallback case emits a call to a new runtime-checked helper (`_sbCheckedDictGet` etc., added to `bootstrapper.html`) that throws a beginner-friendly error naming the variable if the runtime value isn't actually a `Map`/array.

**Tech Stack:** TypeScript compiler (lexer/parser/transpiler), Vitest, Cypress (manual verification only — not run by this plan).

Spec: `docs/superpowers/specs/2026-08-02-indexable-variable-fallback-design.md`

---

### Task 1: Runtime guard helpers in `bootstrapper.html`

**Files:**
- Modify: `src/components/Runner/bootstrapper.html:42-45`
- Test: `tests/components/Runner/bootstrapper.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/components/Runner/bootstrapper.test.ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// The runtime helpers live inline in bootstrapper.html's first <script>
// block (no separate JS module exists for them — see _sbDictGet/_createDict
// next to them). We extract just the pure-function block (no `window`/DOM
// references, which don't exist under vitest) and eval it so these can be
// unit-tested without spinning up a browser.
function loadRuntimeHelpers() {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  const match = html.match(/const _createDict[\s\S]*?(?=\n\s*const _print)/);
  if (!match) {
    throw new Error('Could not find runtime helper block in bootstrapper.html');
  }
  const factory = new Function(`${match[0]}
    return { _sbCheckedDictGet, _sbCheckedDictSet, _sbCheckedArrayGet, _sbCheckedArraySet };`);
  return factory();
}

describe('checked dict/array runtime accessors', () => {
  test('_sbCheckedDictGet reads a Map value', () => {
    const { _sbCheckedDictGet } = loadRuntimeHelpers();
    const map = new Map([['level', 3]]);
    expect(_sbCheckedDictGet(map, 'level', 'state')).toBe(3);
  });

  test('_sbCheckedDictGet throws a friendly error for a non-dictionary value', () => {
    const { _sbCheckedDictGet } = loadRuntimeHelpers();
    expect(() => _sbCheckedDictGet(5, 'level', 'state')).toThrow(
      "'state' does not hold a dictionary — cannot read key \"level\"."
    );
  });

  test('_sbCheckedDictSet writes into a Map value', () => {
    const { _sbCheckedDictSet } = loadRuntimeHelpers();
    const map = new Map();
    _sbCheckedDictSet(map, 'level', 3, 'state');
    expect(map.get('level')).toBe(3);
  });

  test('_sbCheckedDictSet throws a friendly error for a non-dictionary value', () => {
    const { _sbCheckedDictSet } = loadRuntimeHelpers();
    expect(() => _sbCheckedDictSet(5, 'level', 3, 'state')).toThrow(
      "'state' does not hold a dictionary — cannot set key \"level\"."
    );
  });

  test('_sbCheckedArrayGet reads an array value', () => {
    const { _sbCheckedArrayGet } = loadRuntimeHelpers();
    expect(_sbCheckedArrayGet(['sword', 'shield'], 0, 'items')).toBe('sword');
  });

  test('_sbCheckedArrayGet throws a friendly error for a non-array value', () => {
    const { _sbCheckedArrayGet } = loadRuntimeHelpers();
    expect(() => _sbCheckedArrayGet(5, 0, 'items')).toThrow(
      "'items' does not hold an array — cannot read index 0."
    );
  });

  test('_sbCheckedArraySet writes into an array value', () => {
    const { _sbCheckedArraySet } = loadRuntimeHelpers();
    const arr = ['sword', 'shield'];
    _sbCheckedArraySet(arr, 1, 'bow', 'items');
    expect(arr[1]).toBe('bow');
  });

  test('_sbCheckedArraySet throws a friendly error for a non-array value', () => {
    const { _sbCheckedArraySet } = loadRuntimeHelpers();
    expect(() => _sbCheckedArraySet(5, 0, 'bow', 'items')).toThrow(
      "'items' does not hold an array — cannot set index 0."
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/bootstrapper.test.ts`
Expected: FAIL — `loadRuntimeHelpers` throws or returns `undefined` functions (`_sbCheckedDictGet` etc. don't exist yet).

- [ ] **Step 3: Implement the runtime helpers**

In `src/components/Runner/bootstrapper.html`, insert after the existing `_sbJoin` const (currently lines 42-44) and before the blank line that precedes `const _print`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/bootstrapper.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/bootstrapper.html tests/components/Runner/bootstrapper.test.ts
git commit -m "feat: add checked dict/array runtime accessors with friendly errors"
```

---

### Task 2: Dictionary read fallback (`state["key"]` on a plain `dim`)

**Files:**
- Create: `src/lib/Basic4WebGL/parserRules/rules/Expressions/helpers/resolveIndexableSymbol.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts:93-124`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

describe('Dictionary read fallback — plain dim variable holding a dict', () => {
  test('indexing a plain dim variable with [] compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  d["level"] = 3',
      '  return d',
      'endfunction',
      'function test()',
      '  dim state',
      '  state = getstate()',
      '  print state["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedDictGet(test_state,"level","state")');
  });

  test('a real dim x[] dictionary keeps using the unguarded fast path', () => {
    const result = transpile('dim scores[]\nprint scores["Alice"]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
    expect(result.code).not.toContain('_sbCheckedDictGet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: FAIL — first test fails with a compile diagnostic (`Dictionary state has not been declared yet.` or similar), since `state["level"]` on a plain `dim state` doesn't parse today.

- [ ] **Step 3: Create the shared resolver helper**

```ts
// src/lib/Basic4WebGL/parserRules/rules/Expressions/helpers/resolveIndexableSymbol.ts
import Symbols, { Symbol } from '@CompilerLib/symbols';
import { symbolTypes } from '../../../../symbolTypes';

// Resolves a symbol for indexed access (dict["key"] / arr(i)). Prefers the
// strictly-declared kind (Dictionary/Array), which guarantees the runtime
// value really is a Map/array. Falls back to a plain Variable-kind symbol
// so a `dim x` that was assigned a dict/array return value from a function
// call can still be indexed — callers must gate this with a token
// lookahead ([ or ( already seen) before calling, so ordinary variable
// assignment (`x = 5`) is never affected.
export default function resolveIndexableSymbol(
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

- [ ] **Step 4: Use the helper in the dict-bracket read path**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`:

Add the import near the other local imports (after the `symbolTypes`/`tokens` imports, around line 17-18):

```ts
import resolveIndexableSymbol from './helpers/resolveIndexableSymbol';
```

Replace line 95:

```ts
      const dictSym = symbolTable.get(name, symbolTypes.Dictionary) as any;
```

with:

```ts
      const dictSym = resolveIndexableSymbol(symbolTable, name, symbolTypes.Dictionary) as any;
```

- [ ] **Step 5: Branch the dict-read codegen on symbol kind**

Replace `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts` in full:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryLookup)
class DictionaryLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const key = doChild(node, 0, table);
    if (node.data.type === symbolTypes.Variable) {
      return `_sbCheckedDictGet(${formatSymbol(node.data)},${key},"${node.data.name}")`;
    }
    return `_sbDictGet(${formatSymbol(node.data)},${key})`;
  }
}

export default DictionaryLookupRule;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Run the full dictionary transpiler suite to check for regressions**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts`
Expected: PASS — all existing tests still pass (proves the fast path for strictly-typed `dim x[]` is untouched).

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/helpers/resolveIndexableSymbol.ts \
        src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryLookupRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
git commit -m "feat: allow indexing a plain dim variable holding a dictionary"
```

---

### Task 3: Dictionary write fallback (`state["key"] = value` on a plain `dim`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts:75-125`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`:

```ts
describe('Dictionary write fallback — plain dim variable holding a dict', () => {
  test('writing into a plain dim variable with [] compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  return d',
      'endfunction',
      'function test()',
      '  dim state',
      '  state = getstate()',
      '  state["level"] = 5',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedDictSet(test_state,"level",5,"state")');
  });

  test('a real dim x[] dictionary keeps using the unguarded fast path for writes', () => {
    const result = transpile('dim scores[]\nscores["Alice"] = 100');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set("Alice",100)');
    expect(result.code).not.toContain('_sbCheckedDictSet');
  });

  test('plain dim assignment (x = 5) is unaffected by the dict fallback gate', () => {
    const result = transpile('dim x\nx = 5');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.x = 5;');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: FAIL — the write test fails to compile (`Dictionary state has not been declared yet.`), the other two currently pass already (they're regression guards, included now so they run in the same file going forward).

- [ ] **Step 3: Token-gate the dict-write branch and use the fallback resolver**

In `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, add the import near the top (after the existing local imports, around line 19):

```ts
import resolveIndexableSymbol from './Expressions/helpers/resolveIndexableSymbol';
```

Replace lines 75-77:

```ts
    // Handle dictionary access/assignment: dict["key"].method() or dict["key"] = value
    if (symbolTable.check(name, symbolTypes.Dictionary)) {
      const dictSym = symbolTable.get(name, symbolTypes.Dictionary) as any;
```

with:

```ts
    // Handle dictionary access/assignment: dict["key"].method() or dict["key"] = value.
    // A Dictionary-kind symbol is always followed by '[' by construction (dim x[]
    // only ever parses that way) so no lookahead is needed for it. A plain
    // Variable-kind symbol only takes this branch when '[' is actually next,
    // so ordinary `x = 5` assignment is unaffected.
    const isDictLike =
      symbolTable.check(name, symbolTypes.Dictionary) ||
      (check(tokens.OpenBracket, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Variable));
    if (isDictLike) {
      const dictSym = resolveIndexableSymbol(symbolTable, name, symbolTypes.Dictionary) as any;
```

- [ ] **Step 4: Branch the dict-write codegen on symbol kind**

Replace `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts` in full:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryAssign)
class DictionaryAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const key = doChild(node, 0, table);
    const value = doChild(node, 1, table);
    if (node.data.type === symbolTypes.Variable) {
      return `_sbCheckedDictSet(${formatSymbol(node.data)},${key},${value},"${node.data.name}");`;
    }
    return `${formatSymbol(node.data)}.set(${key},${value});`;
  }
}

export default DictionaryAssignRule;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Run the full dictionary and object-property transpiler suites to check for regressions**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/dictionaries.test.ts tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts`
Expected: PASS — no regressions, including the typed-dictionary (`dim x[] as ClassName`) cases, which still resolve via the strict `Dictionary` branch first.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DictionaryAssignRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
git commit -m "feat: allow writing into a plain dim variable holding a dictionary"
```

---

### Task 4: Array read fallback (`k(i)` on a plain `dim`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts:150-179`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLookupRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`:

```ts
describe('Array read fallback — plain dim variable holding an array', () => {
  test('indexing a plain dim variable with () compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getitems()',
      '  dim a(1)',
      '  a(0) = "sword"',
      '  return a',
      'endfunction',
      'function test()',
      '  dim items',
      '  items = getitems()',
      '  print items(0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedArrayGet(test_items,0,"items")');
  });

  test('a real dim x(N) array keeps using the unguarded fast path', () => {
    const result = transpile('dim arr(2)\nprint arr(0)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
    expect(result.code).not.toContain('_sbCheckedArrayGet');
  });

  test('a real dim x(N,M) multi-dim array keeps using the unguarded fast path', () => {
    const result = transpile('dim grid(2,2)\nprint grid(0,1)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.grid[0][1]');
    expect(result.code).not.toContain('_sbCheckedArrayGet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: FAIL — the first test fails to compile (`Array items has not been declared yet.`).

- [ ] **Step 3: Use the fallback resolver in the array-paren read path**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`, replace line 158:

```ts
    const arraySym = symbolTable.get(name, symbolTypes.Array) as any;
```

with:

```ts
    const arraySym = resolveIndexableSymbol(symbolTable, name, symbolTypes.Array) as any;
```

- [ ] **Step 4: Branch the array-read codegen on symbol kind and dimension count**

Replace `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLookupRule.ts` in full:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayLookup)
class ArrayLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const index = doChild(node, 0, table);
    // node.children[0] is the ArrayList of index expressions — its own
    // .children length is the dimension count. The checked accessor only
    // makes sense for the single-dimension case: a Variable-kind symbol
    // only ever arises from `dim x; x = someFunc()`, which is always a
    // flat dict/array, never a declared multi-dim array (those are always
    // `dim x(N,M)`, which is strictly Array-kind and never reaches here).
    const isLooselyTyped = node.data.type === symbolTypes.Variable;
    const dimensionCount = node.children[0].children.length;
    if (isLooselyTyped && dimensionCount === 1) {
      return `_sbCheckedArrayGet(${formatSymbol(node.data)},${index},"${node.data.name}")`;
    }
    return `${formatSymbol(node.data)}[${index}]`;
  }
}

export default ArrayLookupRule;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Run the full array and typed-collections transpiler suites to check for regressions**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts tests/lib/Basic4WebGL/unit/transpiler/typed-collections.test.ts`
Expected: PASS — no regressions, including typed-array (`dim x(N) as ClassName`) element access.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayLookupRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
git commit -m "feat: allow indexing a plain dim variable holding an array"
```

---

### Task 5: Array write fallback (`items(i) = value` on a plain `dim`)

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts:173-204`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayAssignRule.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`:

```ts
describe('Array write fallback — plain dim variable holding an array', () => {
  test('writing into a plain dim variable with () compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getitems()',
      '  dim a(1)',
      '  return a',
      'endfunction',
      'function test()',
      '  dim items',
      '  items = getitems()',
      '  items(0) = "bow"',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedArraySet(test_items,0,"bow","items")');
  });

  test('a real dim x(N) array keeps using the unguarded fast path for writes', () => {
    const result = transpile('dim arr(2)\narr(0) = "sword"');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]="sword"');
    expect(result.code).not.toContain('_sbCheckedArraySet');
  });

  test('array pass-by-ref parameter assignment still compiles (Parameter-kind fallback preserved)', () => {
    const result = transpile([
      'function fillfirst(arr)',
      '  arr(0) = 99',
      'endfunction',
      'function test()',
      '  dim nums(2)',
      '  fillfirst(nums)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).not.toContain('_sbCheckedArraySet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: FAIL — the first test fails to compile (`Array items has not been declared yet.`). The third test should already pass today (it's a regression guard for existing behavior, added now so it lives alongside the new cases).

- [ ] **Step 3: Widen the array-write fallback gate and use the shared resolver**

In `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, replace lines 173-192:

```ts
    // Handle array indexing: arr(i) = v for both Array and Variable (pass-by-ref array param)
    const isArrayLike =
      symbolTable.check(name, symbolTypes.Array) ||
      (check(tokens.OpenParen, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Parameter));
    if (isArrayLike) {
      const dims = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      const arraySymbol = symbolTable.check(name, symbolTypes.Array)
        ? symbolTable.get(name, 'Array')
        : symbolTable.get(name, symbolTypes.Variable);
```

with:

```ts
    // Handle array indexing: arr(i) = v for Array-kind symbols, and for
    // Variable-kind symbols (covers both pass-by-ref array parameters and a
    // plain dim holding an array returned from a function call) when '(' is
    // actually next — `check(name, Variable)` already matches Parameter-kind
    // symbols too (see isMatchingType in transpilerRules/symbolRules.ts), so
    // this single check covers both cases.
    const isArrayLike =
      symbolTable.check(name, symbolTypes.Array) ||
      (check(tokens.OpenParen, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Variable));
    if (isArrayLike) {
      const dims = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      const arraySymbol = resolveIndexableSymbol(symbolTable, name, symbolTypes.Array, true);
```

Note the trailing `true` — this is the only call site that should resolve a `Parameter`-kind
symbol through the fallback (`resolveIndexableSymbol`'s `includeParameterFallback` flag,
added in Task 2 after code review found the default fallback was accidentally granting
dict/array *read* indexing to bare function parameters, which never worked before this
feature and was never a deliberate design decision — see `resolveIndexableSymbol.ts`'s
comment for the full rationale). This one write-side array call site is the exception:
`arr(i) = v` on a bare array parameter is pre-existing, intentional, already-tested
behavior (see the regression test in Step 1) that must keep resolving to a `Parameter`-kind
symbol and staying on the unguarded fast path in Step 4 below.

- [ ] **Step 4: Branch the array-write codegen on symbol kind and dimension count**

Replace `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayAssignRule.ts` in full:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { concatChildren, doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayAssign)
class ArrayAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    // node.children[0] is an ExpressionListNode — join each dimension index
    // with '][' so arr(0) → arr[0] and grid(2, 1) → grid[2][1]
    const dimStr = concatChildren(node.children[0], '][', table);
    const value = doChild(node, 1, table);
    const isLooselyTyped = node.data.type === symbolTypes.Variable;
    const dimensionCount = node.children[0].children.length;
    if (isLooselyTyped && dimensionCount === 1) {
      return `_sbCheckedArraySet(${formatSymbol(node.data)},${dimStr},${value},"${node.data.name}");`;
    }
    return `${formatSymbol(node.data)}[${dimStr}]=${value};`;
  }
}

export default ArrayAssignRule;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 6: Run the full transpiler unit suite to check for regressions**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler`
Expected: PASS — every existing transpiler test still passes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts \
        src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ArrayAssignRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
git commit -m "feat: allow writing into a plain dim variable holding an array"
```

---

### Task 6: Fix the two broken doc examples

**Files:**
- Modify: `src/docs/api-reference/save.md:79-91`
- Verify: `src/docs/language-guide/dictionaries.md:94-111`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`

- [ ] **Step 1: Write the failing test (doc examples must compile as written)**

Add to `tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`:

```ts
describe('Doc examples that depend on this fix', () => {
  test('dictionaries.md "Iterating over a dictionary" example compiles', () => {
    const dictLib = {
      name: 'dict',
      source: readFileSync('src/lib/Basic4WebGL/defs/dict.bas', 'utf-8'),
    };
    const arrayLib = {
      name: 'array',
      source: readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8'),
    };
    const result = compiler.transpile({
      lib: [dictLib, arrayLib],
      files: [{
        name: 'Main.bas',
        source: [
          'dim scores[]',
          'scores["Alice"] = 100',
          'scores["Bob"] = 80',
          '',
          'dim k',
          'k = dict.keys(scores)',
          '',
          'dim i',
          'for i = 0 to array.length(k) - 1',
          '  print k(i)',
          '  print scores[k(i)]',
          'next i',
        ].join('\n'),
      }],
    });
    expect(result.diagnostics).toHaveLength(0);
  });

  test('save.md "getAll()" example compiles with direct indexing', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  d["level"] = 3',
      '  return d',
      'endfunction',
      'function onenter()',
      '  dim state',
      '  state = getstate()',
      '  print state["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

Add the missing import at the top of the test file if not already present from an earlier task:

```ts
import { readFileSync } from 'node:fs';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: Both new tests already PASS at this point — Tasks 2-5 already fixed the underlying compiler behavior these tests exercise. This step confirms that rather than assuming it: run it and read the output before moving on.

- [ ] **Step 3: Revert `save.md`'s `getAll()` example to direct indexing**

In `src/docs/api-reference/save.md`, replace lines 85-91:

```bas
dim state
state = save.getAll()
print "Saved items: " + string.str(array.length(state))
```

```
> **Note:** If you need to read a specific value back, use `get` with its key — that's the reliable way to read one field. `getAll()` is best for bulk checks, like counting how many things have been saved or confirming there's any save data at all.
```

with:

```bas
dim state
state = save.getAll()
print state["level"]
```

```
> **Note:** If you only need one value back, `get` is simpler than loading everything with `getAll()` and indexing into it.
```

- [ ] **Step 4: Verify `dictionaries.md`'s example needs no content change**

Read `src/docs/language-guide/dictionaries.md:94-111` and confirm the `dict.keys` iteration example matches the source used in Step 1's test verbatim. It should — no edit needed, this step is a confirmation, not a change. If it doesn't match, update the test in Step 1 to match the doc exactly (the doc is the source of truth, not the test).

- [ ] **Step 5: Run the full test file once more**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 6: Commit**

```bash
git add src/docs/api-reference/save.md tests/lib/Basic4WebGL/unit/transpiler/indexableVariableFallback.test.ts
git commit -m "docs: revert save.md getAll() example to direct dictionary indexing"
```

---

### Task 7: Update the Cypress e2e test that documents this exact bug

`cypress/e2e/save-load.cy.ts` (added in commit `9c1a54a`, before this fix existed) contains a `describe('save/load: setAll/getAll round-trips...')` block whose comment (lines 89-96) explicitly explains why it avoids direct indexing into `save.getAll()`'s result. That workaround and its explanation are now stale and should demonstrate the real fix instead — this is also the only place in the repo that will actually execute the new runtime-checked accessors in a real browser (WebGL/PIXI runtime), not just verify transpiled JS text.

**Files:**
- Modify: `cypress/e2e/save-load.cy.ts:77-112`

- [ ] **Step 1: Rewrite the test source to use direct indexing**

Replace lines 77-112 of `cypress/e2e/save-load.cy.ts`:

```ts
describe('save/load: setAll/getAll round-trips a nested dict+array, and setAll replaces', () => {
  const SOURCE = `
function onenter()
  save.set("leftover", "should be gone after setAll")

  dim state[]
  state["level"] = 3
  dim items(1)
  items(0) = "sword"
  state["items"] = items
  save.setAll(state)

  dim loaded
  loaded = save.getAll()

  dim loadeditems
  loadeditems = loaded["items"]

  print "level: " + string.str(loaded["level"])
  print "first item: " + loadeditems(0)
  print "leftover exists: " + string.str(save.exists("leftover"))
endfunction
`.trim();

  it('round-trips a dict containing an array, and setAll wipes prior individually-set keys', () => {
    visitAndRun('save02', 'Save Test 2', SOURCE);
    cy.get('span').contains('level: 3').should('exist');
    cy.get('span').contains('first item: sword').should('exist');
    cy.get('span').contains('leftover exists: false').should('exist');
  });
});
```

- [ ] **Step 2: Run the build to make sure the new source at least transpiles cleanly**

Run: `npx vite build`
Expected: build succeeds (this doesn't execute the Cypress spec, just confirms nothing else broke).

- [ ] **Step 3: Ask the user to run Cypress manually**

This suite requires a running dev server and is not run automatically (per `CLAUDE.md`). Tell the user:

> Run `npm run dev` in one terminal, then `npm run cypress:run` in another, and confirm `save-load.cy.ts` passes — this is the only test that actually executes the new runtime-checked accessors (`_sbCheckedDictGet`/`_sbCheckedArrayGet`) in a real browser.

Do not mark this step complete until the user confirms the result (pass or fail). If it fails, treat it as a real bug and debug before proceeding — don't edit the test to hide a failure.

- [ ] **Step 4: Commit**

```bash
git add cypress/e2e/save-load.cy.ts
git commit -m "test: exercise direct dictionary/array indexing in save/load e2e coverage"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: PASS — every test in the repo, not just the new/touched files.

- [ ] **Step 2: Run the build**

Run: `npx vite build`
Expected: build succeeds with no errors (per `CLAUDE.md`, this is the project's verification command — do not use `tsc --noEmit`).

- [ ] **Step 3: Review the full diff for this feature**

Run: `git log --oneline main..HEAD` and `git diff main...HEAD --stat`
Expected: 7 commits (Tasks 1-7; Task 8 has no commit of its own), touching exactly the files listed in the spec's File Map plus `cypress/e2e/save-load.cy.ts`.

- [ ] **Step 4: Report completion to the user**

Summarize: what changed, that all tests pass, that the build succeeds, and remind them Cypress (`save-load.cy.ts`) still needs a manual run if they didn't already do it in Task 7 Step 3.
