import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SelfDictAssign)
class SelfDictAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const key = doChild(node, 0, table);
    const value = doChild(node, 1, table);
    return `${node.data.chain}.set(${key},${value});`;
  }
}

export default SelfDictAssignRule;
