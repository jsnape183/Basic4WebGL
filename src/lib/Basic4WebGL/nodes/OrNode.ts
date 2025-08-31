import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseBooleanArthrmaticValidatorNode from '../validators/BaseBooleanArithmaticValidatorNode';

class OrNode extends BaseBooleanArthrmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Or, data, children);
    this.dataType = builtInTypes.Boolean;
  }
}

export default OrNode;
