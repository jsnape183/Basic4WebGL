import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayList)
class ArrayListRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return concatChildren(node, '][', table);
  }
}

export default ArrayListRule;
