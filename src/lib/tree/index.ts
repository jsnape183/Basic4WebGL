export class Tree {
  public type: number;
  public data: string | Symbol | any;
  public children: Array<Tree> | Tree;

  constructor(
    type: number,
    data: string | Symbol | any | undefined,
    children: Array<Tree> | Tree = new Array<Tree>()
  ) {
    this.type = type;
    this.data = data;
    this.children = Array.isArray(children) ? children : [children];
  }
}

export const node = (
  type: number,
  data: any = null,
  children: Array<Tree> | Tree = new Array<Tree>()
) =>
  new Tree(
    type,
    data,
    Array.isArray(children) ? children : new Array<Tree>(children)
  );

export default node;
