import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

export class CallTerm extends Tree implements IGeneratable {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.CallTerm, data, children);
  }

  generate(node: Tree, table: Symbols | undefined): string {
    return '';
  }
}
