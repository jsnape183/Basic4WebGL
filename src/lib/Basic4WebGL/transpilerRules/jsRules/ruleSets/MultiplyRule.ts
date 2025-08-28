import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Multiply)
class MultiplyRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const left = doChild(node, 0, table);
    const right = doChild(node, 1, table);
    return `${left}*${right}`;
  }
}

export default MultiplyRule;
