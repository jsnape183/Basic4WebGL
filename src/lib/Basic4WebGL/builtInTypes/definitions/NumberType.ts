import BuiltInType, { RegisterBuiltInType } from '@CompilerLib/builtInTypes';

@RegisterBuiltInType('Number')
class NumberType extends BuiltInType {
  constructor() {
    super('Number', []);
  }
}
export default NumberType;
