import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.Empty)
class EmptyRule implements IGeneratable {
  generate(): string {
    return '';
  }
}

export default EmptyRule;
