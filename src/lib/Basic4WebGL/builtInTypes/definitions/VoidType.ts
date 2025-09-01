import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

@RegisterBuiltInType('Void')
class VoidType extends BuiltInType {
  constructor() {
    super('Void', []);
  }
}

export default VoidType;
