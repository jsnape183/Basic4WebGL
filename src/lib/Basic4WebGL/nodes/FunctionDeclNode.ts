import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

class FunctionDeclNode extends Tree implements IGeneratable {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.FunctionDecl, data, children);
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}

export default FunctionDeclNode;
