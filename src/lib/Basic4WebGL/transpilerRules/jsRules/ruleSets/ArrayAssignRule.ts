import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { concatChildren, doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayAssign)
class ArrayAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    // node.children[0] is an ExpressionListNode — join each dimension index
    // with '][' so arr(0) → arr[0] and grid(2, 1) → grid[2][1]
    const dimStr = concatChildren(node.children[0], '][', table);
    const value = doChild(node, 1, table);
    const isLooselyTyped = node.data.type === symbolTypes.Variable;
    const dimensionCount = node.children[0].children.length;
    if (isLooselyTyped && dimensionCount === 1) {
      return `_sbCheckedArraySet(${formatSymbol(node.data)},${dimStr},${value},"${node.data.name}");`;
    }
    return `${formatSymbol(node.data)}[${dimStr}]=${value};`;
  }
}

export default ArrayAssignRule;
