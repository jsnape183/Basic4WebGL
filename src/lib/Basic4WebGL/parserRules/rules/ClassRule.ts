import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { CompilationError } from '@CompilerLib/errors';
import EmptyNode from '../../nodes/EmptyNode';

@RegisterParserRule('Class')
class ClassRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    if (tokenStream.current().line !== 1) {
      throw new CompilationError(
        'Class declaration must appear at the top of the file'
      );
    }

    matchAndMove(tokens.Class, tokenStream);

    const moduleName = symbolTable.getScopeName();
    const module = symbolTable.get(moduleName, symbolTypes.Module);
    module.setType(symbolTypes.Class);
    module.setScopeType(scopeTypes.Class);
    symbolTable.setCurrentScope(symbolTable.getScopeName(), scopeTypes.Class);

    return new EmptyNode(loc);
  }
}

export default ClassRule;
