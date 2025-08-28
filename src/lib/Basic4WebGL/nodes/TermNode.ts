import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class TermNode extends Tree {
  constructor(data: any | undefined, children: Tree[] | undefined) {
    super(nodeTypes.Term, data, children);
  }
}

export default TermNode;
