import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { scopeTypes, symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import FunctionDeclNode from '../nodes/FunctionDeclNode';
import BlockNode from '../nodes/BlockNode';
import { newLines } from '../parserConfig';

@RegisterRule('Function')
class FunctionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Function, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);

    const name = tokenStream.prev().text.toLowerCase();
    const functionSymbol = symbolTable.add(name, symbolTypes.Function);
    matchAndMove(tokens.OpenParen, tokenStream);
    symbolTable.setScope(name, scopeTypes.Function);
    const variables = getRule('VariableList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);
    matchAndMove(newLines, tokenStream);
    const children = getRule('Block').parse(tokenStream, symbolTable, {
      endTokens: tokens.EndFunction,
    });
    matchAndMove(tokens.EndFunction, tokenStream);
    symbolTable.clearScope();
    matchAndMove(newLines, tokenStream);
    return new FunctionDeclNode(functionSymbol, [
      variables,
      new BlockNode(null, children),
    ]);
  }
}

export default FunctionRule;
