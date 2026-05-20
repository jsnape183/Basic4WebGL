import { describe, test, expect } from 'vitest';
import '@Basic4WebGL/parserRules';
import { hasParserRule } from '@CompilerLib/parser/parserRuleFactory';

// ─── Explicit contract ────────────────────────────────────────────────────────
//
// RootRule dispatches to parser rules by token.name. Any token that can appear
// as the first token of a statement must have a corresponding registered rule,
// otherwise parsing silently fails at runtime with "Cannot find rule with name X".
//
// This test makes that contract explicit and enforced at build time.

const STATEMENT_LEVEL_TOKENS = [
  // statement keywords
  'Print',
  'Call',
  'Dim',
  'Function',
  'Return',
  'Class',
  // control flow
  'If',
  'While',
  'For',
  // variable assignment / module method calls
  'Variable',
  // statement separators
  'NewLine',
  'SoftNewLine',
];

describe('statement-level token → parser rule coverage', () => {
  test.each(STATEMENT_LEVEL_TOKENS)(
    '"%s" token has a registered parser rule',
    (tokenName) => {
      expect(hasParserRule(tokenName)).toBe(true);
    }
  );
});
