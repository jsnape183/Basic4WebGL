import Symbols from '../symbols';
import { Tree } from '.';

export interface IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string;
}
