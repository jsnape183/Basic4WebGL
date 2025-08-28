import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

export class ModuleTerm extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.ModuleTerm, data, children);
  }
}
