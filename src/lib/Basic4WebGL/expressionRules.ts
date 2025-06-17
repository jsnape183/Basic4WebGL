import tokens from "./tokens";
import node, { Tree } from "../tree";
import nodeTypes from "./nodeTypes";
import boolExpressionRules from "./boolExpressionRules";
import { matchAndMove, check } from "../compiler/rulesHelper";
import TokenStream from "../compiler/tokenStream";
import Symbols from "../symbols";
import { symbolTypes } from "./symbolTypes";

const factors = [tokens.String, tokens.Number, tokens.Variable];

export const expressionRules = {
  Expression: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    let term = null;
    if (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      matchAndMove([tokens.Add, tokens.Subtract], tokenStream);
      term = node(
        nodeTypes.UMinus,
        null,
        expressionRules.Term(tokenStream, symbolTable)
      );
    } else {
      term = expressionRules.Term(tokenStream, symbolTable);
    }

    while (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.Add.value:
          term = expressionRules.Add(term, tokenStream, symbolTable);
          break;
        case tokens.Subtract.value:
          term = expressionRules.Subtract(term, tokenStream, symbolTable);
          break;
        default:
          return node(nodeTypes.Expression, null, term);
      }
    }
    return term;
  },
  Add: (term: Tree, tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.Add, tokenStream);
    const secondary = expressionRules.Term(tokenStream, symbolTable);
    return node(nodeTypes.Add, null, [term, secondary]);
  },
  Subtract: (
    term: Tree,
    tokenStream: TokenStream,
    symbolTable: Symbols
  ): Tree => {
    matchAndMove(tokens.Subtract, tokenStream);
    const secondary = expressionRules.Term(tokenStream, symbolTable);
    return node(nodeTypes.Subtract, null, [term, secondary]);
  },
  Multiply: (
    term: Tree,
    tokenStream: TokenStream,
    symbolTable: Symbols
  ): Tree => {
    matchAndMove(tokens.Multiply, tokenStream);
    const secondary = expressionRules.Term(tokenStream, symbolTable);
    return node(nodeTypes.Multiply, null, [term, secondary]);
  },
  Divide: (
    term: Tree,
    tokenStream: TokenStream,
    symbolTable: Symbols
  ): Tree => {
    matchAndMove(tokens.Divide, tokenStream);
    const secondary = expressionRules.Term(tokenStream, symbolTable);
    return node(nodeTypes.Divide, null, [term, secondary]);
  },
  Term: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    let factor = expressionRules.Factor(tokenStream, symbolTable);
    while (check([tokens.Multiply, tokens.Divide], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.Multiply.value:
          factor = expressionRules.Multiply(factor, tokenStream, symbolTable);
          break;
        case tokens.Divide.value:
          factor = expressionRules.Divide(factor, tokenStream, symbolTable);
          break;
        default:
          return node(nodeTypes.Expression, null, factor);
      }
    }
    return factor;
  },
  FunctionFactor: (
    tokenStream: TokenStream,
    symbolTable: Symbols,
    name: string
  ): Tree => {
    const expr = boolExpressionRules.ExpressionList(tokenStream, symbolTable);

    const functionSymbol = symbolTable.get(name, "Function");
    return node(nodeTypes.FunctionTerm, functionSymbol, expr);
  },
  ModuleFactor: (
    tokenStream: TokenStream,
    symbolTable: Symbols,
    name: string
  ): Tree => {
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    matchAndMove(tokens.Variable, tokenStream);
    const functionName = tokenStream.prev().text;

    const node = boolExpressionRules.FunctionFactor(
      tokenStream,
      symbolTable,
      functionName
    );
    symbolTable.clearScope();
    return node;
  },
  VariableFactor: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text;
    if (
      symbolTable.check(name, symbolTypes.Module) ||
      symbolTable.check(name, symbolTypes.Object)
    ) {
      return expressionRules.ModuleFactor(tokenStream, symbolTable, name);
    }
    if (symbolTable.check(name, symbolTypes.Function)) {
      return expressionRules.FunctionFactor(tokenStream, symbolTable, name);
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
      return node(nodeTypes.Term, symbolTable.get(name), undefined);
    }
    matchAndMove(tokens.OpenParen, tokenStream);
    const elems = boolExpressionRules.ArrayList(tokenStream, symbolTable);
    matchAndMove(tokens.CloseParen, tokenStream);

    return node(nodeTypes.ArrayLookup, symbolTable.get(name, "Array"), elems);
  },
  CallFactor: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.Call, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);
    const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
    matchAndMove(tokens.CloseParen, tokenStream);
    return node(nodeTypes.CallTerm, null, expr);
  },
  Factor: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    if (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      matchAndMove([tokens.Add, tokens.Subtract], tokenStream);
      return node(
        nodeTypes.UMinus,
        null,
        expressionRules.Factor(tokenStream, symbolTable)
      );
    }
    if (check(tokens.OpenParen, tokenStream.current())) {
      matchAndMove(tokens.OpenParen, tokenStream);

      const expr = boolExpressionRules.BoolExpression(tokenStream, symbolTable);
      matchAndMove(tokens.CloseParen, tokenStream);
      return node(nodeTypes.Paren, null, expr);
    }
    if (check(tokens.Call, tokenStream.current())) {
      return expressionRules.CallFactor(tokenStream, symbolTable);
    }
    if (check(tokens.Variable, tokenStream.current())) {
      return expressionRules.VariableFactor(tokenStream, symbolTable);
    }

    matchAndMove(factors, tokenStream);
    return node(nodeTypes.Term, tokenStream.prev().text, undefined);
  },
};

export default expressionRules;
