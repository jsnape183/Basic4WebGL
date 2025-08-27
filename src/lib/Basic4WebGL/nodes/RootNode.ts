import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

class RootNode extends Tree implements IGeneratable {
  constructor(data: any | undefined, children: Tree | Array<Tree>) {
    super(nodeTypes.Root, data, children);
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}

export default RootNode;
