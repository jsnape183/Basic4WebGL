import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

export class NumberNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Number, data, children);
    this.dataType = builtInTypes.Number;
  }
}
