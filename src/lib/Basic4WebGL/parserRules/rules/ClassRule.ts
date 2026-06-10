import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
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
import { newLines } from '../../parserConfig';

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

    // Optionally consume the class name (e.g. "Class Enemy") — ignored,
    // the class name is always the file name set by RootRule.
    if (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
    }

    // Upgrade current module symbol → class
    const moduleName = symbolTable.getScopeName();
    const module = symbolTable.get(moduleName, symbolTypes.Module);
    module.setType(symbolTypes.Class);
    module.setScopeType(scopeTypes.Class);
    symbolTable.setCurrentScope(symbolTable.getScopeName(), scopeTypes.Class);

    // Optionally parse "extends ParentName"
    if (check(tokens.Extends, tokenStream.current())) {
      matchAndMove(tokens.Extends, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const parentName = tokenStream.prev().text.toLowerCase();

      if (!symbolTable.check(parentName, symbolTypes.Class)) {
        throw new CompilationError(
          `Class '${parentName}' has not been declared yet`
        );
      }
      const parentSymbol = symbolTable.get(parentName, symbolTypes.Class);
      if (parentSymbol.parentClassName) {
        throw new CompilationError(
          `'${parentName}' already extends '${parentSymbol.parentClassName}' — inheritance cannot be chained`
        );
      }

      module.parentClassName = parentName;
    }

    if (check(newLines, tokenStream.current())) {
      matchAndMove(newLines, tokenStream);
    }

    return new EmptyNode(loc);
  }
}

export default ClassRule;
