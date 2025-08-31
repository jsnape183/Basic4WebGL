import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class RelationNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Relation, data, children);
    this.dataType = builtInTypes.Boolean;
  }
}

export default RelationNode;
