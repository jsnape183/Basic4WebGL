# Array Compiler Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two compiler bugs (invalid `let` for module-scope arrays; arrays rejected in expression context) and align `symbolRules` naming with `formatSymbol`.

**Architecture:** Three targeted changes to existing rules. `DimRule` mirrors the scope-awareness already in `VariableDimRule`. `VariableFactorRule` gains an Array fallback before throwing. `formatSymbol` gains a global-scope case so `symbolRules` can delegate to it. `_createArray` is modernised to `Array.from` in the same pass.

**Tech Stack:** TypeScript, Vitest, softBASIC compiler (lexer → parser → transpiler pipeline)

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DimRule.ts` |
| Modify | `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` |
| Modify | `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts` |
| Modify | `src/lib/Basic4WebGL/transpilerRules/symbolRules.ts` |
| Modify | `src/components/Runner/bootstrapper.html` |
| Modify | `tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts` |
| Modify | `tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts` |
| Create | `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts` |

---

### Task 1: Fix DimRule — scope-aware array declaration

`DimRule` currently emits `let main.arr = _createArray([10])` for module scope — invalid JS. The fix mirrors `VariableDimRule` which already handles scope correctly.

**Files:**
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DimRule.ts`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts`

- [ ] **Step 1: Update the existing Dim rule test to assert the fixed output**

Open `tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts`. Find the existing `describe('Dim rule')` block and update it, then add three new tests:

```ts
import { ArraySymbol } from '@Basic4WebGL/symbolTypes';

const arrSym = (name: string, scopeName = 'main', scopeType = 'Module') =>
  new ArraySymbol(name, 'Array', new SymbolScope(scopeName, scopeType), scopeName, 1);

const fnArrSym = (name: string, fnName: string) =>
  new ArraySymbol(name, 'Array', new SymbolScope(fnName, 'Function'), `main.${fnName}`, 1);

const classArrSym = (name: string, className: string) =>
  new ArraySymbol(name, 'Array', new SymbolScope(className, 'Class'), className, 1);

describe('Dim rule', () => {
  test('module-scope array emits without let', () => {
    const d = node(nodeTypes.Dim, arrSym('arr'), [emptyList(nodeTypes.VariableList)]);
    expect(new DimRule().generate(d, undefined)).toBe('main.arr = _createArray([]);');
  });

  test('function-scope array retains let', () => {
    const d = node(nodeTypes.Dim, fnArrSym('arr', 'onenter'), [emptyList(nodeTypes.VariableList)]);
    expect(new DimRule().generate(d, undefined)).toBe('let onenter_arr = _createArray([]);');
  });

  test('class-scope array emits prototype form without let', () => {
    const d = node(nodeTypes.Dim, classArrSym('arr', 'Enemy'), [emptyList(nodeTypes.VariableList)]);
    expect(new DimRule().generate(d, undefined)).toBe('Enemy.prototype.arr = _createArray([]);');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
```

Expected: FAIL — current output includes `let main.arr = ...` not `main.arr = ...`

- [ ] **Step 3: Fix DimRule**

Replace the full content of `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DimRule.ts`:

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

@RegisterTranspilerRule(nodeTypes.Dim)
class DimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const sizes = doChild(node, 0, table);
    const rhs = `_createArray([${sizes}])`;

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

export default DimRule;
```

- [ ] **Step 4: Run the tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/DimRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/symbols.test.ts
git commit -m "fix: DimRule emits scope-aware array declaration — no let for module/class scope"
```

---

### Task 2: Fix VariableFactorRule — arrays in expression context

Bare array references (e.g. `array.push(bullets, x)`) throw `SymbolError: Variable bullets has not been declared yet` because `VariableFactorRule` only looks up `Variable` type. Fix: try `Array` as fallback when no `(` follows.

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`
- Create: `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`

- [ ] **Step 1: Write a failing integration test**

Create `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const transpile = (source: string) => {
  const result = compiler.transpile({
    lib: [],
    files: [{ name: 'Main.bas', source }],
  });
  return result;
};

describe('Array — module-level declaration', () => {
  test('dim arr(10) at module level produces valid JS without let', () => {
    const result = transpile('dim arr(10)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr = _createArray([10])');
    expect(result.code).not.toContain('let main.arr');
  });
});

describe('Array — bare reference in expression context', () => {
  test('array variable compiles as argument to a function', () => {
    const result = transpile([
      'dim arr(5)',
      'function test()',
      '  dim x',
      '  x = array.arrLength(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr');
  });
});

describe('Array — pass by reference', () => {
  test('mutation inside function is visible to caller', () => {
    // Compiles without error — runtime behaviour verified manually
    const result = transpile([
      'dim enemies(5)',
      'enemies(0) = 10',
      'function resetFirst(arr)',
      '  arr(0) = 0',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify the bare-reference test fails**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: FAIL — `SymbolError: Variable arr has not been declared yet`

- [ ] **Step 3: Fix VariableFactorRule**

Open `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`. Replace lines 90–96 (the `!check(tokens.OpenParen` block):

```ts
if (!check(tokens.OpenParen, tokenStream.current())) {
  // Prefer Variable lookup; fall back to Array for bare array references
  let varSymbol: Symbol;
  if (symbolTable.check(name, symbolTypes.Array)) {
    varSymbol = symbolTable.get(name, symbolTypes.Array);
  } else {
    varSymbol = symbolTable.get(name);
  }
  if (isInstancePropertyAccess(varSymbol, symbolTable)) {
    return new PropertyTermNode(`this.${name}`, loc, varSymbol.dataType);
  }
  return new TermNode(varSymbol, new VariableNode(name), loc);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite to confirm no regressions**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts \
        tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
git commit -m "fix: VariableFactorRule falls back to Array symbol for bare array references"
```

---

### Task 3: Fix formatSymbol + symbolRules consistency

`symbolRules` formats global-scope variable names with its own string concatenation. `formatSymbol` has no global-scope case (would emit `.counter` which is invalid). Unify: add global scope to `formatSymbol`, have `symbolRules` delegate to it.

**Files:**
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/symbolRules.ts`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts`

- [ ] **Step 1: Add a consistency test to symbolRules.test.ts**

Open `tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts`. Add the import at the top of the file alongside the existing imports, then add the describe block after the existing tests:

```ts
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
```

```ts
describe('symbolRules — formatSymbol consistency', () => {
  test('pre-declared global variable name matches formatSymbol output', () => {
    const { table, scope } = tableWith('counter');
    const sym = table.getAll('Variable', scope)[0];
    // symbolRules should produce the same identifier as formatSymbol
    const fromSymbolRules = symbolRules(table, scope);
    const fromFormatSymbol = formatSymbol(sym);
    expect(fromSymbolRules).toContain(`let ${fromFormatSymbol} = null`);
  });
});
```

- [ ] **Step 2: Run to verify the test fails**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts
```

Expected: FAIL — `formatSymbol` currently returns `.counter` for global scope, `symbolRules` returns `_counter`

- [ ] **Step 3: Add global-scope case to formatSymbol**

Open `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`. Add a new first branch inside `formatSymbol`, before the existing `symbolTypes.Function` check:

```ts
export const formatSymbol = (data: Symbol) => {
  // Global scope (empty scope name) — pre-declared as _varName
  if (data.scope.type === scopeTypes.Globals || data.scope.name === '') {
    return `_${data.name}`;
  }

  if (data.type === symbolTypes.Function) {
    return `${data.fullScope}.${data.name}`;
  }
  // ... rest unchanged
```

Note: `scopeTypes.Globals` is `''` (empty string) as defined in `symbolTypes.ts`.

- [ ] **Step 4: Update symbolRules to delegate to formatSymbol**

Open `src/lib/Basic4WebGL/transpilerRules/symbolRules.ts`. Add the `formatSymbol` import and update the map:

```ts
import Symbols, { SymbolScope } from "../../symbols";
import { symbolTypes } from "../symbolTypes";
import { formatSymbol } from "./jsRules/helpers/transpilerHelpers";

export const isMatchingType = (expected: string, actual: string): boolean =>
  expected === actual || (expected === "Variable" && actual === "Parameter");

export const symbolRules = (table: Symbols, scope: SymbolScope): string => {
  if (scope.name !== "") {
    return "";
  }

  const declarations = table
    .getAll("Variable", scope)
    .filter((s) => s.type !== symbolTypes.Parameter)
    .map((s) => `let ${formatSymbol(s)} = null`)
    .join(";\n");

  return declarations ? `${declarations};\n` : "";
};

export default symbolRules;
```

- [ ] **Step 5: Run the tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts
```

Expected: PASS — `formatSymbol` now returns `_counter` for global scope, matching `symbolRules` output

- [ ] **Step 6: Run full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts \
        src/lib/Basic4WebGL/transpilerRules/symbolRules.ts \
        tests/lib/Basic4WebGL/unit/transpiler/symbolRules.test.ts
git commit -m "refactor: formatSymbol handles global scope; symbolRules delegates to it"
```

---

### Task 4: Modernise _createArray to Array.from

Replace the ES5 `Array.apply(null, new Array(n)).map(fn)` pattern in `bootstrapper.html` with `Array.from({length: n}, fn)`.

**Files:**
- Modify: `src/components/Runner/bootstrapper.html`

- [ ] **Step 1: Replace _createArrayDim and _createArray in bootstrapper.html**

Open `src/components/Runner/bootstrapper.html`. Replace lines 7–17:

```js
const _createArrayDim = (sizes, depth) => {
  if (depth === sizes.length - 1)
    return Array.from({length: sizes[depth]}, () => false);
  return Array.from({length: sizes[depth]}, () =>
    _createArrayDim(sizes, depth + 1)
  );
};
const _createArray = (sizes) => {
  return _createArrayDim(sizes, 0);
};
```

- [ ] **Step 2: Run the full suite**

```
npx vitest run
```

Expected: All tests pass (bootstrapper changes are not covered by unit tests — manual verification in the Runner is sufficient)

- [ ] **Step 3: Commit**

```bash
git add src/components/Runner/bootstrapper.html
git commit -m "refactor: modernise _createArray to use Array.from"
```

---

### Task 5: Add module-level array behaviour tests

Extend the integration test file to cover the full behaviour contract documented in the spec.

**Files:**
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts`

- [ ] **Step 1: Add remaining behaviour tests**

Open `tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts` and add:

```ts
describe('Array — index read and write', () => {
  test('arr(0) = x at module level emits main.arr[0] = ...', () => {
    const result = transpile('dim arr(5)\narr(0) = 42');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });

  test('print arr(0) at module level emits main.arr[0]', () => {
    const result = transpile('dim arr(5)\nprint arr(0)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });
});

describe('Array — arrLength and join compile with module-level array', () => {
  test('array.arrLength(arr) compiles without error', () => {
    const result = transpile([
      'dim arr(5)',
      'function test()',
      '  print array.arrLength(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.join(arr, ",") compiles without error', () => {
    const result = transpile([
      'dim arr(3)',
      'function test()',
      '  print array.join(arr, ",")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
```

Expected: PASS

- [ ] **Step 3: Run full suite**

```
npx vitest run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/lib/Basic4WebGL/unit/transpiler/arrays.test.ts
git commit -m "test: array module-level declaration, index access, and argument passing"
```
