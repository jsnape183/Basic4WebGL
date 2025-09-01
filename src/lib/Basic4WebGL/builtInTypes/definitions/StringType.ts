import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

@RegisterBuiltInType('String')
class StringType extends BuiltInType {
  constructor() {
    super('String', ['Variant']);
  }
}

export default StringType;
