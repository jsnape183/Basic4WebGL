import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import FunctionTermNode from '../../../nodes/FunctionTermNode';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.FunctionTerm)
class FunctionTermRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    // A call dispatched through an object instance carries the receiver the
    // call site resolved from the *instance* symbol. Use it verbatim — the
    // method symbol's own scope describes where it was declared, not how to
    // reach it from here (see FunctionTermNode.receiver).
    const receiver = (node as FunctionTermNode).receiver;
    const callee = receiver
      ? `${receiver}.${node.data.name}`
      : formatSymbol(node.data);
    return `${callee}(${doChild(node, 0, table)})`;
  }
}

export default FunctionTermRule;
