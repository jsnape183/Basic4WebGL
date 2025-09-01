import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.FunctionReturn)
class FunctionReturnRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `return ${doChild(node, 0, table)};`;
  }
}

export default FunctionReturnRule;
