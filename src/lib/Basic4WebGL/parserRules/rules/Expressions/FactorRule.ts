import { CompilationError } from '@CompilerLib/errors';
import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { NumberNode } from '@Basic4WebGL/nodes/NumberNode';
import ParenNode from '@Basic4WebGL/nodes/ParenNode';
import StringNode from '@Basic4WebGL/nodes/StringNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import UMinusNode from '@Basic4WebGL/nodes/UMinusNode';
import { factors } from '../../../parserConfig';
import tokens from '@Basic4WebGL/tokens';

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
    if (!check(factors, tokenStream.current())) {
      throw new CompilationError(
        `Expected String, Number, Variable but found ${
          tokenStream.current().text
        }`
      );
    }

    if (check(tokens.String, tokenStream.current())) {
      matchAndMove(tokens.String, tokenStream);
      return new TermNode(
        tokenStream.prev().text,
        new StringNode(tokenStream.prev().text)
      );
    }

    if (check(tokens.Number, tokenStream.current())) {
      matchAndMove(tokens.Number, tokenStream);
      return new TermNode(
        tokenStream.prev().text,
        new NumberNode(tokenStream.prev().text)
      );
    }
    throw new CompilationError(
      `Expected String, Number but found ${tokenStream.current().text}`
    );
  }
}

export default FactorRule;
