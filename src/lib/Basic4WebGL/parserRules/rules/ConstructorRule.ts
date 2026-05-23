import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import ConstructorDeclNode from '../../nodes/ConstructorDeclNode';
import BlockNode from '../../nodes/BlockNode';
import { newLines } from '../../parserConfig';
import { CompilationError } from '@CompilerLib/errors';

@RegisterParserRule('Constructor')
class ConstructorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    if (symbolTable.getScopeType() !== scopeTypes.Class) {
      throw new CompilationError('Constructor must be declared inside a class');
    }

    matchAndMove(tokens.Constructor, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);

    symbolTable.setScope('constructor', scopeTypes.Constructor);
    let variables: Tree;
    let children: Tree;
    try {
      variables = getParserRule('VariableList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseParen, tokenStream);
      matchAndMove(newLines, tokenStream);
      children = getParserRule('Block').parse(tokenStream, symbolTable, {
        endTokens: tokens.EndConstructor,
      });
      matchAndMove(tokens.EndConstructor, tokenStream);
    } finally {
      symbolTable.clearScope();
    }
    matchAndMove(newLines, tokenStream);

    return new ConstructorDeclNode(
      { className: symbolTable.getScopeName() },
      [variables, new BlockNode(null, children, loc)],
      loc
    );
  }
}

export default ConstructorRule;
