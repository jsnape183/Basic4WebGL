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

## 5. ~~File load order is manually controlled — no automatic dependency resolution~~ **[RESOLVED]**

**File(s):** `src/lib/Basic4WebGL/sortByDependencies.ts`, `src/hooks/useProjectForBuild.ts`

Resolved by `sortByDependencies.ts` — a topological sort of project files by `new`/`as`/`extends`/method references, wired into `useProjectForBuild.ts`. Shipped 2026-06-17/18, before `v0.3.0` (see `docs/language/library-roadmap.md`'s "Two-pass compilation [DONE]"), but this entry wasn't updated at the time. No file-ordering constraint remains for class references; the compiler now orders files itself regardless of how they're listed in the project.

**Original problem (for context):** The compiler shares a single `Symbols` table across all files and processes them sequentially in the order provided by the project. When `DimRule` parsed `dim x as Car`, it did an immediate symbol table lookup for the `Car` class — if `Car.bas` hadn't been parsed yet, the symbol didn't exist, producing a `Class X has not been declared yet` error with no guidance.

---

*Last updated: 2026-05-23 — issue 5 added after class composition feature implementation.*

---

*Updated 2026-05-24 — Library architecture refactor (P3) complete. Runtime singletons replaced by `_sb` engine. Descriptor+generator system eliminates fragile `call()` strings. `Sprite` and `Text` are now classes. softGfx package bumped to v2.0.0.*

---

*Updated 2026-08-02 — issue 5 marked resolved; it was fixed by `sortByDependencies.ts` back on 2026-06-17/18 but this file was never updated to reflect it, so it sat listed as open for over a month after the fix shipped.*
