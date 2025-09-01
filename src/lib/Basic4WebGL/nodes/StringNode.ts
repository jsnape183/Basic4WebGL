import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class StringNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.String, data, []);
    this.dataType = getBuiltInType(builtInTypes.String);
  }
}

export default StringNode;
