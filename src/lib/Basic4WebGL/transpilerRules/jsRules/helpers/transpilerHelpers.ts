import { scopeTypes, symbolTypes } from '../../../symbolTypes';
import { Tree } from '@CompilerLib/tree';
import Symbols, { Symbol } from '@CompilerLib/symbols';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';

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
  // Global scope: both scope.name and scope.type are empty strings
  if (data.scope.name === '' && data.scope.type === scopeTypes.Globals) {
    return `_${data.name}`;
  }

  if (data.type === symbolTypes.Function) {
    return `${data.fullScope}.${data.name}`;
  }

  if (data.type === symbolTypes.Parameter) {
    return `${data.scope.name}_${data.name}`;
  }

  // Object instances: formatting depends on where they were declared
  if (data.type === symbolTypes.Object) {
    if (data.scope.type === scopeTypes.Function) {
      return `${data.scope.name}_${data.name}`;
    }
    if (data.scope.type === scopeTypes.Constructor) {
      return `this.${data.name}`;
    }
    if (data.scope.type === scopeTypes.Class) {
      return `${prefixClass(data.scope.name)}.prototype.${data.name}`;
    }
    return `${data.scope.name}.${data.name}`;
  }

  if (data.scope.type === scopeTypes.Function) {
    return `${data.scope.name}_${data.name}`;
  }

  if (data.scope.type === scopeTypes.Class) {
    return `${prefixClass(data.scope.name)}.prototype.${data.name}`;
  }

  return `${data.scope.name}.${data.name}`;
};

export const formatFunctionDecl = (
  node: Tree,
  params: string,
  body: string
) => {
  if (node.data.scope.type === scopeTypes.Class) {
    return `${prefixClass(node.data.fullScope)}.prototype.${node.data.name} = function(${params}) {${body}};`;
  }

  return `${node.data.fullScope}.${node.data.name} = (${params}) => {${body}};`;
};

export const prefixClass = (name: string): string => `_sb_${name}`;

export const formatClass = (className: string): string => {
  return `class ${prefixClass(className)}{}`;
};

export const formatRoot = (node: Tree, children: Array<string>, constructorContent?: string, parentName?: string): string => {
  const extendsClause = parentName ? ` extends ${prefixClass(parentName)}` : '';
  const prefixedName = prefixClass(node.data as string);
  const classDecl = constructorContent
    ? `class ${prefixedName}${extendsClause}{ ${constructorContent} }`
    : `class ${prefixedName}${extendsClause}{}`;
  return `${classDecl}
    ${children.join(';')}`;
};
