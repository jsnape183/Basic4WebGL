import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import BaseConditionalValidatorNode from '../validators/BaseConditionalValidatorNode';

class IfNode extends BaseConditionalValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.If, data, children);
  }
}

export default IfNode;
