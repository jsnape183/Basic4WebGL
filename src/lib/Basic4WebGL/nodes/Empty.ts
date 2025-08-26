import { Tree } from '../../tree';
import { IGeneratable } from '../../tree/IGeneratable';
import nodeTypes from '../nodeTypes';

export class Empty extends Tree {
  constructor() {
    super(nodeTypes.Empty, undefined);
  }
}
