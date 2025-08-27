import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/parserRuleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ParenNode from '../../nodes/ParenNode';
import TermNode from '../../nodes/TermNode';
import UMinusNode from '../../nodes/UMinusNode';
import { factors } from '../../parserConfig';
import tokens from '../../tokens';

@RegisterParserRule('Factor')
class FactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      matchAndMove([tokens.Add, tokens.Subtract], tokenStream);
      return new UMinusNode(
        null,
        getParserRule('Factor').parse(tokenStream, symbolTable, undefined)
      );
    }
    if (check(tokens.OpenParen, tokenStream.current())) {
      matchAndMove(tokens.OpenParen, tokenStream);

      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseParen, tokenStream);
      return new ParenNode(null, expr);
    }
    if (check(tokens.Call, tokenStream.current())) {
      return getParserRule('CallFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }
    if (check(tokens.Variable, tokenStream.current())) {
      return getParserRule('VariableFactor').parse(
        tokenStream,
        symbolTable,
        undefined
      );
    }

    matchAndMove(factors, tokenStream);
    return new TermNode(tokenStream.prev().text, undefined);
  }
}

export default FactorRule;
