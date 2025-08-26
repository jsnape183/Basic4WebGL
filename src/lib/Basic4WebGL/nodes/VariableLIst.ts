import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

export class VariableList extends Tree implements IGeneratable {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.VariableList, data, children);
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}
