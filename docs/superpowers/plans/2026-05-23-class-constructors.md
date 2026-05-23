# Class Constructors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Constructor`/`EndConstructor` syntax to softBASIC classes, fix the latent `this`-binding and instance-scoping bugs in class method bodies as a prerequisite, and extend `dim x as Type(args)` to pass constructor arguments.

**Architecture:** Four phases: (1) fix arrow→function for class methods, (2) fix class-property references inside instance bodies to use `this.prop`, (3) add the `Constructor` parser rule and transpiler rule, (4) extend `DimRule`/`CloneRule` for constructor arguments. Each phase produces working, tested code independently.

**Tech Stack:** TypeScript, Vitest. All compiler code lives in `src/lib/Basic4WebGL/`. Tests live in `tests/lib/Basic4WebGL/integration/transpiler/` and `tests/lib/Basic4WebGL/unit/`.

---

## Codebase Orientation

Before starting, read the spec at `docs/superpowers/specs/2026-05-23-class-constructors-design.md`.

Key files and their roles:

| File | Role |
|------|------|
| `src/lib/Basic4WebGL/tokens.ts` | Token enum (add `Constructor`, `EndConstructor`) |
| `src/lib/Basic4WebGL/TokenResolver.ts` | Lexer rules that match source text to tokens |
| `src/lib/Basic4WebGL/nodeTypes.ts` | AST node type enum (add `ConstructorDecl`) |
| `src/lib/Basic4WebGL/symbolTypes.ts` | `scopeTypes` / `symbolTypes` enums and symbol classes |
| `src/lib/Basic4WebGL/parserRules/rules/FunctionRule.ts` | Pattern for `ConstructorRule` — mirrors this closely |
| `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` | Extend to handle `dim x as Type(args)` |
| `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` | Fix instance-scope assignments |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | Fix instance-scope reads |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts` | `formatFunctionDecl`, `formatRoot`, `formatClass` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts` | Modify to pass constructor content to `formatRoot` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts` | Extend to emit constructor args |
| `src/lib/Basic4WebGL/nodes/CloneNode.ts` | Extend to carry optional args child |

Run all tests with: `npx vitest run`
Run a single file: `npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts`

---

## File Structure

**New files to create:**
- `src/lib/Basic4WebGL/nodes/ConstructorDeclNode.ts`
- `src/lib/Basic4WebGL/parserRules/rules/ConstructorRule.ts`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts`
- `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts`
- `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts`
- `tests/sampleFiles/instanceMethods/Player.bas`
- `tests/sampleFiles/instanceMethods/Main.bas`
- `tests/sampleFiles/constructor/Point.bas`
- `tests/sampleFiles/constructor/Main.bas`

**Files to modify:**
- `src/lib/Basic4WebGL/tokens.ts` — add two tokens
- `src/lib/Basic4WebGL/TokenResolver.ts` — add two lexer rules
- `src/lib/Basic4WebGL/nodeTypes.ts` — add one node type
- `src/lib/Basic4WebGL/symbolTypes.ts` — add `Constructor` scope type
- `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts` — fix `formatFunctionDecl`, update `formatRoot`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts` — pass constructor content to `formatRoot`
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimRule.ts` — handle `Constructor` scope
- `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` — use `PropertyAssignNode` for class-property writes in instance context
- `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` — use `PropertyTermNode` for class-property reads in instance context
- `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts` — parse optional constructor args
- `src/lib/Basic4WebGL/nodes/CloneNode.ts` — accept optional children
- `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts` — emit args when present

---

## Task 1: Fix class method emission (arrow → regular function)

**Files:**
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts`

Currently `formatFunctionDecl` emits arrow functions for ALL functions including class methods. Arrow functions don't bind `this`, which breaks any class method that accesses instance properties. Fix: use `function(...)` for class-scoped methods only.

- [ ] **Step 1: Create sample files for instance method tests**

Create `tests/sampleFiles/instanceMethods/Player.bas`:
```basic
Class
dim health

function takeDamage(amount)
    health = health - amount
endfunction

function getHealth()
    return health
endfunction
```

Create `tests/sampleFiles/instanceMethods/Main.bas`:
```basic
function onenter()
    dim player as Player
endfunction
```

- [ ] **Step 2: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts`:
```typescript
import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'instanceMethods';
const playerFile = { name: 'Player', source: loadSampleFile('Player', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

function compileOk(project: CompilerProject): string {
  const result = compiler.transpile(project);
  const errorMessages = result.diagnostics.map((d) => d.message).join('; ');
  expect(errorMessages, `compile errors: ${errorMessages}`).toBe('');
  expect(result.code).toBeDefined();
  return cleanWhitespace(result.code!);
}

describe('class instance methods use function() not arrow function', () => {
  test('class method is emitted as function expression, not arrow function', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    expect(result).toContain('player.prototype.takedamage=function(');
    expect(result).not.toContain('player.prototype.takedamage=(');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: FAIL — test finds `takedamage=(` not `takedamage=function(`

- [ ] **Step 4: Fix `formatFunctionDecl` in `transpilerHelpers.ts`**

Find this block (around line 67):
```typescript
export const formatFunctionDecl = (
  node: Tree,
  params: string,
  body: string
) => {
  if (node.data.scope.type === scopeTypes.Class) {
    return `${node.data.fullScope}.prototype.${node.data.name} = (${params}) => {${body}};`;
  }

  return `${node.data.fullScope}.${node.data.name} = (${params}) => {${body}};`;
};
```

Replace with:
```typescript
export const formatFunctionDecl = (
  node: Tree,
  params: string,
  body: string
) => {
  if (node.data.scope.type === scopeTypes.Class) {
    return `${node.data.fullScope}.prototype.${node.data.name} = function(${params}) {${body}};`;
  }

  return `${node.data.fullScope}.${node.data.name} = (${params}) => {${body}};`;
};
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: PASS

- [ ] **Step 6: Run full suite to confirm no regressions**

```
npx vitest run
```

Expected: all tests pass (module-level functions still use arrow functions; only class methods changed)

- [ ] **Step 7: Commit**

```
git add tests/sampleFiles/instanceMethods/Player.bas tests/sampleFiles/instanceMethods/Main.bas tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts
git commit -m "fix: emit class instance methods as function() not arrow function"
```

---

## Task 2: Add `Constructor` scope type and fix `VariableDimRule`

**Files:**
- Modify: `src/lib/Basic4WebGL/symbolTypes.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimRule.ts`

`Constructor` needs its own scope type so the rest of the compiler can distinguish "inside a constructor body" from "inside a regular function". `VariableDimRule` also needs updating so that `dim localVar` inside a constructor body emits `constructor_localVar = undefined` (same underscore pattern as function-local variables).

- [ ] **Step 1: Add `Constructor` to `scopeTypes` in `symbolTypes.ts`**

Find:
```typescript
export const scopeTypes = {
  Globals: '',
  Function: 'Function',
  Module: 'Module',
  Class: 'Class',
};
```

Replace with:
```typescript
export const scopeTypes = {
  Globals: '',
  Function: 'Function',
  Module: 'Module',
  Class: 'Class',
  Constructor: 'Constructor',
};
```

- [ ] **Step 2: Update `VariableDimRule` to handle Constructor scope**

Open `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimRule.ts`.

Find:
```typescript
if (node.data.scope.type === scopeTypes.Function) {
  return `${node.data.scope.name}_${node.data.name} = undefined;`;
}
```

Replace with:
```typescript
if (
  node.data.scope.type === scopeTypes.Function ||
  node.data.scope.type === scopeTypes.Constructor
) {
  return `${node.data.scope.name}_${node.data.name} = undefined;`;
}
```

- [ ] **Step 3: Run full suite — no new tests needed for this task, but confirm nothing broke**

```
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 4: Commit**

```
git add src/lib/Basic4WebGL/symbolTypes.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimRule.ts
git commit -m "feat: add Constructor scope type; fix VariableDimRule for constructor locals"
```

---

## Task 3: Fix variable assignments in instance context

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts` (extend)

Inside a class method or constructor body, assignments to class-level properties must emit `this.prop = value` instead of `car.prop = value`. Currently `VariableRule` creates an `AssignNode` whose `AssignRule` transpiler calls `formatSymbol(node.data)`, which emits the static form. Fix: detect instance context at parse time and use `PropertyAssignNode` with `chain = "this.propName"` instead.

The instance context check: we're in instance context when the symbol's scope type is `Class` AND the current execution scope (`symbolTable.getScopeType()`) is `Function` or `Constructor` AND the current full scope path starts with the class name (i.e., `symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.')`).

- [ ] **Step 1: Add instance method write test to `instanceMethods.test.ts`**

Add to the existing `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts`:
```typescript
describe('class method body — instance property write', () => {
  test('assignment to class-level property emits this.prop', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    // takeDamage: health = health - amount  →  this.health = this.health - takedamage_amount
    expect(result).toContain('this.health=this.health-takedamage_amount');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: FAIL — health is emitted as `player.health` not `this.health`

- [ ] **Step 3: Update `VariableRule.ts`**

Open `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`.

Add these imports at the top (alongside existing imports):
```typescript
import { scopeTypes } from '../../symbolTypes';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import { Symbol } from '@CompilerLib/symbols';
```

Add this helper function just before the class definition:
```typescript
function isInstancePropertyAccess(symbol: Symbol, symbolTable: Symbols): boolean {
  if (symbol.scope.type !== scopeTypes.Class) return false;
  const execScopeType = symbolTable.getScopeType();
  if (execScopeType !== scopeTypes.Function && execScopeType !== scopeTypes.Constructor) return false;
  return symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.');
}
```

Find the Object-typed variable assignment (the block that checks `symbolTypes.Object` and has no dot):
```typescript
    // No dot → plain assignment to an object-typed variable (e.g. result = myCar.carKey)
    const objSymbol = symbolTable.get(name, symbolTypes.Object);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new AssignNode(objSymbol, expr, loc);
```

Replace with:
```typescript
    // No dot → plain assignment to an object-typed variable
    const objSymbol = symbolTable.get(name, symbolTypes.Object);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    if (isInstancePropertyAccess(objSymbol, symbolTable)) {
      return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
    }
    return new AssignNode(objSymbol, expr, loc);
```

Find the plain Variable assignment at the bottom of the parse method:
```typescript
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new AssignNode(varSymbol, expr, loc);
```

Replace with:
```typescript
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    if (isInstancePropertyAccess(varSymbol, symbolTable)) {
      return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
    }
    return new AssignNode(varSymbol, expr, loc);
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
git commit -m "fix: class-level property writes inside instance bodies emit this.prop"
```

---

## Task 4: Fix variable reads in instance context

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts` (extend)

The write side is fixed. Now fix reads: `health - amount` inside `takeDamage` must emit `this.health - takedamage_amount`. Currently `TermNode` reads call `formatSymbol` which emits the static form. Fix: at parse time, return `PropertyTermNode('this.propName', loc)` when reading a class-level property from within an instance context.

The same `isInstancePropertyAccess` logic applies — copy it into this file (it's only two files that need it so we keep it local rather than sharing).

- [ ] **Step 1: Add instance read test to `instanceMethods.test.ts`**

The read side of `health = health - amount` is already covered by the write test added in Task 3 (the RHS `health - amount` includes a read of `health`). Verify the full expression:
```typescript
describe('class method body — instance property read', () => {
  test('reading class-level property in expression emits this.prop', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    // getHealth: return health  →  return this.health
    expect(result).toContain('returnthis.health');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: FAIL — `health` in return emits as `player.health` not `this.health`

- [ ] **Step 3: Update `VariableFactorRule.ts`**

Open `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`.

Add these imports (alongside existing ones):
```typescript
import { scopeTypes } from '../../../symbolTypes';
import { Symbol } from '@CompilerLib/symbols';
```

Add the instance context helper before the class definition:
```typescript
function isInstancePropertyAccess(symbol: Symbol, symbolTable: Symbols): boolean {
  if (symbol.scope.type !== scopeTypes.Class) return false;
  const execScopeType = symbolTable.getScopeType();
  if (execScopeType !== scopeTypes.Function && execScopeType !== scopeTypes.Constructor) return false;
  return symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.');
}
```

In the Object branch, find where it returns a bare `TermNode` for an object reference with no dot:
```typescript
      if (!check(tokens.Dot, tokenStream.current())) {
        return new TermNode(ownerSymbol, new VariableNode(name), loc);
      }
```

Replace with:
```typescript
      if (!check(tokens.Dot, tokenStream.current())) {
        if (isInstancePropertyAccess(ownerSymbol, symbolTable)) {
          return new PropertyTermNode(`this.${name}`, loc);
        }
        return new TermNode(ownerSymbol, new VariableNode(name), loc);
      }
```

Find the final `TermNode` return for plain variables (near the bottom, after all the checks):
```typescript
    if (!check(tokens.OpenParen, tokenStream.current())) {
      return new TermNode(symbolTable.get(name), new VariableNode(name), loc);
    }
```

Replace with:
```typescript
    if (!check(tokens.OpenParen, tokenStream.current())) {
      const sym = symbolTable.get(name);
      if (isInstancePropertyAccess(sym, symbolTable)) {
        return new PropertyTermNode(`this.${name}`, loc);
      }
      return new TermNode(sym, new VariableNode(name), loc);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts tests/lib/Basic4WebGL/integration/transpiler/instanceMethods.test.ts
git commit -m "fix: class-level property reads inside instance bodies emit this.prop"
```

---

## Task 5: Add `Constructor` and `EndConstructor` tokens

**Files:**
- Modify: `src/lib/Basic4WebGL/tokens.ts`
- Modify: `src/lib/Basic4WebGL/TokenResolver.ts`

Tokens are two things: an entry in the enum (`tokens.ts`) and a lexer rule that matches source text (`TokenResolver.ts`). The pattern for both is identical to `Function`/`EndFunction`.

**Important:** `EndConstructor` must be added to `TokenResolver.ts` BEFORE `Constructor` — just as `EndFunction` appears before `Function` — because the lexer tries rules in order and the longer string must match first.

- [ ] **Step 1: Add tokens to `tokens.ts`**

Find:
```typescript
  'Function',
  'Return',
  'EndFunction',
```

Replace with:
```typescript
  'Function',
  'Return',
  'EndFunction',
  'Constructor',
  'EndConstructor',
```

- [ ] **Step 2: Add lexer rules to `TokenResolver.ts`**

Find the `EndFunction` rule:
```typescript
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endfunction(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndFunction,
    }),
  },
```

Add immediately after it:
```typescript
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endconstructor(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndConstructor,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^constructor(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Constructor,
    }),
  },
```

- [ ] **Step 3: Run full suite to confirm no regressions**

```
npx vitest run
```

Expected: all tests pass (no new behaviour yet, just new tokens defined)

- [ ] **Step 4: Commit**

```
git add src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/TokenResolver.ts
git commit -m "feat: add Constructor and EndConstructor tokens"
```

---

## Task 6: Add `ConstructorDecl` node type and `ConstructorDeclNode`

**Files:**
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Create: `src/lib/Basic4WebGL/nodes/ConstructorDeclNode.ts`

- [ ] **Step 1: Add `ConstructorDecl` to `nodeTypes.ts`**

Find:
```typescript
  'PropertyAssign',
  'PropertyTerm',
```

Replace with:
```typescript
  'PropertyAssign',
  'PropertyTerm',
  'ConstructorDecl',
```

- [ ] **Step 2: Create `ConstructorDeclNode.ts`**

Create `src/lib/Basic4WebGL/nodes/ConstructorDeclNode.ts`:
```typescript
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ConstructorDeclNode extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ConstructorDecl, data, children);
    this.loc = loc;
  }
}

export default ConstructorDeclNode;
```

- [ ] **Step 3: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```
git add src/lib/Basic4WebGL/nodeTypes.ts src/lib/Basic4WebGL/nodes/ConstructorDeclNode.ts
git commit -m "feat: add ConstructorDecl node type and ConstructorDeclNode"
```

---

## Task 7: Implement `ConstructorRule` parser

**Files:**
- Create: `src/lib/Basic4WebGL/parserRules/rules/ConstructorRule.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts`

The parser rule mirrors `FunctionRule` closely. Key differences:
- Uses `Constructor`/`EndConstructor` tokens
- Opens a `Constructor` scope (not `Function`)
- Validates it is declared inside a `Class` scope
- Returns a `ConstructorDeclNode` (not `FunctionDeclNode`)
- The rule is auto-registered as `'Constructor'` — `BlockRule` dispatches by token name, so when the lexer produces a `Constructor` token, the block parser calls `getParserRule('Constructor')`

- [ ] **Step 1: Write the failing constructor parse test**

Create `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts`:
```typescript
import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'constructor';

function compileOk(project: CompilerProject): string {
  const result = compiler.transpile(project);
  const errorMessages = result.diagnostics.map((d) => d.message).join('; ');
  expect(errorMessages, `compile errors: ${errorMessages}`).toBe('');
  expect(result.code).toBeDefined();
  return cleanWhitespace(result.code!);
}

function compileErr(project: CompilerProject): string {
  const result = compiler.transpile(project);
  return result.diagnostics.map((d) => d.message).join('; ');
}

describe('Constructor parsing', () => {
  test('class with Constructor/EndConstructor compiles without errors', () => {
    const src = [
      'Class',
      'dim x',
      'Constructor(startX)',
      '    x = startX',
      'EndConstructor',
    ].join('\n');
    compileOk({ lib: [], files: [{ name: 'Point', source: src }] });
  });

  test('Constructor outside a class produces a compile error', () => {
    const src = [
      'Constructor(x)',
      '    x = 1',
      'EndConstructor',
    ].join('\n');
    const err = compileErr({ lib: [], files: [{ name: 'Main', source: src }] });
    expect(err).toMatch(/constructor must be declared inside a class/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: FAIL — `Constructor` token not yet routed to any parser rule

- [ ] **Step 3: Create `ConstructorRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/ConstructorRule.ts`:
```typescript
import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import ConstructorDeclNode from '../../nodes/ConstructorDeclNode';
import BlockNode from '../../nodes/BlockNode';
import { newLines } from '../../parserConfig';
import { CompilationError } from '@CompilerLib/errors';

@RegisterParserRule('Constructor')
class ConstructorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    if (symbolTable.getScopeType() !== scopeTypes.Class) {
      throw new CompilationError(
        'Constructor must be declared inside a class'
      );
    }

    matchAndMove(tokens.Constructor, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);

    symbolTable.setScope('constructor', scopeTypes.Constructor);
    let variables: Tree;
    let parameters: ReturnType<typeof symbolTable.getAll>;
    let children: Tree;
    try {
      variables = getParserRule('VariableList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      parameters = symbolTable.getAll(
        symbolTypes.Parameter,
        symbolTable.getScope()
      );
      matchAndMove(tokens.CloseParen, tokenStream);
      matchAndMove(newLines, tokenStream);
      children = getParserRule('Block').parse(tokenStream, symbolTable, {
        endTokens: tokens.EndConstructor,
      });
      matchAndMove(tokens.EndConstructor, tokenStream);
    } finally {
      symbolTable.clearScope();
    }
    matchAndMove(newLines, tokenStream);

    // Duplicate constructor guard: the symbol table should not yet have a
    // 'constructor' Function symbol in this class scope.
    if (symbolTable.check('constructor', symbolTypes.Function)) {
      throw new CompilationError(
        'A class may only have one constructor'
      );
    }

    return new ConstructorDeclNode(
      { parameters, className: symbolTable.getScopeName() },
      [variables, new BlockNode(null, children, loc)],
      loc
    );
  }
}

export default ConstructorRule;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: PASS (parsing works; transpilation is not yet tested)

- [ ] **Step 5: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/ConstructorRule.ts tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
git commit -m "feat: add ConstructorRule parser"
```

---

## Task 8: Implement `ConstructorDeclRule` transpiler and update `RootRule` / `formatRoot`

**Files:**
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts` (extend)
- Test sample files: `tests/sampleFiles/constructor/Point.bas`, `tests/sampleFiles/constructor/Main.bas`

The `ConstructorDeclRule` generates `constructor(params) { body }` — just the method content, not the class wrapper. `RootRule` finds the constructor node among its children, extracts that string, removes it from the children list, and passes it to `formatRoot`, which wraps it inside the class declaration.

- [ ] **Step 1: Create sample files**

Create `tests/sampleFiles/constructor/Point.bas`:
```basic
Class
dim x
dim y

Constructor(startX, startY)
    x = startX
    y = startY
EndConstructor
```

Create `tests/sampleFiles/constructor/Main.bas`:
```basic
function onenter()
    dim p as Point(10, 20)
endfunction
```

- [ ] **Step 2: Add transpiler output tests to `constructors.test.ts`**

Add to the existing test file:
```typescript
describe('Constructor transpiled output', () => {
  test('class with constructor emits inline constructor in class declaration', () => {
    const src = [
      'Class',
      'dim x',
      'dim y',
      'Constructor(startX, startY)',
      '    x = startX',
      '    y = startY',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Point', source: src }] });
    // cleanWhitespace strips all spaces, so `class point{ constructor(...) {} }`
    // becomes `classpoint{constructor(...)...}`.
    expect(result).toContain('classpoint{');
    expect(result).toContain('constructor(constructor_startx,constructor_starty)');
    expect(result).toContain('this.x=constructor_startx');
    expect(result).toContain('this.y=constructor_starty');
  });

  test('class without constructor still emits bare class declaration', () => {
    const src = ['Class', 'dim x'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Box', source: src }] });
    expect(result).toContain('classbox{}');
  });
});

- [ ] **Step 3: Run tests to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: FAIL — constructor content not yet emitted

- [ ] **Step 4: Create `ConstructorDeclRule.ts`**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts`:
```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ConstructorDecl)
class ConstructorDeclRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const params = doChild(node, 0, table);
    const body = `
        ${doChild(node, 1, table)}`;
    return `constructor(${params}) {${body}}`;
  }
}

export default ConstructorDeclRule;
```

- [ ] **Step 5: Update `formatRoot` in `transpilerHelpers.ts`**

Find:
```typescript
export const formatRoot = (node: Tree, children: Array<string>) => {
  return `${formatClass(node.data)}
    ${children.join(';')}`;
};
```

Replace with:
```typescript
export const formatRoot = (node: Tree, children: Array<string>, constructorContent?: string) => {
  const classDecl = constructorContent
    ? `class ${node.data}{ ${constructorContent} }`
    : formatClass(node.data);
  return `${classDecl}
    ${children.join(';')}`;
};
```

- [ ] **Step 6: Update `RootRule.ts`**

Open `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts`.

Replace the entire file with:
```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { formatRoot } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Root)
class RootRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const constructorNode = node.children.find(
      (n) => n.type === nodeTypes.ConstructorDecl
    );

    const constructorContent = constructorNode
      ? getTranspilerRule(constructorNode.type).generate(constructorNode, table)
      : undefined;

    const children = node.children
      .filter((n) => n.type !== nodeTypes.ConstructorDecl)
      .map((n) => `${getTranspilerRule(n.type).generate(n, table)}`);

    return formatRoot(node, children, constructorContent);
  }
}

export default RootRule;
```

- [ ] **Step 7: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: PASS

- [ ] **Step 8: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 9: Commit**

```
git add src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts tests/sampleFiles/constructor/Point.bas tests/sampleFiles/constructor/Main.bas
git commit -m "feat: transpile Constructor/EndConstructor to class constructor method"
```

---

## Task 9: Extend `dim x as Type(args)` for constructor arguments

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`
- Modify: `src/lib/Basic4WebGL/nodes/CloneNode.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts` (extend)

`dim myCar as Car` currently emits `onenter_mycar = new car()`. This task extends it so `dim myCar as Car(100, 0, 0)` emits `onenter_mycar = new car(100, 0, 0)`. The parentheses are optional — omitting them preserves the existing behaviour exactly.

The arg list uses `ExpressionList` (same rule used for array dimensions), which generates comma-separated expressions and handles the `(...)` delimiters itself.

- [ ] **Step 1: Add call-site tests to `constructors.test.ts`**

Add:
```typescript
describe('dim x as Type(args) — constructor call site', () => {
  test('dim with args emits new Type(args)', () => {
    const pointFile = { name: 'Point', source: loadSampleFile('Point', folder) };
    const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };
    const result = compileOk({ lib: [], files: [pointFile, mainFile] });
    expect(result).toContain('onenter_p=newpoint(10,20)');
  });

  test('dim without args still emits new Type()', () => {
    const src = [
      'Class',
      'dim x',
    ].join('\n');
    const main = 'function onenter()\n    dim b as Box\nendfunction';
    const result = compileOk({
      lib: [],
      files: [{ name: 'Box', source: src }, { name: 'Main', source: main }],
    });
    expect(result).toContain('onenter_b=newbox()');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: FAIL — `dim p as Point(10, 20)` either errors or emits without args

- [ ] **Step 3: Update `CloneNode.ts` to accept optional children**

Open `src/lib/Basic4WebGL/nodes/CloneNode.ts`.

Find:
```typescript
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.Clone, data, new Array<Tree>());
    this.dataType = (data.object as Symbol).dataType;
    this.loc = loc;
  }
```

Replace with:
```typescript
  constructor(data: any | undefined, children: Tree[] = [], loc?: SourceLocation) {
    super(nodeTypes.Clone, data, children);
    this.dataType = (data.object as Symbol).dataType;
    this.loc = loc;
  }
```

- [ ] **Step 4: Update `DimRule.ts` to parse optional constructor args**

Open `src/lib/Basic4WebGL/parserRules/rules/DimRule.ts`.

Find the `As` branch:
```typescript
    if (check(tokens.As, tokenStream.current())) {
      matchAndMove(tokens.As, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const classSymbol = symbolTable.get(
        tokenStream.prev().text,
        symbolTypes.Class
      );
      const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);

      return new CloneNode({ object, classSymbol }, loc);
    }
```

Replace with:
```typescript
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
```

- [ ] **Step 5: Update `CloneRule.ts` to emit args when present**

Open `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts`.

Replace the entire file with:
```typescript
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Clone)
class CloneRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const lhs = formatSymbol(node.data.object);
    const className = node.data.classSymbol.name;
    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `${lhs} = new ${className}(${args});`;
    }
    return `${lhs} = new ${className}();`;
  }
}

export default CloneRule;
```

- [ ] **Step 6: Run tests to verify they pass**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: PASS

- [ ] **Step 7: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 8: Commit**

```
git add src/lib/Basic4WebGL/parserRules/rules/DimRule.ts src/lib/Basic4WebGL/nodes/CloneNode.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/CloneRule.ts tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts tests/sampleFiles/constructor/Point.bas tests/sampleFiles/constructor/Main.bas
git commit -m "feat: support dim x as Type(args) to pass constructor arguments"
```

---

## Task 10: End-to-end integration test

**Files:**
- Test: `tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts` (extend)

A full end-to-end test: define a class with a constructor and a method that reads/writes instance state, instantiate it with args, verify the complete output is correct.

- [ ] **Step 1: Add the end-to-end test**

Add to `constructors.test.ts`:
```typescript
describe('end-to-end: constructor + instance method', () => {
  test('full class with constructor and method produces correct output', () => {
    const classSrc = [
      'Class',
      'dim health',
      'dim x',
      '',
      'Constructor(startHealth, startX)',
      '    health = startHealth',
      '    x = startX',
      'EndConstructor',
      '',
      'function move(dx)',
      '    x = x + dx',
      'endfunction',
    ].join('\n');

    const mainSrc = [
      'function onenter()',
      '    dim player as Player(100, 0)',
      'endfunction',
    ].join('\n');

    const result = compileOk({
      lib: [],
      files: [
        { name: 'Player', source: classSrc },
        { name: 'Main', source: mainSrc },
      ],
    });

    // Class declaration with inline constructor
    expect(result).toContain('constructor(constructor_starthealth,constructor_startx)');
    expect(result).toContain('this.health=constructor_starthealth');
    expect(result).toContain('this.x=constructor_startx');

    // Instance method uses function() and this.
    expect(result).toContain('player.prototype.move=function(move_dx)');
    expect(result).toContain('this.x=this.x+move_dx');

    // Call site passes args
    expect(result).toContain('onenter_player=newplayer(100,0)');
  });
});
```

- [ ] **Step 2: Run the test**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
```

Expected: PASS

- [ ] **Step 3: Run the full suite one final time**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```
git add tests/lib/Basic4WebGL/integration/transpiler/constructors.test.ts
git commit -m "test: add end-to-end constructor and instance method integration test"
```

---

## Self-Review Checklist (for the implementer)

Before marking implementation complete, verify:

- [ ] `npx vitest run` passes with zero failures
- [ ] Module-level functions still use arrow functions (`=>`) — only class instance methods use `function()`
- [ ] `dim x as Type` (no args) still emits `new Type()` — existing class composition tests pass unchanged
- [ ] A class without a constructor still emits `class car{}` — the bare form is unchanged
- [ ] Constructor parameters use `constructor_paramName` prefix
- [ ] `health = value` inside a class method emits `this.health = value` (not `car.health = value`)
- [ ] `health` in an expression inside a class method emits `this.health` (not `car.health`)
