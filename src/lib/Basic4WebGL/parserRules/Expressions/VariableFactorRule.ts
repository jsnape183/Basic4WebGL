import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ArrayLookupNode from '../../nodes/ArrayLookupNode';
import TermNode from '../../nodes/TermNode';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';

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
      return new TermNode(symbolTable.get(name), undefined);
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
