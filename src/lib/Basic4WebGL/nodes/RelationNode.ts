import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class RelationNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Relation, data, children);
  }
}

export default RelationNode;
