import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.In)
class InRule implements IGeneratable {
  generate(node: Tree): string {
    return `${node.data.var} of ${node.data.iterator}`;
  }
}

export default InRule;
