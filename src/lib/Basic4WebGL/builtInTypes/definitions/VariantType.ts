import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

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
