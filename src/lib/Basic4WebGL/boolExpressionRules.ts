import tokens from "./tokens";
import node, { Tree } from "../tree";
import nodeTypes from "./nodeTypes";
import expressionRules from "./expressionRules";
import { matchAndMove, check } from "../compiler/rulesHelper";
import TokenStream from "../compiler/tokenStream";
import Symbols from "../symbols";

const booleans = [tokens.BoolTrue, tokens.BoolFalse];
const relOps = [
  tokens.Equals,
  tokens.GreaterThan,
  tokens.GreaterThanEqualTo,
  tokens.LessThan,
  tokens.LessThanEqualTo,
];

export const boolExpressionRules = {
  ...expressionRules,
  BoolExpression: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    let term = boolExpressionRules.Not(tokenStream, symbolTable);

    while (check([tokens.And, tokens.Or], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.And.value:
          term = boolExpressionRules.And(term, tokenStream, symbolTable);
          break;
        case tokens.Or.value:
          term = boolExpressionRules.Or(term, tokenStream, symbolTable);
          break;
        default:
          //console.log("defaulting");
          return term;
      }
    }
    return term;
  },
  ArrayList: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    let expr = [boolExpressionRules.Expression(tokenStream, symbolTable)];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(boolExpressionRules.Expression(tokenStream, symbolTable));
    }
    return node(nodeTypes.ArrayList, null, expr);
  },
  ExpressionList: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.OpenParen, tokenStream);
    if (check(tokens.CloseParen, tokenStream.current())) {
      matchAndMove(tokens.CloseParen, tokenStream);
      return node(nodeTypes.ExpressionList, null, undefined);
    }
    let expr = [boolExpressionRules.Expression(tokenStream, symbolTable)];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(boolExpressionRules.Expression(tokenStream, symbolTable));
    }
    matchAndMove(tokens.CloseParen, tokenStream);
    return node(nodeTypes.ExpressionList, null, expr);
  },
  Or: (term: Tree, tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.Or, tokenStream);
    return node(nodeTypes.Or, null, [
      term,
      boolExpressionRules.BoolTerm(tokenStream, symbolTable),
    ]);
  },
  And: (term: Tree, tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    matchAndMove(tokens.And, tokenStream);
    return node(nodeTypes.And, null, [
      term,
      boolExpressionRules.BoolTerm(tokenStream, symbolTable),
    ]);
  },
  Not: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    if (check(tokens.Not, tokenStream.current())) {
      matchAndMove(tokens.Not, tokenStream);
      return node(
        nodeTypes.Not,
        null,
        boolExpressionRules.BoolFactor(tokenStream, symbolTable)
      );
    }

    return boolExpressionRules.BoolTerm(tokenStream, symbolTable);
  },
  BoolTerm: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    return boolExpressionRules.BoolFactor(tokenStream, symbolTable);
  },
  BoolFactor: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    if (check(booleans, tokenStream.current())) {
      matchAndMove(booleans, tokenStream);
      return node(nodeTypes.Term, tokenStream.prev().text, undefined);
    }
    return boolExpressionRules.Relation(tokenStream, symbolTable);
  },
  Relation: (tokenStream: TokenStream, symbolTable: Symbols): Tree => {
    const left = expressionRules.Expression(tokenStream, symbolTable);
    if (!check(relOps, tokenStream.current())) return left;

    matchAndMove(relOps, tokenStream);
    return node(nodeTypes.Relation, tokenStream.prev().text, [
      left,
      expressionRules.Expression(tokenStream, symbolTable),
    ]);
  },
};

export default boolExpressionRules;
