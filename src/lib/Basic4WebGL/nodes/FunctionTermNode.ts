import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '@CompilerLib/symbols';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionTermNode extends BaseParameterValidatorNode {
  /**
   * Pre-formatted JS expression the call must be made *through*, when the callee
   * is a member of an object instance (e.g. `onenter_s` for `dim s as sprite`
   * declared inside `function onenter()`).
   *
   * Only the declaring call site knows this. A method symbol's own `fullScope`
   * is the *lexical* scope chain recorded when the class's members were cloned
   * into the instance's scope (`main.onenter.s`) — that is a declaration path,
   * not a JS access path, and the two only coincide for module-scoped
   * instances. So whenever a call is dispatched through an instance, the
   * receiver is resolved from the instance's own symbol via `formatSymbol` and
   * passed down here; `undefined` means "an ordinary function/module call —
   * derive the callee from the symbol as usual".
   */
  public receiver?: string;

  constructor(
    data: any | undefined,
    children: Tree,
    loc?: SourceLocation,
    receiver?: string
  ) {
    super(nodeTypes.FunctionTerm, data, children);
    this.dataType =
      (data as Symbol).dataType || getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
    this.receiver = receiver;
  }
}

export default FunctionTermNode;
