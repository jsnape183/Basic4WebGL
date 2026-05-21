import BuiltInType from '../builtInTypes';
import { SourceLocation } from '../compiler/types';

export class Tree {
  public type: number;
  public data: string | Symbol | any;
  public children: Array<Tree>;
  public dataType: BuiltInType;
  public loc?: SourceLocation;

  constructor(
    type: number,
    data: string | Symbol | any | undefined,
    children: Array<Tree> | Tree = new Array<Tree>(),
    dataType: BuiltInType = new BuiltInType('Unknown')
  ) {
    this.type = type;
    this.data = data;
    this.children = Array.isArray(children) ? children : [children];
    this.dataType = dataType;
  }
}

export const node = (
  type: number,
  data: any = null,
  children: Array<Tree> | Tree = new Array<Tree>(),
  loc?: SourceLocation
) => {
  const t = new Tree(
    type,
    data,
    Array.isArray(children) ? children : new Array<Tree>(children)
  );
  t.loc = loc;
  return t;
};

export default node;
