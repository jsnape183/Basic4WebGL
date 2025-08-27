import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

class VariableDimNode extends Tree implements IGeneratable {
  constructor(data: any | undefined) {
    super(nodeTypes.VariableDim, data, new Array<Tree>());
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}

export default VariableDimNode;
