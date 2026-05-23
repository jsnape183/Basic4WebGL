import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

@RegisterBuiltInType('Number')
class NumberType extends BuiltInType {
  constructor() {
    super('Number', ['Variant']);
  }
}
export default NumberType;
