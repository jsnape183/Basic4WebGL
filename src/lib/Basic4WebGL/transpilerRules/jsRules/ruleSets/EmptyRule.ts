import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.Empty)
class EmptyRule implements IGeneratable {
  generate(): string {
    return '';
  }
}

export default EmptyRule;
