import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { ArraySymbol, DictionarySymbol, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import VariableListNode from '../../nodes/VariableLIstNode';
import TermNode from '../../nodes/TermNode';
import VariableNode from '../../nodes/VariableNode';
import { CompilationError } from '@CompilerLib/errors';

@RegisterParserRule('VariableList')
class VariableListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    const list: Tree[] = [];
    const paramSymbols: any[] = [];

    while (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
      const name = tokenStream.prev().text;
      if (symbolTable.check(name.toLowerCase(), symbolTypes.Constant)) {
        throw new CompilationError(
          `'${name.toLowerCase()}' is a constant and cannot be used as a parameter name.`
        );
      }
      let sym: any;

      if (check(tokens.OpenParen, tokenStream.current())) {
        // arr() or arr() as ClassName — array param
        matchAndMove(tokens.OpenParen, tokenStream);
        matchAndMove(tokens.CloseParen, tokenStream);
        sym = symbolTable.addTyped(
          new ArraySymbol(
            name,
            symbolTypes.Array,
            symbolTable.getScope(),
            symbolTable.getFullScopeName(),
            1
          )
        );
        if (check(tokens.As, tokenStream.current())) {
          matchAndMove(tokens.As, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const classSymbol = symbolTable.get(
            tokenStream.prev().text,
            symbolTypes.Class
          );
          sym.classSymbol = classSymbol;
        }

      } else if (check(tokens.OpenBracket, tokenStream.current())) {
        // d[] or d[] as ClassName — dict param
        matchAndMove(tokens.OpenBracket, tokenStream);
        matchAndMove(tokens.CloseBracket, tokenStream);
        sym = symbolTable.addTyped(
          new DictionarySymbol(
            name,
            symbolTypes.Dictionary,
            symbolTable.getScope(),
            symbolTable.getFullScopeName()
          )
        );
        if (check(tokens.As, tokenStream.current())) {
          matchAndMove(tokens.As, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const classSymbol = symbolTable.get(
            tokenStream.prev().text,
            symbolTypes.Class
          );
          sym.classSymbol = classSymbol;
        }

      } else if (check(tokens.As, tokenStream.current())) {
        // a as ClassName — typed scalar param
        matchAndMove(tokens.As, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const classSymbol = symbolTable.get(
          tokenStream.prev().text,
          symbolTypes.Class
        );
        sym = symbolTable.clone(name, classSymbol, symbolTypes.Object);
        sym.classSymbol = classSymbol;

        // Pull in inherited members so method calls on the param compile
        let ancestor = classSymbol;
        while (ancestor.parentClassName) {
          symbolTable.mergeSymbolsIntoScope(name, ancestor.parentClassName);
          ancestor = symbolTable.get(ancestor.parentClassName, symbolTypes.Class);
        }

      } else {
        // Plain variant param — unchanged
        sym = symbolTable.add(name, symbolTypes.Parameter);
      }

      sym.isParam = true;
      paramSymbols.push(sym);
      list.push(new TermNode(sym, new VariableNode(name), loc));

      if (!check(tokens.Comma, tokenStream.current())) break;
      matchAndMove(tokens.Comma, tokenStream);
    }

    return new VariableListNode({ params: paramSymbols }, list, loc);
  }
}

export default VariableListRule;
