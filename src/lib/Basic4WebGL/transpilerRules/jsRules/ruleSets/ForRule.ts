import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.For)
class ForRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `for(${doChild(node, 0, table)}){${doChild(node, 1, table)}}`;
  }
}

export default ForRule;
