import { describe, test, expect } from 'vitest';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Tree } from '@CompilerLib/tree';
import PrintNode from '@Basic4WebGL/nodes/PrintNode';
import '@Basic4WebGL/builtInTypes';

const makeChild = (dataType: BuiltInType) => {
  const t = new Tree(0, null, []);
  t.dataType = dataType;
  return t;
};

// Roadmap issue #3: PrintNode.validate()'s throw branch had no test. It's
// genuinely unreachable today — VariantType.canAccept() (registered as the
// 'Variant' built-in type) unconditionally returns true, so the throw can
// never actually fire through any real program, and there's no supported
// way to fake a different dataType through canAccept without replacing
// VariantType itself. What's actually testable, and worth pinning, is the
// positive path: validate() must not throw for any dataType a real print
// argument could carry, since Variant accepts everything.
describe('PrintNode.validate()', () => {
  test('does not throw for a Variant-typed argument', () => {
    const n = new PrintNode(null, makeChild(new BuiltInType('Variant')), undefined);
    expect(() => n.validate()).not.toThrow();
  });

  test('does not throw for a String-typed argument', () => {
    const n = new PrintNode(null, makeChild(new BuiltInType('String')), undefined);
    expect(() => n.validate()).not.toThrow();
  });

  test('does not throw for a Number-typed argument', () => {
    const n = new PrintNode(null, makeChild(new BuiltInType('Number')), undefined);
    expect(() => n.validate()).not.toThrow();
  });

  test('does not throw for a Boolean-typed argument', () => {
    const n = new PrintNode(null, makeChild(new BuiltInType('Boolean')), undefined);
    expect(() => n.validate()).not.toThrow();
  });
});
