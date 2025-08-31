import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import BaseConditionalValidatorNode from '../validators/BaseConditionalValidatorNode';

class WhileNode extends BaseConditionalValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.While, data, children);
  }
}

export default WhileNode;
