import BuiltInType from '../builtInTypes';
import { SourceLocation } from '../compiler/types';

/**
 * Roadmap issue #4: this constructor does not accept or set `loc` — a
 * `new Tree(...)` call leaves `.loc` `undefined` until something sets it
 * afterward. Every node subclass in this codebase follows the same
 * convention to compensate (`super(...); this.loc = loc;` in the
 * subclass's own constructor — see any file under `Basic4WebGL/nodes/`),
 * which is why the pattern is safe in practice today. But it *is* an easy
 * mistake for a direct `new Tree(...)` call site (rather than a subclass)
 * to silently drop `loc` by forgetting that extra assignment, with no
 * compiler warning. Prefer the `node()` factory below for ad-hoc tree
 * construction — it takes `loc` as a parameter and sets it for you.
 */
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
