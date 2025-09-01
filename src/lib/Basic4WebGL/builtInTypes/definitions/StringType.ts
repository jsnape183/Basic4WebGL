import { RegisterBuiltInType } from '../../../builtInTypes';
import BuiltInType from '../../../builtInTypes';

@RegisterBuiltInType('String')
class StringType extends BuiltInType {
  constructor() {
    super('String', ['Variant']);
  }
}

export default StringType;
