import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.PropertyAssign)
class PropertyAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `${node.data.chain} = ${doChild(node, 0, table)};`;
  }
}

export default PropertyAssignRule;
