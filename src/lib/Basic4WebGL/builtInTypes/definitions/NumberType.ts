import { RegisterBuiltInType } from '../../../builtInTypes';
import BuiltInType from '../../../builtInTypes';

@RegisterBuiltInType('Number')
class NumberType extends BuiltInType {
  constructor() {
    super('Number', []);
  }
}
export default NumberType;
