import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.PropertyTerm)
class PropertyTermRule implements IGeneratable {
  generate(node: Tree): string {
    return node.data as string;
  }
}

export default PropertyTermRule;
