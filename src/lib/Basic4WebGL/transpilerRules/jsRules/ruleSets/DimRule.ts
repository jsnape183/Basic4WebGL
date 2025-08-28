import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Dim)
class DimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return `let ${formatSymbol(node.data)} = createArray([${doChild(
      node,
      0,
      table
    )}]);`;
  }
}

export default DimRule;
