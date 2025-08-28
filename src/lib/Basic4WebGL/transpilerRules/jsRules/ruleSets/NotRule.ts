import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Not)
class NotRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `!${doChild(node, 0, table)}`;
  }
}

export default NotRule;
