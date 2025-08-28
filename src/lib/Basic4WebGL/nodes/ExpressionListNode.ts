import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ExpressionListNode extends Tree {
  constructor(data: any | undefined, children: Tree | Tree[] | undefined) {
    super(nodeTypes.ExpressionList, data, children);
  }
}

export default ExpressionListNode;
