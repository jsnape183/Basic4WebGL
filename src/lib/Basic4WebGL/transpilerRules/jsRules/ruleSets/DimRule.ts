import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Dim)
class DimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return `let ${formatSymbol(node.data)} = _createArray([${doChild(
      node,
      0,
      table
    )}]);`;
  }
}

export default DimRule;
