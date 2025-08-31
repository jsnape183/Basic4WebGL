import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';

class MultiplyNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Multiply, data, children);
    this.dataType = builtInTypes.Number;
  }
}

export default MultiplyNode;
