import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren, doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayAssign)
class ArrayAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    // node.children[0] is an ExpressionListNode — join each dimension index
    // with '][' so arr(0) → arr[0] and grid(2, 1) → grid[2][1]
    const dimStr = concatChildren(node.children[0], '][', table);
    return `${formatSymbol(node.data)}[${dimStr}]=${doChild(node, 1, table)};`;
  }
}

export default ArrayAssignRule;
