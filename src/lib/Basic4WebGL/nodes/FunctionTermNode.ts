import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';

class FunctionTermNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionTerm, data, children);
  }
}

export default FunctionTermNode;
