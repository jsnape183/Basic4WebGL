import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Term)
class TermRule implements IGeneratable {
  generate(node: Tree): string {
    return node.data.name ? formatSymbol(node.data) : node.data;
  }
}

export default TermRule;
