import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

class CloneNode extends Tree implements IGeneratable {
  constructor(data: any | undefined) {
    super(nodeTypes.Clone, data, new Array<Tree>());
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}

export default CloneNode;
