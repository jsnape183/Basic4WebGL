import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { FunctionSymbol, scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import FunctionDeclNode from '../../nodes/FunctionDeclNode';
import BlockNode from '../../nodes/BlockNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Function')
class FunctionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Function, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);

    const name = tokenStream.prev().text.toLowerCase();
    matchAndMove(tokens.OpenParen, tokenStream);
    symbolTable.setScope(name, scopeTypes.Function);
    let variables: Tree;
    let parameters: ReturnType<typeof symbolTable.getAll>;
    let children: Tree;
    try {
      variables = getParserRule('VariableList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      parameters = symbolTable.getAll(
        symbolTypes.Parameter,
        symbolTable.getScope()
      );
      matchAndMove(tokens.CloseParen, tokenStream);
      matchAndMove(newLines, tokenStream);
      children = getParserRule('Block').parse(tokenStream, symbolTable, {
        endTokens: tokens.EndFunction,
      });
      matchAndMove(tokens.EndFunction, tokenStream);
    } finally {
      symbolTable.clearScope();
    }
    matchAndMove(newLines, tokenStream);
    const functionSymbol = symbolTable.addTyped(
      new FunctionSymbol(
        name,
        symbolTypes.Function,
        symbolTable.getScope(),
        symbolTable.getFullScopeName(),
        parameters
      )
    );
    return new FunctionDeclNode(functionSymbol, [
      variables,
      new BlockNode(null, children),
    ]);
  }
}

export default FunctionRule;
