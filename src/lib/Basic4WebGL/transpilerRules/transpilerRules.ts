import nodeTypes from '../nodeTypes';
import { scopeTypes, symbolTypes } from '../symbolTypes';
import { Tree } from '../../tree';
import Symbols, { Symbol } from '../../symbols';

const doChild = (
  rules: Record<string, Function>,
  node: Tree,
  index: number,
  table: Symbols
) => rules[node.children[index].type](node.children[index], table);

const concatChildren = (
  rules: Record<string, Function>,
  node: Tree,
  join: string = '',
  table: Symbols
) => node.children.map((c) => rules[c.type](c, table)).join(join);

const formatSymbol = (data: Symbol) => {
  if (data.type === symbolTypes.Function || data.type === symbolTypes.Object) {
    return `${data.fullScope}.${data.name}`;
  }

  if (data.type === symbolTypes.Parameter) {
    return `${data.scope.name}_${data.name}`;
  }

  return `${data.scope.name}.${data.name}`;
};

const formatFunctionDecl = (node: Tree, params: string, body: string) => {
  if (node.data.scope.type === scopeTypes.Class) {
    return `${node.data.fullScope}.prototype.${node.data.name} = async (${params}) => {${body}};`;
  }

  return `${node.data.fullScope}.${node.data.name} = async (${params}) => {${body}};`;
};

const formatClass = (className: string): string => {
  return `class ${className}{}`;
};

const formatRoot = (node: Tree, children: Array<string>) => {
  return `${formatClass(node.data)}
    ${children.join(';')}`;
};

export const transpilerRules: Record<number, Function> = {
  [nodeTypes.Empty]: (): string => ``,
  [nodeTypes.Root]: (node: Tree, table: Symbols): string => {
    const children = node.children.map(
      (n) => `${transpilerRules[n.type](n, table)}`
    );
    return formatRoot(node, children);
  },
  [nodeTypes.Block]: (node: Tree, table: Symbols): string => {
    let output = '';
    node.children.forEach((n) => {
      output = `${output}${transpilerRules[n.type](n, table)}
      `;
    });
    return output;
  },
  [nodeTypes.Print]: (node: Tree, table: Symbols): string => {
    const value = doChild(transpilerRules, node, 0, table);
    return `console.log(${value});`;
  },
  [nodeTypes.Call]: (node: Tree, table: Symbols): string => {
    const child = doChild(transpilerRules, node, 0, table);
    return child.substring(1, child.length - 1);
  },

  [nodeTypes.CallTerm]: (node: Tree, table: Symbols): string => {
    const child = doChild(transpilerRules, node, 0, table);
    return child.substring(1, child.length - 1);
  },
  [nodeTypes.Expression]: (node: Tree, table: Symbols): string =>
    doChild(transpilerRules, node, 0, table),
  [nodeTypes.Add]: (node: Tree, table: Symbols): string => {
    const left = doChild(transpilerRules, node, 0, table);
    const right = doChild(transpilerRules, node, 1, table);
    return `${left}+${right}`;
  },
  [nodeTypes.Subtract]: (node: Tree, table: Symbols): string => {
    const left = doChild(transpilerRules, node, 0, table);
    const right = doChild(transpilerRules, node, 1, table);
    return `${left}-${right}`;
  },
  [nodeTypes.UMinus]: (node: Tree, table: Symbols): string => {
    const value = doChild(transpilerRules, node, 0, table);
    return `-${value}`;
  },
  [nodeTypes.Multiply]: (node: Tree, table: Symbols): string => {
    const left = doChild(transpilerRules, node, 0, table);
    const right = doChild(transpilerRules, node, 1, table);
    return `${left}*${right}`;
  },
  [nodeTypes.Divide]: (node: Tree, table: Symbols): string => {
    const left = doChild(transpilerRules, node, 0, table);
    const right = doChild(transpilerRules, node, 1, table);
    return `${left}/${right}`;
  },
  [nodeTypes.Paren]: (node: Tree, table: Symbols): string =>
    `(${doChild(transpilerRules, node, 0, table)})`,
  [nodeTypes.Term]: (node: Tree): string =>
    node.data.name ? formatSymbol(node.data) : node.data,
  [nodeTypes.VariableDim]: (node: Tree): string => {
    if (node.data.scopeType === scopeTypes.Class) {
      return `${`${node.data.scope.name}.prototype.${node.data.name}`} = undefined;`;
    }

    return `${`${node.data.scope.name}.${node.data.name}`} = undefined;`;
  },
  [nodeTypes.Dim]: (node: Tree, table: Symbols): string =>
    `let ${formatSymbol(node.data)} = createArray([${doChild(
      transpilerRules,
      node,
      0,
      table
    )}]);`,
  [nodeTypes.Clone]: (node: Tree) =>
    `${formatSymbol(node.data.object)} = new ${node.data.module.name}();`,
  [nodeTypes.VariableList]: (node: Tree, table: Symbols): string =>
    `${concatChildren(transpilerRules, node, ',', table)}`,
  [nodeTypes.FunctionDecl]: (node: Tree, table: Symbols): string => {
    const params = doChild(transpilerRules, node, 0, table);

    const body = `
    ${doChild(transpilerRules, node, 1, table)};`;

    return formatFunctionDecl(node, params, body);
  },
  [nodeTypes.FunctionCall]: (node: Tree, table: Symbols): string =>
    `await ${formatSymbol(node.data)}(${doChild(
      transpilerRules,
      node,
      0,
      table
    )});`,
  [nodeTypes.FunctionTerm]: (node: Tree, table: Symbols): string =>
    `await ${formatSymbol(node.data)}(${doChild(
      transpilerRules,
      node,
      0,
      table
    )})`,
  [nodeTypes.FunctionReturn]: (node: Tree, table: Symbols): string =>
    `return ${doChild(transpilerRules, node, 0, table)};`,
  [nodeTypes.ArrayLookup]: (node: Tree, table: Symbols): string =>
    `${formatSymbol(node.data)}[${doChild(transpilerRules, node, 0, table)}]`,
  [nodeTypes.ExpressionList]: (node: Tree, table: Symbols): string =>
    concatChildren(transpilerRules, node, ',', table),
  [nodeTypes.ArrayList]: (node: Tree, table: Symbols): string =>
    concatChildren(transpilerRules, node, '][', table),
  [nodeTypes.Assign]: (node: Tree, table: Symbols): string =>
    `${formatSymbol(node.data)} = ${doChild(transpilerRules, node, 0, table)};`,
  [nodeTypes.ArrayAssign]: (node: Tree, table: Symbols): string =>
    `${formatSymbol(node.data)}[${doChild(
      transpilerRules,
      node,
      0,
      table
    )}]=${doChild(transpilerRules, node, 1, table)};`,
  [nodeTypes.And]: (node: Tree, table: Symbols): string =>
    `${doChild(transpilerRules, node, 0, table)}&&${doChild(
      transpilerRules,
      node,
      1,
      table
    )}`,
  [nodeTypes.Or]: (node: Tree, table: Symbols): string =>
    `${doChild(transpilerRules, node, 0, table)}||${doChild(
      transpilerRules,
      node,
      1,
      table
    )}`,
  [nodeTypes.Not]: (node: Tree, table: Symbols): string =>
    `!${doChild(transpilerRules, node, 0, table)}`,
  [nodeTypes.Relation]: (node: Tree, table: Symbols): string =>
    `${doChild(transpilerRules, node, 0, table)}${
      node.data === '=' ? '==' : node.data
    }${doChild(transpilerRules, node, 1, table)}`,
  [nodeTypes.While]: (node: Tree, table: Symbols): string =>
    `while(${doChild(transpilerRules, node, 0, table)}){${doChild(
      transpilerRules,
      node,
      1,
      table
    )}}`,
  [nodeTypes.If]: (node: Tree, table: Symbols): string =>
    `if(${doChild(transpilerRules, node, 0, table)}){${doChild(
      transpilerRules,
      node,
      1,
      table
    )}}`,
  [nodeTypes.For]: (node: Tree, table: Symbols): string =>
    `for(${doChild(transpilerRules, node, 0, table)}){${doChild(
      transpilerRules,
      node,
      1,
      table
    )}}`,
  [nodeTypes.To]: (node: Tree, table: Symbols): string =>
    `${formatSymbol(node.data)} = ${doChild(
      transpilerRules,
      node,
      0,
      table
    )}; ${node.data} <= ${doChild(transpilerRules, node, 1, table)}; ${
      node.data
    }++`,
  [nodeTypes.In]: (node: Tree): string =>
    `${node.data.var} of ${node.data.iterator}`,
};

export default transpilerRules;
