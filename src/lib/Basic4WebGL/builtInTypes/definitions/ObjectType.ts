import { RegisterBuiltInType } from '../../../builtInTypes';
import BuiltInType from '../../../builtInTypes';

@RegisterBuiltInType('Object')
class ObjectType extends BuiltInType {
  fullName: string = '';
  constructor(fullName: string) {
    super('Object', []);
    this.fullName = fullName;
  }

  objectEquals(typeName: string): boolean {
    return this.fullName === typeName;
  }
}

export default ObjectType;
