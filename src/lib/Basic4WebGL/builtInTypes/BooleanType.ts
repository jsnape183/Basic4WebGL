import builtInTypes from '.';
import BuiltInType from '../../builtInTypes';

class BooleanType extends BuiltInType {
  constructor() {
    super('Boolean', [
      builtInTypes.Number,
      builtInTypes.String,
      builtInTypes.Variant,
    ]);
  }
}

export default BooleanType;
