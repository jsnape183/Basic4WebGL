import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Expression)
class ExpressionRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return doChild(node, 0, table);
  }
}

export default ExpressionRule;
