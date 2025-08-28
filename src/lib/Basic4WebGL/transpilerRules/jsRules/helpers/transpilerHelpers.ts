import { scopeTypes, symbolTypes } from '../../../symbolTypes';
import { Tree } from '../../../../tree';
import Symbols, { Symbol } from '../../../../symbols';
import { getTranspilerRule } from '../../../../transpiler/transpilerRuleFactory';

export const doChild = (
  node: Tree,
  index: number,
  table: Symbols | undefined
) =>
  getTranspilerRule(node.children[index].type).generate(
    node.children[index],
    table
  );

export const concatChildren = (
  node: Tree,
  join: string = '',
  table: Symbols | undefined
) =>
  node.children
    .map((c) => getTranspilerRule(c.type).generate(c, table))
    .join(join);

export const formatSymbol = (data: Symbol) => {
  if (data.type === symbolTypes.Function || data.type === symbolTypes.Object) {
    return `${data.fullScope}.${data.name}`;
  }

  if (data.type === symbolTypes.Parameter) {
    return `${data.scope.name}_${data.name}`;
  }

  return `${data.scope.name}.${data.name}`;
};

export const formatFunctionDecl = (
  node: Tree,
  params: string,
  body: string
) => {
  if (node.data.scope.type === scopeTypes.Class) {
    return `${node.data.fullScope}.prototype.${node.data.name} = async (${params}) => {${body}};`;
  }

  return `${node.data.fullScope}.${node.data.name} = async (${params}) => {${body}};`;
};

export const formatClass = (className: string): string => {
  return `class ${className}{}`;
};

export const formatRoot = (node: Tree, children: Array<string>) => {
  return `${formatClass(node.data)}
    ${children.join(';')}`;
};
