import BooleanType from './BooleanType';
import NumberType from './NumberType';
import StringType from './StringType';
import VariantType from './VariantType';
import VoidType from './VoidType';

export default {
  Boolean: new BooleanType(),
  Number: new NumberType(),
  String: new StringType(),
  Variant: new VariantType(),
  Void: new VoidType(),
};
