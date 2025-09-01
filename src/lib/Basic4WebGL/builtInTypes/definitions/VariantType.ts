import { RegisterBuiltInType } from '../../../builtInTypes';
import BuiltInType from '../../../builtInTypes';

@RegisterBuiltInType('Variant')
class VariantType extends BuiltInType {
  constructor() {
    super('Variant', []);
  }
  canAccept(): boolean {
    return true;
  }
}

export default VariantType;
