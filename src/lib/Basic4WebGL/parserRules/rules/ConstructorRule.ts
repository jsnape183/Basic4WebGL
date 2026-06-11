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

    // Guard: at most one constructor per class
    if (symbolTable.check('constructor', symbolTypes.Function)) {
      throw new CompilationError('A class may only have one constructor');
    }
    // Register a marker so a second constructor triggers the guard
    symbolTable.addTyped(
      new FunctionSymbol(
        'constructor',
        symbolTypes.Function,
        symbolTable.getScope(),
        symbolTable.getFullScopeName(),
        []
      )
    );

    // Store param count on the class symbol so new ClassName(...) call sites can
    // verify arg count at compile time.
    const classSymbol = symbolTable.get(symbolTable.getScopeName(), symbolTypes.Class);
    classSymbol.constructorArgCount = variables.children.length;

    return new ConstructorDeclNode(
      { className: symbolTable.getScopeName() },
      [variables, new BlockNode(null, children, loc)],
      loc
    );
  }
}

export default ConstructorRule;
