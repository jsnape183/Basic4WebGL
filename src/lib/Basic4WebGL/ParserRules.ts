import tokens from "./tokens";
import node from "../tree";
import nodeTypes from "./nodeTypes";
import { check, matchAndMove } from "../compiler/rulesHelper";
import boolExpressionRules from "./boolExpressionRules";
import { scopeTypes, symbolTypes } from "./symbolTypes";
import TokenStream from "../compiler/tokenStream";
import Symbols from "../symbols";
import { TokenMatch } from "../lexer/Token";

const newLines = [tokens.NewLine, tokens.EndOfFile, tokens.SoftNewLine];

export const parserRules: Record<string, Function> = {
  Root: (name: string, tokenStream: TokenStream, symbolTable: Symbols) => {
    const children = [];
    symbolTable.add(name, symbolTypes.Module);

    symbolTable.setScope(name);
    while (!check(tokens.EndOfFile, tokenStream.current())) {
      const child = parserRules[tokenStream.current().token.name](
        tokenStream,
        symbolTable
      );

      if (!child) continue;
      children.push(child);
    }
    const returnNode = node(nodeTypes.Root, symbolTable.getScope(), children);
    symbolTable.clearScope();
    return returnNode;
  },
  Block: (
    endTokens: TokenMatch | Array<TokenMatch>,
    tokenStream: TokenStream,
    symbolTable: Symbols
  ) => {
    const children = [];
    while (!check(endTokens, tokenStream.current())) {
      const child = parserRules[tokenStream.current().token.name](
        tokenStream,
        symbolTable
      );
      if (!child) continue;
      children.push(child);
    }
    return node(nodeTypes.Block, null, children);
  },
  NewLine: (tokenStream: TokenStream) =>
    matchAndMove(tokens.NewLine, tokenStream),
  Print: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Print, tokenStream);
    const printNode = node(
      nodeTypes.Print,
      null,
      parserRules.BoolExpression(tokenStream, symbolTable)
    );
    matchAndMove(newLines, tokenStream);
    return printNode;
  },
  VariableList: (tokenStream: TokenStream, symbolTable: Symbols) => {
    const list = [];
    while (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
      const paramSymbol = symbolTable.add(
        tokenStream.prev().text,
        symbolTypes.Parameter
      );
      list.push(node(nodeTypes.Term, paramSymbol, undefined));
      if (!check(tokens.Comma, tokenStream.current())) break;
      matchAndMove(tokens.Comma, tokenStream);
    }

    return node(nodeTypes.VariableList, null, list);
  },
  Function: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Function, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);

    const name = tokenStream.prev().text.toLowerCase();
    const functionSymbol = symbolTable.add(name, symbolTypes.Function);
    matchAndMove(tokens.OpenParen, tokenStream);
    symbolTable.setScope(name, scopeTypes.Function);
    const variables = parserRules.VariableList(tokenStream, symbolTable);
    matchAndMove(tokens.CloseParen, tokenStream);
    matchAndMove(newLines, tokenStream);
    const children = parserRules.Block(
      tokens.EndFunction,
      tokenStream,
      symbolTable
    );
    matchAndMove(tokens.EndFunction, tokenStream);
    symbolTable.clearScope();
    matchAndMove(newLines, tokenStream);
    return node(nodeTypes.FunctionDecl, functionSymbol, [
      variables,
      node(nodeTypes.Block, null, children),
    ]);
  },
  Call: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Call, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);
    const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(tokens.CloseParen, tokenStream);
    matchAndMove(newLines, tokenStream);
    return node(nodeTypes.Call, null, expr);
  },
  FunctionCall: (
    tokenStream: TokenStream,
    symbolTable: Symbols,
    functionSymbol: Symbol
  ) => {
    const expressions = boolExpressionRules.ExpressionList(
      tokenStream,
      symbolTable
    );
    matchAndMove(newLines, tokenStream);
    return node(nodeTypes.FunctionCall, functionSymbol, expressions);
  },
  Return: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Return, tokenStream);
    const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);
    return node(nodeTypes.FunctionReturn, null, expr);
  },
  Module: (
    tokenStream: TokenStream,
    symbolTable: Symbols,
    name: string
  ): Tree => {
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    matchAndMove(tokens.Variable, tokenStream);
    const functionName = tokenStream.prev().text;
    const functionSymbol = symbolTable.get(functionName, symbolTypes.Function);

    const node = parserRules.FunctionCall(
      tokenStream,
      symbolTable,
      functionSymbol
    );
    symbolTable.clearScope();
    return node;
  },
  Variable: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    console.log(symbolTable.check(name, symbolTypes.Module));
    if (
      symbolTable.check(name, symbolTypes.Module) ||
      symbolTable.check(name, symbolTypes.Object)
    ) {
      return parserRules.Module(tokenStream, symbolTable, name);
    }

    if (symbolTable.check(name, symbolTypes.Function)) {
      const functionSymbol = symbolTable.get(name, "Function");
      return parserRules.FunctionCall(tokenStream, symbolTable, functionSymbol);
    }
    if (symbolTable.check(name, symbolTypes.Array)) {
      const dims = boolExpressionRules.ExpressionList(tokenStream, symbolTable);
      matchAndMove(tokens.Equals, tokenStream);
      const expr = parserRules.BoolExpression(tokenStream, symbolTable);
      matchAndMove(newLines, tokenStream);
      const arraySymbol = symbolTable.get(name, "Array");
      return node(nodeTypes.ArrayAssign, arraySymbol, [dims, expr]);
    }
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = parserRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);
    return node(nodeTypes.Assign, varSymbol, expr);
  },
  Dim: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Dim, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (check(tokens.As, tokenStream.current())) {
      matchAndMove(tokens.As, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const module = symbolTable.get(
        tokenStream.prev().text,
        symbolTypes.Module
      );
      const object = symbolTable.clone(name, module, symbolTypes.Object);

      return node(nodeTypes.Clone, { object, module });
    }

    if (!check(tokens.OpenParen, tokenStream.current())) {
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return node(nodeTypes.VariableDim, varSymbol);
    }
    const arraySymbol = symbolTable.add(name, symbolTypes.Array);
    const dims = boolExpressionRules.ExpressionList(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);

    return node(nodeTypes.Dim, arraySymbol, dims);
  },
  While: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.While, tokenStream);
    const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);
    const block = parserRules.Block(tokens.EndWhile, tokenStream, symbolTable);
    matchAndMove(tokens.EndWhile, tokenStream);
    matchAndMove(newLines, tokenStream);

    return node(nodeTypes.While, null, [expr, block]);
  },
  If: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.If, tokenStream);
    const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);
    const block = parserRules.Block(tokens.EndIf, tokenStream, symbolTable);
    matchAndMove(tokens.EndIf, tokenStream);
    matchAndMove(newLines, tokenStream);

    return node(nodeTypes.If, null, [expr, block]);
  },
  For: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.For, tokenStream);
    const expr = parserRules.ForExpression(tokenStream, symbolTable);
    matchAndMove(newLines, tokenStream);
    const block = parserRules.Block(tokens.Next, tokenStream, symbolTable);
    matchAndMove(tokens.Next, tokenStream);
    matchAndMove(newLines, tokenStream);

    return node(nodeTypes.For, null, [expr, block]);
  },
  ForExpression: (tokenStream: TokenStream, symbolTable: Symbols) => {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    symbolTable.add(name, symbolTypes.Variable);
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return node(nodeTypes.In, { var: name, iterator }, []);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const startExpr = boolExpressionRules.BoolExpression(
      tokenStream,
      symbolTable
    );
    matchAndMove(tokens.To, tokenStream);
    const endExpr = boolExpressionRules.BoolExpression(
      tokenStream,
      symbolTable
    );
    return node(nodeTypes.To, name, [startExpr, endExpr]);
  },
  ...boolExpressionRules,
};

export default parserRules;
