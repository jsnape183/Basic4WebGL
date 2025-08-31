import BuiltInType from '../../builtInTypes';

class VariantType extends BuiltInType {
  constructor() {
    super('Variant', []);
  }
  canAccept(): boolean {
    return true;
  }
}

export default VariantType;
