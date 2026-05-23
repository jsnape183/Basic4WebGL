# Outstanding Issues

Minor items identified during implementation review that are deferred for later attention.
Each entry includes context, risk level, and suggested follow-up.

---

## 1. Delegation-only parser rules not verified for loc propagation

**File(s):** `src/lib/Basic4WebGL/parserRules/rules/Expressions/BoolTermRule.ts`,
`ExpressionRule.ts`, `ModuleFactorRule.ts`

**Risk:** Low — `parseFile` catch block enriches any error without a loc using
`stream.current().loc()`, so a loc will always be present. The issue is precision:
errors originating inside these rules may carry the stream position at catch time
rather than the exact token that triggered the error.

**Context:** During Task 7 these three rules were classified as "delegation-only" (they
call through to other rules and do not construct nodes themselves). That classification
was not verified against the source. If any of them do construct nodes, those nodes will
lack loc fields.

**Suggested follow-up:** Read each file and confirm they contain no `new XxxNode(...)`
calls. If they do, apply the standard `const loc = tokenStream.current().loc()` pattern
and pass loc to the node constructor.

---

## 2. Stray `}` in `UnexpectedError` message template

**File:** `src/lib/CompilerLib/errors.ts`

**Risk:** Cosmetic — produces a literal stray `}` character at the end of every
`UnexpectedError` message string.

**Context:** Pre-existing issue, not introduced by the source-location work. The
template literal in the constructor reads:

```typescript
`An unexpected error occured with the message ${error.name} "${error.message}"
  Stack Trace ${error?.stack}}`   // <-- extra } here
```

**Suggested follow-up:** Remove the trailing `}` from the template. Consider also
fixing the typo "occured" → "occurred" while there.

---

## 3. No test for `PrintNode.validate()` loc propagation

**File:** `tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts`

**Risk:** Very low — `PrintNode.validate()` checks that its child has a type accepted
by `Variant`. In practice `Variant` accepts every type, so the throw path is
unreachable via normal compilation. The behaviour is covered by the shared base-class
tests for `BaseArithmaticValidatorNode`.

**Context:** During Task 6 review it was noted that `PrintNode` overrides `validate()`
and passes `this.loc` to `SemanticTypeError`, but no test exercises that throw path
because it cannot be reached with real built-in types.

**Suggested follow-up:** Either add a test that injects a mock `dataType` that rejects
all children (similar to the AddNode validator test pattern), or document that coverage
is intentionally omitted because the path is unreachable in practice.

---

## 4. `new Tree()` direct construction bypasses loc

**File:** `src/lib/CompilerLib/tree/index.ts` (and any future parser rules)

**Risk:** Low for current code (parser rules all use node constructors), medium for
future contributors unfamiliar with the pattern.

**Context:** The `node()` factory function accepts an optional `loc` parameter and
assigns it to the returned `Tree`. Any code that constructs a `Tree` via
`new Tree(type, data, children)` directly will produce a node with `loc === undefined`,
even if a loc is available at construction time. Stream-position enrichment in
`parseFile` is a safety net but gives a less precise location.

**Suggested follow-up:** Add a JSDoc comment to the `Tree` constructor (or to `node()`)
warning contributors to prefer the `node()` factory when constructing AST nodes from
parser rules. Longer term, consider making the `Tree` constructor private and routing
all construction through `node()` or typed subclass constructors.

---

---

## 5. File load order is manually controlled — no automatic dependency resolution

**File(s):** `src/lib/CompilerLib/parser/index.ts`, `src/lib/Basic4WebGL/index.ts`

**Risk:** Medium for usability — users must manually order project files so that class definitions appear before any file that uses them as a type (`dim x as ClassName`). Getting the order wrong produces a `Class X has not been declared yet` compile error with no guidance on how to fix it.

**Context:** The compiler shares a single `Symbols` table across all files and processes them sequentially in the order provided by the project. When `DimRule` parses `dim x as Car`, it does an immediate symbol table lookup for the `Car` class. If `Car.bas` has not yet been parsed, the symbol does not exist. This is a fundamental consequence of the single-pass architecture.

**Desired behaviour:** The compiler should analyse all files for top-level class declarations in a first pass, then compile in full. This would make file order irrelevant for type references.

**Suggested follow-up:** Add a pre-pass in `parse()` (or the lexer pipeline) that registers all module/class names before the main parse loop runs. Class bodies would still be compiled in the second pass, but their names would be available to all files from the start. This requires separating "symbol registration" from "body parsing" for the `Root` and `Class` rules.

**Workaround:** Order files in the project with leaf classes first and consumers after. `Key.bas` before `Car.bas` before `Main.bas`.

---

*Last updated: 2026-05-23 — issue 5 added after class composition feature implementation.*
