import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

export class NumberNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Number, data, children);
  }
}
