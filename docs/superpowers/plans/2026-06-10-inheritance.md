# softBASIC Single-Level Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single-level inheritance (`extends`), explicit `self.` for class properties, `super()` / `super.method()`, and fix the scope priority bug so inner scope wins.

**Architecture:** New tokens (`Self`, `Extends`, `Super`) feed new parser rules (`SelfRule`, `SuperRule` etc.) that emit existing node types for `self.` and three new node types for `super`. The `Symbol` base class gains an optional `parentClassName` field set by `ClassRule` when it parses `extends`. All existing class `.bas` files are migrated to `self.` atomically with enforcement.

**Tech Stack:** TypeScript, Vitest, existing compiler pipeline (lexer → parser → transpiler)

---

## File Map

**New files**
| Path | Responsibility |
|------|---------------|
| `src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts` | Parse `self.prop = expr` and `self.method(args)` in statement context |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts` | Parse `self.prop` and `self.method(args)` in expression context |
| `src/lib/Basic4WebGL/parserRules/rules/SuperRule.ts` | Parse `super(args)` and `super.method(args)` in statement context |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/SuperFactorRule.ts` | Parse `super.method(args)` in expression context |
| `src/lib/Basic4WebGL/nodes/SuperConstructorCallNode.ts` | AST node for `super(args)` |
| `src/lib/Basic4WebGL/nodes/SuperMethodCallNode.ts` | AST node for `super.method(args)` in statement context |
| `src/lib/Basic4WebGL/nodes/SuperMethodTermNode.ts` | AST node for `super.method(args)` in expression context |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperConstructorCallRule.ts` | Emit `super(args);` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodCallRule.ts` | Emit `Parent.prototype.method.call(this, args);` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodTermRule.ts` | Emit `Parent.prototype.method.call(this, args)` (no semicolon) |
| `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts` | Integration tests |
| `tests/sampleFiles/inheritance/Enemy.bas` | Base class sample |
| `tests/sampleFiles/inheritance/Boss.bas` | Derived class sample |
| `tests/sampleFiles/inheritance/Main.bas` | Usage sample |

**Modified files**
| Path | Change |
|------|--------|
| `src/lib/CompilerLib/symbols/index.ts` | Add `parentClassName?: string` to `Symbol`; fix scope priority (inner wins) |
| `src/lib/Basic4WebGL/tokens.ts` | Add `Self`, `Extends`, `Super` |
| `src/lib/Basic4WebGL/keywords.ts` | Add `'self'`, `'extends'`, `'super'` |
| `src/lib/Basic4WebGL/nodeTypes.ts` | Add `SuperConstructorCall`, `SuperMethodCall`, `SuperMethodTerm` |
| `src/lib/Basic4WebGL/parserRules/rules/ClassRule.ts` | Parse optional class name + `extends ParentName`; set `parentClassName` |
| `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts` | Throw compile error when bare name resolves to a class-scope Variable |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts` | Same |
| `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts` | Add `Self` and `Super` cases before the Variable case |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts` | Update `formatRoot` to emit `class X extends Y {}` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts` | Look up `parentClassName` and pass to `formatRoot` |
| `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts` | Auto-emit `super();` when class has parent and no explicit `super()` |
| `tests/lib/Basic4WebGL/keywords.test.ts` | Assert `self`, `extends`, `super` in keyword list |
| All class defs (5 files) and sample files (3 files) — see Task 5 | Migrate bare property access to `self.` |

---

### Task 1: Scope priority fix

**Files:**
- Modify: `src/lib/CompilerLib/symbols/index.ts`
- Test: `tests/lib/Basic4WebGL/unit/symbols/scopePriority.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/symbols/scopePriority.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace } from '../../helpers';

describe('scope priority: inner scope wins over outer', () => {
  it('local dim in a module function shadows a module-level dim', () => {
    const src = [
      'dim x',
      'function test()',
      '  dim x',
      '  x = 5',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Main', source: src }] });
    // Before fix: x = 5 would emit _x = 5 (resolves to module-level x)
    // After fix: x = 5 should emit test_x = 5 (resolves to local x)
    expect(cleanWhitespace(result.code!)).toContain('test_x=5');
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```
npx vitest run tests/lib/Basic4WebGL/unit/symbols/scopePriority.test.ts
```

Expected: FAIL — `test_x=5` not found (currently emits `_x=5`)

- [ ] **Step 3: Fix scope priority in `src/lib/CompilerLib/symbols/index.ts`**

Find the `retrieveSymbol` method. Change line ~222:

```ts
// Before (outer scope wins — the bug):
return currentPriority < bestPriority ? current : best;

// After (inner scope wins — the fix):
return currentPriority > bestPriority ? current : best;
```

- [ ] **Step 4: Run test to confirm it passes**

```
npx vitest run tests/lib/Basic4WebGL/unit/symbols/scopePriority.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full test suite to confirm no regressions**

```
npx vitest run
```

Expected: all previously passing tests still pass

- [ ] **Step 6: Commit**

```bash
git add tests/lib/Basic4WebGL/unit/symbols/scopePriority.test.ts src/lib/CompilerLib/symbols/index.ts
git commit -m "fix: inner scope now takes priority over outer scope in symbol resolution"
```

---

### Task 2: Tokens, keywords, and node types

**Files:**
- Modify: `src/lib/Basic4WebGL/tokens.ts`
- Modify: `src/lib/Basic4WebGL/keywords.ts`
- Modify: `src/lib/Basic4WebGL/nodeTypes.ts`
- Modify: `tests/lib/Basic4WebGL/keywords.test.ts`

- [ ] **Step 1: Write failing keyword test**

Open `tests/lib/Basic4WebGL/keywords.test.ts`. Add inside the `'contains declaration keywords'` test:

```ts
it('contains self, extends, super keywords', () => {
  for (const kw of ['self', 'extends', 'super']) {
    expect(SOFTBASIC_KEYWORDS).toContain(kw);
  }
});
```

- [ ] **Step 2: Run to confirm it fails**

```
npx vitest run tests/lib/Basic4WebGL/keywords.test.ts
```

Expected: FAIL — `self`, `extends`, `super` not in SOFTBASIC_KEYWORDS

- [ ] **Step 3: Add tokens**

In `src/lib/Basic4WebGL/tokens.ts`, add `'Self'`, `'Extends'`, `'Super'` to the array:

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
  'Equals',
  'NotEquals',
  'GreaterThan',
  'GreaterThanEqualTo',
  'LessThan',
  'LessThanEqualTo',
  'Dot',
  'Print',
  'Call',
  'Variable',
  'Class',
  'Dim',
  'As',
  'Function',
  'Return',
  'EndFunction',
  'Constructor',
  'EndConstructor',
  'EndClass',
  'Comma',
  'BoolTrue',
  'BoolFalse',
  'And',
  'Or',
  'Not',
  'If',
  'Else',
  'ElseIf',
  'EndIf',
  'While',
  'EndWhile',
  'Do',
  'Until',
  'For',
  'Next',
  'To',
  'In',
  'Self',
  'Extends',
  'Super',
]);
```

- [ ] **Step 4: Add keywords**

In `src/lib/Basic4WebGL/keywords.ts`, add `'self'`, `'extends'`, `'super'` to `SOFTBASIC_KEYWORDS`:

```ts
export const SOFTBASIC_KEYWORDS = [
  // Declarations
  'dim', 'class', 'as',
  'constructor', 'endconstructor', 'endclass',
  // Inheritance
  'self', 'extends', 'super',
  // Functions
  'function', 'return', 'endfunction',
  // Control flow
  'if', 'endif',
  'while', 'endwhile',
  'for', 'next', 'to', 'in',
  'do', 'until',
  // Boolean operators
  'and', 'or', 'not',
  // Literals
  'true', 'false',
  // Built-in statements
  'print', 'call',
] as const;
```

- [ ] **Step 5: Add node types**

In `src/lib/Basic4WebGL/nodeTypes.ts`, add `'SuperConstructorCall'`, `'SuperMethodCall'`, `'SuperMethodTerm'` to the enum array:

```ts
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
  'SuperConstructorCall',
  'SuperMethodCall',
  'SuperMethodTerm',
]);
```

- [ ] **Step 6: Run keyword test to confirm it passes**

```
npx vitest run tests/lib/Basic4WebGL/keywords.test.ts
```

Expected: PASS

- [ ] **Step 7: Run full suite**

```
npx vitest run
```

Expected: all previously passing tests still pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/tokens.ts src/lib/Basic4WebGL/keywords.ts src/lib/Basic4WebGL/nodeTypes.ts tests/lib/Basic4WebGL/keywords.test.ts
git commit -m "feat: add Self, Extends, Super tokens/keywords and super node types"
```

---

### Task 3: ClassSymbol parent support + ClassRule `extends` + transpiler `class X extends Y`

**Files:**
- Modify: `src/lib/CompilerLib/symbols/index.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/ClassRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts`
- Test: `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts` (new, partial)

- [ ] **Step 1: Write failing tests for extends class output**

Create `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, compileOk, loadSampleFile } from '../../helpers';

function compileErr(src: string, name = 'Test'): string {
  const result = compiler.transpile({ lib: [], files: [{ name, source: src }] });
  return result.diagnostics.map((d) => d.message).join('; ');
}

// ── class X extends Y — output ──────────────────────────────────────────────

describe('class extends — transpiler output', () => {
  test('class with extends emits class Boss extends Enemy {}', () => {
    const enemySrc = ['Class Enemy', 'Constructor(h)', '  self.health = h', 'EndConstructor'].join('\n');
    const bossSrc = ['Class Boss extends Enemy', 'Constructor(h)', '  super(h)', 'EndConstructor'].join('\n');
    const mainSrc = ['function onenter()', '  dim b as Boss(100)', 'endfunction'].join('\n');
    const result = compileOk({
      lib: [],
      files: [
        { name: 'Enemy', source: enemySrc },
        { name: 'Boss', source: bossSrc },
        { name: 'Main', source: mainSrc },
      ],
    });
    expect(result).toContain('classBossextendsEnemy');
  });

  test('class without extends still emits class X {}', () => {
    const src = ['Class Enemy', 'dim health'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Enemy', source: src }] });
    expect(result).toContain('classEnemy{');
    expect(result).not.toContain('extends');
  });
});

// ── compile errors — extends ─────────────────────────────────────────────────

describe('class extends — compile errors', () => {
  test('extending an unknown class throws compile error', () => {
    const src = 'Class Boss extends Unknown';
    const err = compileErr(src, 'Boss');
    expect(err).toMatch(/unknown.*has not been declared/i);
  });

  test('chained inheritance throws compile error', () => {
    const enemySrc = 'Class Enemy';
    const bossSrc = 'Class Boss extends Enemy';
    const minibossSrc = 'Class MiniBoss extends Boss';
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Enemy', source: enemySrc },
        { name: 'Boss', source: bossSrc },
        { name: 'MiniBoss', source: minibossSrc },
      ],
    });
    expect(result.diagnostics[0].message).toMatch(/already extends.*cannot be chained/i);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: FAIL — `classBossextendsEnemy` not in output, error tests also fail

- [ ] **Step 3: Add `parentClassName` to Symbol**

In `src/lib/CompilerLib/symbols/index.ts`, add the field to the `Symbol` class after `dataType`:

```ts
export class Symbol {
  public name: string = '';
  public type: string = '';
  public scope: SymbolScope;
  public fullScope: string = '';
  public dataType: BuiltInType;
  public parentClassName?: string;   // ← add this line

  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    dataType: BuiltInType
  ) {
    this.name = name;
    this.type = type;
    this.scope = scope;
    this.fullScope = fullScope;
    this.dataType = dataType;
  }
  // ... rest unchanged
```

- [ ] **Step 4: Update ClassRule to parse optional name + `extends`**

Replace the full contents of `src/lib/Basic4WebGL/parserRules/rules/ClassRule.ts`:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { CompilationError } from '@CompilerLib/errors';
import EmptyNode from '../../nodes/EmptyNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Class')
class ClassRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    if (tokenStream.current().line !== 1) {
      throw new CompilationError(
        'Class declaration must appear at the top of the file'
      );
    }

    matchAndMove(tokens.Class, tokenStream);

    // Optionally consume the class name (e.g. "Class Enemy") — ignored,
    // the class name is always the file name set by RootRule.
    if (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
    }

    // Upgrade current module symbol → class
    const moduleName = symbolTable.getScopeName();
    const module = symbolTable.get(moduleName, symbolTypes.Module);
    module.setType(symbolTypes.Class);
    module.setScopeType(scopeTypes.Class);
    symbolTable.setCurrentScope(symbolTable.getScopeName(), scopeTypes.Class);

    // Optionally parse "extends ParentName"
    if (check(tokens.Extends, tokenStream.current())) {
      matchAndMove(tokens.Extends, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const parentName = tokenStream.prev().text.toLowerCase();

      if (!symbolTable.check(parentName, symbolTypes.Class)) {
        throw new CompilationError(
          `Class '${parentName}' has not been declared yet`
        );
      }
      const parentSymbol = symbolTable.get(parentName, symbolTypes.Class);
      if (parentSymbol.parentClassName) {
        throw new CompilationError(
          `'${parentName}' already extends '${parentSymbol.parentClassName}' — inheritance cannot be chained`
        );
      }

      module.parentClassName = parentName;
    }

    if (check(newLines, tokenStream.current())) {
      matchAndMove(newLines, tokenStream);
    }

    return new EmptyNode(loc);
  }
}

export default ClassRule;
```

- [ ] **Step 5: Update `formatRoot` in transpilerHelpers**

In `src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts`, update `formatRoot` to accept an optional `parentName`:

```ts
export const formatRoot = (node: Tree, children: Array<string>, constructorContent?: string, parentName?: string): string => {
  const extendsClause = parentName ? ` extends ${parentName}` : '';
  const classDecl = constructorContent
    ? `class ${node.data}${extendsClause}{ ${constructorContent} }`
    : `class ${node.data}${extendsClause}{}`;
  return `${classDecl}
    ${children.join(';')}`;
};
```

Also remove `formatClass` (it is now inlined above) or keep it for backward compat — the safest approach is to just update `formatRoot` and leave `formatClass` alone:

```ts
export const formatRoot = (node: Tree, children: Array<string>, constructorContent?: string, parentName?: string): string => {
  const extendsClause = parentName ? ` extends ${parentName}` : '';
  const classDecl = constructorContent
    ? `class ${node.data}${extendsClause}{ ${constructorContent} }`
    : `class ${node.data}${extendsClause}{}`;
  return `${classDecl}
    ${children.join(';')}`;
};
```

- [ ] **Step 6: Update transpiler RootRule to pass parentName**

In `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts`:

```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { formatRoot } from '../helpers/transpilerHelpers';
import { symbolTypes } from '../../../symbolTypes';

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

    const className = node.data as string;
    const classSymbol = table ? table.retrieveSymbol(className, symbolTypes.Class) : undefined;
    const parentName = classSymbol?.parentClassName;

    return formatRoot(node, children, constructorContent, parentName);
  }
}

export default RootRule;
```

- [ ] **Step 7: Run inheritance tests**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: the `extends` output and error tests PASS (the `self.` and `super` tests added in later tasks will be added in those tasks)

- [ ] **Step 8: Run full suite**

```
npx vitest run
```

Expected: all previously passing tests still pass

- [ ] **Step 9: Commit**

```bash
git add src/lib/CompilerLib/symbols/index.ts src/lib/Basic4WebGL/parserRules/rules/ClassRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/RootRule.ts tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
git commit -m "feat: ClassRule parses 'extends ParentName', transpiler emits 'class X extends Y'"
```

---

### Task 4: `self.` keyword — parser rules (additive, no enforcement yet)

**Files:**
- Create: `src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts`
- Create: `src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`

- [ ] **Step 1: Add failing `self.` tests to inheritance.test.ts**

Append this describe block to `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`:

```ts
// ── self. keyword ────────────────────────────────────────────────────────────

describe('self. keyword — transpiler output', () => {
  test('self.property = expr emits this.property = rhs', () => {
    const src = [
      'Class Player',
      'dim health',
      'Constructor(h)',
      '  self.health = h',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('this.health=constructor_h');
  });

  test('self.property in expression emits this.property', () => {
    const src = [
      'Class Player',
      'dim health',
      'function getHealth()',
      '  return self.health',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('returnthis.health');
  });

  test('self.method(args) in statement emits this.method(args)', () => {
    const src = [
      'Class Player',
      'dim health',
      'Constructor(h)',
      '  self.health = h',
      'EndConstructor',
      'function reset()',
      '  self.init(100)',
      'endfunction',
      'function init(h)',
      '  self.health = h',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('this.init(reset_');
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: FAIL — `self` is not a valid token yet

- [ ] **Step 3: Create `SelfRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts`:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
import { CompilationError } from '@CompilerLib/errors';
import { newLines } from '../../parserConfig';

function assertInsideClass(symbolTable: Symbols): void {
  const scopeType = symbolTable.getScopeType();
  if (scopeType !== scopeTypes.Function && scopeType !== scopeTypes.Constructor) {
    throw new CompilationError("'self' can only be used inside a class method or constructor");
  }
  const fullScope = symbolTable.getFullScopeName();
  const topName = fullScope.split('.')[0];
  if (!topName || !symbolTable.check(topName, symbolTypes.Class)) {
    throw new CompilationError("'self' can only be used inside a class");
  }
}

@RegisterParserRule('Self')
class SelfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args)
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new PropertyMethodCallNode(`this.${memberName}`, args, loc);
    }

    // self.property = expr
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);
    return new PropertyAssignNode({ chain: `this.${memberName}` }, expr, loc);
  }
}

export default SelfRule;
```

- [ ] **Step 4: Create `SelfFactorRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts`:

```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
import { CompilationError } from '@CompilerLib/errors';

function assertInsideClass(symbolTable: Symbols): void {
  const scopeType = symbolTable.getScopeType();
  if (scopeType !== scopeTypes.Function && scopeType !== scopeTypes.Constructor) {
    throw new CompilationError("'self' can only be used inside a class method or constructor");
  }
  const fullScope = symbolTable.getFullScopeName();
  const topName = fullScope.split('.')[0];
  if (!topName || !symbolTable.check(topName, symbolTypes.Class)) {
    throw new CompilationError("'self' can only be used inside a class");
  }
}

@RegisterParserRule('SelfFactor')
class SelfFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args) in expression context
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new PropertyMethodTermNode(`this.${memberName}`, args, loc);
    }

    // self.property in expression context
    return new PropertyTermNode(`this.${memberName}`, loc);
  }
}

export default SelfFactorRule;
```

- [ ] **Step 5: Update FactorRule to handle `Self` and `Super` tokens**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts`, add two checks immediately before the `if (check(tokens.Variable, ...))` check:

```ts
    if (check(tokens.Call, tokenStream.current())) {
      return getParserRule('CallFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
    if (check(tokens.Self, tokenStream.current())) {
      return getParserRule('SelfFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
    if (check(tokens.Super, tokenStream.current())) {
      return getParserRule('SuperFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
    if (check(tokens.Variable, tokenStream.current())) {
      return getParserRule('VariableFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
```

- [ ] **Step 6: Run self. tests**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: the `self.` describe block passes

- [ ] **Step 7: Run full suite**

```
npx vitest run
```

Expected: all previously passing tests still pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/SelfRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/SelfFactorRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/FactorRule.ts tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
git commit -m "feat: add self. keyword — self.prop and self.method() parse and transpile correctly"
```

---

### Task 5: Enforce `self.` + migrate all class `.bas` files

**Files:**
- Modify: `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`
- Modify: `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/defs/sprite.bas`
- Modify: `src/lib/Basic4WebGL/defs/text.bas`
- Modify: `src/lib/Basic4WebGL/defs/animatedsprite.bas`
- Modify: `src/lib/Basic4WebGL/defs/tilemap.bas`
- Modify: `src/lib/Basic4WebGL/defs/transform.bas`
- Modify: `tests/sampleFiles/instanceMethods/Player.bas`
- Modify: `tests/sampleFiles/constructor/Point.bas`

- [ ] **Step 1: Add failing enforcement test**

Append to `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`:

```ts
// ── self. enforcement ────────────────────────────────────────────────────────

describe('self. enforcement — bare class property access is a compile error', () => {
  test('bare access to a class Variable property in a method throws compile error', () => {
    const src = [
      'Class Player',
      'dim health',
      'function takeDamage(amount)',
      '  health = health - amount',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Player');
    expect(err).toMatch(/'health' is a class property — use self\.health/i);
  });

  test('bare access to a class Variable property in a constructor throws compile error', () => {
    const src = [
      'Class Player',
      'dim health',
      'Constructor(h)',
      '  health = h',
      'EndConstructor',
    ].join('\n');
    const err = compileErr(src, 'Player');
    expect(err).toMatch(/'health' is a class property — use self\.health/i);
  });
});
```

- [ ] **Step 2: Run to confirm enforcement tests fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts --reporter=verbose 2>&1 | grep -E "PASS|FAIL|●"
```

Expected: the new enforcement tests FAIL (bare access currently succeeds)

- [ ] **Step 3: Add enforcement in `VariableRule.ts`**

In `src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts`, find the two places where `isInstancePropertyAccess` is used:

**Place 1** — Object symbol case (around line 48):
```ts
      if (isInstancePropertyAccess(objSymbol, symbolTable)) {
        return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
      }
```
Leave this unchanged — Object-typed properties keep auto-detection for now.

**Place 2** — Variable symbol case (around line 93):
```ts
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

Change Place 2 to throw instead of silently emit:
```ts
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    if (isInstancePropertyAccess(varSymbol, symbolTable)) {
      throw new CompilationError(`'${name}' is a class property — use self.${name}`);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new AssignNode(varSymbol, expr, loc);
```

(The `CompilationError` import is already at the top of this file — no new import needed.)

- [ ] **Step 4: Add enforcement in `VariableFactorRule.ts`**

In `src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts`, find the `isInstancePropertyAccess` call near the bottom of the variable read path (around line 99):

```ts
      if (isInstancePropertyAccess(varSymbol, symbolTable)) {
        return new PropertyTermNode(`this.${name}`, loc, varSymbol.dataType);
      }
      return new TermNode(varSymbol, new VariableNode(name), loc);
```

Change to throw:
```ts
      if (isInstancePropertyAccess(varSymbol, symbolTable)) {
        throw new CompilationError(`'${name}' is a class property — use self.${name}`);
      }
      return new TermNode(varSymbol, new VariableNode(name), loc);
```

Add `CompilationError` to the imports at the top of `VariableFactorRule.ts`:
```ts
import { CompilationError } from '@CompilerLib/errors';
```

- [ ] **Step 5: Run enforcement tests — they should now pass but other tests will fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: enforcement tests PASS; full suite will have failures from existing class files

- [ ] **Step 6: Migrate `tests/sampleFiles/instanceMethods/Player.bas`**

Replace the full contents:
```basic
Class Player

dim health

Constructor(startHealth)
  self.health = startHealth
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction

function getHealth()
  return self.health
endfunction
```

- [ ] **Step 7: Migrate `tests/sampleFiles/constructor/Point.bas`**

Replace the full contents:
```basic
Class Point

dim x
dim y

Constructor(startX, startY)
  self.x = startX
  self.y = startY
EndConstructor
```

- [ ] **Step 8: Migrate `src/lib/Basic4WebGL/defs/sprite.bas`**

Only the constructor body changes (`_handle =` → `self._handle =`). The method bodies already use `this._handle` inside string literals passed to `call()` — those strings are NOT parsed as BASIC and do not need to change:

```basic
Class Sprite

dim _handle

Constructor(imagePath)
    self._handle = call("_sb.createSprite(constructor_imagePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setAngle(angle)
    call("_sb.setAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setVisible(this._handle, setvisible_v)")
endfunction

function setTexture(path)
    call("_sb.setTexture(this._handle, settexture_path)")
endfunction

function width()
    return call("_sb.getSpriteWidth(this._handle)")
endfunction

function height()
    return call("_sb.getSpriteHeight(this._handle)")
endfunction

EndClass
```

- [ ] **Step 9: Migrate `src/lib/Basic4WebGL/defs/text.bas`**

```basic
Class Text

dim _handle

Constructor(content, x, y)
    self._handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")
EndConstructor

function setText(content)
    call("_sb.setText(this._handle, settext_content)")
endfunction

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setStyle(size, r, g, b)
    call("_sb.setTextStyle(this._handle, setstyle_size, setstyle_r, setstyle_g, setstyle_b)")
endfunction

EndClass
```

- [ ] **Step 10: Migrate `src/lib/Basic4WebGL/defs/animatedsprite.bas`**

Read the full current file, then change `_handle = call(...)` in the constructor to `self._handle = call(...)`. All method bodies use `call("...this._handle...")` string literals — unchanged:

```basic
Class AnimatedSprite

dim _handle

Constructor(imagePath, frameW, frameH)
    self._handle = call("_sb.createAnimatedSprite(constructor_imagePath, constructor_frameW, constructor_frameH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function addAnim(name, startFrame, endFrame, fps, loop)
    call("_sb.addAnim(this._handle, addanim_name, addanim_startFrame, addanim_endFrame, addanim_fps, addanim_loop)")
endfunction

function play(name)
    call("_sb.playAnim(this._handle, play_name)")
endfunction

function isPlaying(name)
    return call("_sb.isPlayingAnim(this._handle, isplaying_name)")
endfunction

function stop()
    call("_sb.stopAnim(this._handle)")
endfunction

function setFlip(h, v)
    call("_sb.setFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setVisible(v)
    call("_sb.setVisible(this._handle, setvisible_v)")
endfunction

function width()
    return call("_sb.getSpriteWidth(this._handle)")
endfunction

function height()
    return call("_sb.getSpriteHeight(this._handle)")
endfunction

EndClass
```

- [ ] **Step 11: Migrate `src/lib/Basic4WebGL/defs/tilemap.bas`**

```basic
Class TileMap

dim _handle

Constructor(tilesetPath, tileW, tileH)
    self._handle = call("_sb.createTileMap(constructor_tilesetPath, constructor_tileW, constructor_tileH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function load(jsonPath)
    call("_sb.loadTileMap(this._handle, load_jsonPath)")
endfunction

function tileAt(x, y)
    return call("_sb.tileAt(this._handle, tileat_x, tileat_y)")
endfunction

function widthPx()
    return call("_sb.tileMapWidthPx(this._handle)")
endfunction

function heightPx()
    return call("_sb.tileMapHeightPx(this._handle)")
endfunction

EndClass
```

- [ ] **Step 12: Migrate `src/lib/Basic4WebGL/defs/transform.bas`**

```basic
Class ObjectTransform

dim _handle

Constructor(handle)
    self._handle = call("constructor_handle")
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

- [ ] **Step 13: Run full test suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 14: Commit**

```bash
git add src/lib/Basic4WebGL/parserRules/rules/VariableRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/VariableFactorRule.ts src/lib/Basic4WebGL/defs/sprite.bas src/lib/Basic4WebGL/defs/text.bas src/lib/Basic4WebGL/defs/animatedsprite.bas src/lib/Basic4WebGL/defs/tilemap.bas src/lib/Basic4WebGL/defs/transform.bas tests/sampleFiles/instanceMethods/Player.bas tests/sampleFiles/constructor/Point.bas tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
git commit -m "feat: enforce self. for class properties, migrate all class .bas files"
```

---

### Task 6: `super` — nodes, parser rules, transpiler rules, auto-super in constructors

**Files:**
- Create: `src/lib/Basic4WebGL/nodes/SuperConstructorCallNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/SuperMethodCallNode.ts`
- Create: `src/lib/Basic4WebGL/nodes/SuperMethodTermNode.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperConstructorCallRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodCallRule.ts`
- Create: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodTermRule.ts`
- Create: `src/lib/Basic4WebGL/parserRules/rules/SuperRule.ts`
- Create: `src/lib/Basic4WebGL/parserRules/rules/Expressions/SuperFactorRule.ts`
- Modify: `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts`
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`

- [ ] **Step 1: Add failing `super` tests to inheritance.test.ts**

Append to `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`:

```ts
// ── super ────────────────────────────────────────────────────────────────────

const folder = 'inheritance';
const enemyFile = { name: 'Enemy', source: loadSampleFile('Enemy', folder) };
const bossFile = { name: 'Boss', source: loadSampleFile('Boss', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

describe('super() in constructor', () => {
  test('explicit super(args) emits super(args) at start of constructor', () => {
    const result = compileOk({ lib: [], files: [enemyFile, bossFile, mainFile] });
    expect(result).toContain('constructor(constructor_h){super(constructor_h)');
  });

  test('child with no super() call auto-emits super() at top of constructor', () => {
    const childSrc = [
      'Class Child extends Enemy',
      'Constructor(h)',
      '  self.phase = 1',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [
        enemyFile,
        { name: 'Child', source: childSrc },
        mainFile,
      ],
    });
    expect(result).toContain('constructor(constructor_h){super()');
  });
});

describe('super.method() — transpiler output', () => {
  test('super.takeDamage(amount) emits Enemy.prototype.takeDamage.call(this, amount)', () => {
    const result = compileOk({ lib: [], files: [enemyFile, bossFile, mainFile] });
    expect(result).toContain('enemy.prototype.takedamage.call(this');
  });
});

describe('super — compile errors', () => {
  test('super() in a method (not constructor) throws compile error', () => {
    const childSrc = [
      'Class Child extends Enemy',
      'function reset()',
      '  super(100)',
      'endfunction',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [enemyFile, { name: 'Child', source: childSrc }, mainFile],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/super\(\) can only be called in a constructor/i);
  });

  test('super.missingMethod() throws compile error', () => {
    const childSrc = [
      'Class Child extends Enemy',
      'function reset()',
      '  super.nonexistent()',
      'endfunction',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [enemyFile, { name: 'Child', source: childSrc }, mainFile],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/nonexistent.*not defined on parent/i);
  });

  test('super in class with no parent throws compile error', () => {
    const src = [
      'Class Lone',
      'function reset()',
      '  super.someMethod()',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Lone');
    expect(err).toMatch(/which has no parent/i);
  });
});
```

- [ ] **Step 2: Create sample files**

Create `tests/sampleFiles/inheritance/Enemy.bas`:
```basic
Class Enemy

dim health

Constructor(startHealth)
  self.health = startHealth
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction

function getHealth()
  return self.health
endfunction
```

Create `tests/sampleFiles/inheritance/Boss.bas`:
```basic
Class Boss extends Enemy

dim phase

Constructor(startHealth)
  super(startHealth)
  self.phase = 1
EndConstructor

function takeDamage(amount)
  super.takeDamage(amount / 2)
  self.phase = self.phase + 1
endfunction
```

Create `tests/sampleFiles/inheritance/Main.bas`:
```basic
function onenter()
  dim b as Boss(200)
endfunction
```

- [ ] **Step 3: Run to confirm super tests fail**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: new super tests FAIL — `Super` token not parsed yet

- [ ] **Step 4: Create node files**

Create `src/lib/Basic4WebGL/nodes/SuperConstructorCallNode.ts`:
```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents super(args) in a child class constructor.
 * data.parentName — the parent class name (lowercase, as in the symbol table)
 * children[0]     — ExpressionList of arguments
 */
class SuperConstructorCallNode extends Tree {
  constructor(data: { parentName: string }, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.SuperConstructorCall, data, [args]);
    this.loc = loc;
  }
}

export default SuperConstructorCallNode;
```

Create `src/lib/Basic4WebGL/nodes/SuperMethodCallNode.ts`:
```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents super.method(args) in statement context.
 * data.parentName  — the parent class name (lowercase)
 * data.methodName  — the method name (lowercase)
 * children[0]      — ExpressionList of arguments
 */
class SuperMethodCallNode extends Tree {
  constructor(data: { parentName: string; methodName: string }, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.SuperMethodCall, data, [args]);
    this.loc = loc;
  }
}

export default SuperMethodCallNode;
```

Create `src/lib/Basic4WebGL/nodes/SuperMethodTermNode.ts`:
```ts
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents super.method(args) in expression context.
 * data.parentName  — the parent class name (lowercase)
 * data.methodName  — the method name (lowercase)
 * children[0]      — ExpressionList of arguments
 */
class SuperMethodTermNode extends Tree {
  constructor(data: { parentName: string; methodName: string }, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.SuperMethodTerm, data, [args]);
    this.loc = loc;
  }
}

export default SuperMethodTermNode;
```

- [ ] **Step 5: Create transpiler rules**

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperConstructorCallRule.ts`:
```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SuperConstructorCall)
class SuperConstructorCallRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const args = doChild(node, 0, table);
    return `super(${args});`;
  }
}

export default SuperConstructorCallRule;
```

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodCallRule.ts`:
```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SuperMethodCall)
class SuperMethodCallRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const { parentName, methodName } = node.data as { parentName: string; methodName: string };
    const args = doChild(node, 0, table);
    const argStr = args ? `, ${args}` : '';
    return `${parentName}.prototype.${methodName}.call(this${argStr});`;
  }
}

export default SuperMethodCallRule;
```

Create `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodTermRule.ts`:
```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SuperMethodTerm)
class SuperMethodTermRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const { parentName, methodName } = node.data as { parentName: string; methodName: string };
    const args = doChild(node, 0, table);
    const argStr = args ? `, ${args}` : '';
    return `${parentName}.prototype.${methodName}.call(this${argStr})`;
  }
}

export default SuperMethodTermRule;
```

- [ ] **Step 6: Create `SuperRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/SuperRule.ts`:
```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import SuperConstructorCallNode from '../../nodes/SuperConstructorCallNode';
import SuperMethodCallNode from '../../nodes/SuperMethodCallNode';
import { CompilationError } from '@CompilerLib/errors';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Super')
class SuperRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    const scopeType = symbolTable.getScopeType();
    const fullScope = symbolTable.getFullScopeName();
    const className = fullScope.split('.')[0];

    if (!className || !symbolTable.check(className, symbolTypes.Class)) {
      throw new CompilationError("'super' can only be used inside a class");
    }

    const classSymbol = symbolTable.get(className, symbolTypes.Class);
    const parentName = classSymbol.parentClassName;
    if (!parentName) {
      throw new CompilationError(
        `'super' used in class '${className}' which has no parent`
      );
    }

    matchAndMove(tokens.Super, tokenStream);

    if (check(tokens.OpenParen, tokenStream.current())) {
      // super(args) — constructor call
      if (scopeType !== scopeTypes.Constructor) {
        throw new CompilationError("super() can only be called in a constructor");
      }
      // Prevent multiple super() calls in same constructor
      try {
        symbolTable.add('__supercall__', symbolTypes.Variable);
      } catch {
        throw new CompilationError('super() called more than once in constructor');
      }
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new SuperConstructorCallNode({ parentName }, args, loc);
    }

    if (check(tokens.Dot, tokenStream.current())) {
      // super.method(args)
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const methodName = tokenStream.prev().text.toLowerCase();

      try {
        symbolTable.getInScope(methodName, symbolTypes.Function, parentName);
      } catch {
        throw new CompilationError(
          `'${methodName}' is not defined on parent class '${parentName}'`
        );
      }

      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new SuperMethodCallNode({ parentName, methodName }, args, loc);
    }

    throw new CompilationError("Expected '(' or '.' after 'super'");
  }
}

export default SuperRule;
```

- [ ] **Step 7: Create `SuperFactorRule.ts`**

Create `src/lib/Basic4WebGL/parserRules/rules/Expressions/SuperFactorRule.ts`:
```ts
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import SuperMethodTermNode from '@Basic4WebGL/nodes/SuperMethodTermNode';
import { CompilationError } from '@CompilerLib/errors';

@RegisterParserRule('SuperFactor')
class SuperFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    const fullScope = symbolTable.getFullScopeName();
    const className = fullScope.split('.')[0];

    if (!className || !symbolTable.check(className, symbolTypes.Class)) {
      throw new CompilationError("'super' can only be used inside a class");
    }

    const classSymbol = symbolTable.get(className, symbolTypes.Class);
    const parentName = classSymbol.parentClassName;
    if (!parentName) {
      throw new CompilationError(
        `'super' used in class '${className}' which has no parent`
      );
    }

    matchAndMove(tokens.Super, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const methodName = tokenStream.prev().text.toLowerCase();

    try {
      symbolTable.getInScope(methodName, symbolTypes.Function, parentName);
    } catch {
      throw new CompilationError(
        `'${methodName}' is not defined on parent class '${parentName}'`
      );
    }

    const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
    return new SuperMethodTermNode({ parentName, methodName }, args, loc);
  }
}

export default SuperFactorRule;
```

- [ ] **Step 8: Update `ConstructorDeclRule` to auto-emit `super()`**

Replace `src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts`:
```ts
import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';
import { symbolTypes } from '../../../symbolTypes';

@RegisterTranspilerRule(nodeTypes.ConstructorDecl)
class ConstructorDeclRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const params = doChild(node, 0, table);
    const body = doChild(node, 1, table);

    // Auto-emit super() if class has a parent and no explicit super() was written
    const className = (node.data as { className: string }).className;
    const classSymbol = table ? table.retrieveSymbol(className, symbolTypes.Class) : undefined;
    const hasParent = !!classSymbol?.parentClassName;
    const hasExplicitSuper = node.children[1].children.some(
      (c) => c.type === nodeTypes.SuperConstructorCall
    );

    const autoSuper = hasParent && !hasExplicitSuper ? 'super();' : '';
    return `constructor(${params}) {${autoSuper}${body}}`;
  }
}

export default ConstructorDeclRule;
```

- [ ] **Step 9: Run super tests**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: all tests in the file pass

- [ ] **Step 10: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 11: Commit**

```bash
git add src/lib/Basic4WebGL/nodes/SuperConstructorCallNode.ts src/lib/Basic4WebGL/nodes/SuperMethodCallNode.ts src/lib/Basic4WebGL/nodes/SuperMethodTermNode.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperConstructorCallRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodCallRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/SuperMethodTermRule.ts src/lib/Basic4WebGL/parserRules/rules/SuperRule.ts src/lib/Basic4WebGL/parserRules/rules/Expressions/SuperFactorRule.ts src/lib/Basic4WebGL/transpilerRules/jsRules/ruleSets/ConstructorDeclRule.ts tests/sampleFiles/inheritance/Enemy.bas tests/sampleFiles/inheritance/Boss.bas tests/sampleFiles/inheritance/Main.bas tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
git commit -m "feat: super() and super.method() — parse, transpile, auto-super in constructors"
```

---

### Task 7: Remaining error enforcement tests

**Files:**
- Modify: `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`

- [ ] **Step 1: Add remaining error tests**

Append to `tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts`:

```ts
// ── remaining error cases ────────────────────────────────────────────────────

describe('self — additional error cases', () => {
  test('self used in a module (no class declaration) throws compile error', () => {
    const src = [
      'function doThing()',
      '  self.x = 5',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Main');
    expect(err).toMatch(/'self' can only be used inside a class/i);
  });

  test('self.property in expression in a module throws compile error', () => {
    const src = [
      'function doThing()',
      '  dim n',
      '  n = self.health',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Main');
    expect(err).toMatch(/'self' can only be used inside a class/i);
  });
});

describe('super — multiple super() calls', () => {
  test('calling super() twice in constructor throws compile error', () => {
    const childSrc = [
      'Class Child extends Enemy',
      'Constructor(h)',
      '  super(h)',
      '  super(h)',
      'EndConstructor',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [enemyFile, { name: 'Child', source: childSrc }, mainFile],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/super\(\) called more than once/i);
  });
});
```

- [ ] **Step 2: Run inheritance tests**

```
npx vitest run tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
```

Expected: all tests pass

- [ ] **Step 3: Run full suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/lib/Basic4WebGL/integration/transpiler/inheritance.test.ts
git commit -m "test: add remaining error enforcement tests for self and super"
```
