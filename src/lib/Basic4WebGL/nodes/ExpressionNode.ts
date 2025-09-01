import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class ExpressionNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Expression, data, children);
  }
}

export default ExpressionNode;
