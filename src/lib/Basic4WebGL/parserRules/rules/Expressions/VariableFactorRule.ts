import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLookupNode from '@Basic4WebGL/nodes/ArrayLookupNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import VariableNode from '@Basic4WebGL/nodes/VariableNode';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('VariableFactor')
class VariableFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text;
    if (
      symbolTable.check(name, symbolTypes.Module) ||
      symbolTable.check(name, symbolTypes.Object)
    ) {
      return getParserRule('ModuleFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    if (symbolTable.check(name, symbolTypes.Function)) {
      return getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
      return new TermNode(symbolTable.get(name), new VariableNode(name));
    }
    matchAndMove(tokens.OpenParen, tokenStream);
    const elems = getParserRule('ArrayList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);

    return new ArrayLookupNode(symbolTable.get(name, 'Array'), elems);
  }
}

export default VariableFactorRule;
