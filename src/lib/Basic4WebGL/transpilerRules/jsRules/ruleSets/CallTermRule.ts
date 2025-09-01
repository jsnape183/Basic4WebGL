import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.CallTerm)
class CallTermRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const child = doChild(node, 0, table);
    return child.substring(1, child.length - 1);
  }
}

export default CallTermRule;
