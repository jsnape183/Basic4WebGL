import { RegisterBuiltInType } from '../../../builtInTypes';
import BuiltInType from '../../../builtInTypes';

@RegisterBuiltInType('Void')
class VoidType extends BuiltInType {
  constructor() {
    super('Void', []);
  }
}

export default VoidType;
