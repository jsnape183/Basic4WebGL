import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class FunctionDeclNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.FunctionDecl, data, children);
  }
}

export default FunctionDeclNode;
