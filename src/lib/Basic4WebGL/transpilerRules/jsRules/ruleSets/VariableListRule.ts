import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.VariableList)
class VariableListRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return `${concatChildren(node, ',', table)}`;
  }
}

export default VariableListRule;
