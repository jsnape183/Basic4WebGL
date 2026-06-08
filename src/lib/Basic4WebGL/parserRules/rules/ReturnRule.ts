import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import FunctionReturnNode from '../../nodes/FunctionReturnNode';
import { newLines } from '../../parserConfig';
import { CompilationError } from '@CompilerLib/errors';
import { scopeTypes } from '../../symbolTypes';

@RegisterParserRule('Return')
class ReturnRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    const scope = symbolTable.getScopeType();
    if (scope !== scopeTypes.Function && scope !== scopeTypes.Constructor) {
      throw new CompilationError('Return statement must be inside a function or constructor');
    }
    matchAndMove(tokens.Return, tokenStream);
    if (check(newLines, tokenStream.current())) {
      matchAndMove(newLines, tokenStream);
      return new FunctionReturnNode(null, undefined, loc);
    }
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionReturnNode(null, expr, loc);
  }
}

export default ReturnRule;
