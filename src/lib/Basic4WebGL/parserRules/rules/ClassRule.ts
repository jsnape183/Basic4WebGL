import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { CompilationError } from '../../../compiler/errors';
import EmptyNode from '../../nodes/EmptyNode';

@RegisterParserRule('Class')
class ClassRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (tokenStream.current().line !== 1) {
      throw new CompilationError(
        'Class declaration must appear at the top of the file',
        tokenStream.current().line,
        tokenStream.current().col,
        tokenStream.current().filename
      );
    }

    matchAndMove(tokens.Class, tokenStream);

    const moduleName = symbolTable.getScopeName();
    const module = symbolTable.get(moduleName, symbolTypes.Module);
    module.setType(symbolTypes.Class);
    module.setScopeType(scopeTypes.Class);
    symbolTable.setCurrentScope(symbolTable.getScopeName(), scopeTypes.Class);

    return new EmptyNode();
  }
}

export default ClassRule;
