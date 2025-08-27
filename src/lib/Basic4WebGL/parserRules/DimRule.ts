import { check, matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getParserRule } from '../../parser/ruleFactory';
import CloneNode from '../nodes/CloneNode';
import VariableDimNode from '../nodes/VariableDimNode';
import DimNode from '../nodes/DimNode';
import { newLines } from '../parserConfig';

@RegisterParserRule('Dim')
class DimRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Dim, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (check(tokens.As, tokenStream.current())) {
      matchAndMove(tokens.As, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const module = symbolTable.get(
        tokenStream.prev().text,
        symbolTypes.Class
      );
      const object = symbolTable.clone(name, module, symbolTypes.Object);

      return new CloneNode({ object, module });
    }

    if (!check(tokens.OpenParen, tokenStream.current())) {
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol);
    }
    const arraySymbol = symbolTable.add(name, symbolTypes.Array);
    const dims = getParserRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);

    return new DimNode(arraySymbol, dims);
  }
}

export default DimRule;
