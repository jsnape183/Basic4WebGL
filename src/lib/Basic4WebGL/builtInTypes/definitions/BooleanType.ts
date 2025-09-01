import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

@RegisterBuiltInType('Boolean')
class BooleanType extends BuiltInType {
  constructor() {
    super('Boolean', ['Number', 'String', 'Variant']);
  }
}

export default BooleanType;
