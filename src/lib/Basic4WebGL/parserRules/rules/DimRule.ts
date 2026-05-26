import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { ArraySymbol, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import CloneNode from '../../nodes/CloneNode';
import VariableDimNode from '../../nodes/VariableDimNode';
import DimNode from '../../nodes/DimNode';
import TypedArrayDimNode from '../../nodes/TypedArrayDimNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Dim')
class DimRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Dim, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (check(tokens.As, tokenStream.current())) {
      matchAndMove(tokens.As, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const classSymbol = symbolTable.get(
        tokenStream.prev().text,
        symbolTypes.Class
      );
      const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);

      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        return new CloneNode({ object, classSymbol }, [args], loc);
      }

      return new CloneNode({ object, classSymbol }, [], loc);
    }

    if (!check(tokens.OpenParen, tokenStream.current())) {
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol, loc);
    }
    const dims = getParserRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );

    const arraySymbol = symbolTable.addTyped(
      new ArraySymbol(
        name,
        symbolTypes.Array,
        symbolTable.getScope(),
        symbolTable.getFullScopeName(),
        dims.children.length
      )
    );

    // dim name(sizes) as Type — typed array declaration (new path)
    if (check(tokens.As, tokenStream.current())) {
      matchAndMove(tokens.As, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const classSymbol = symbolTable.get(
        tokenStream.prev().text,
        symbolTypes.Class
      );

      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        matchAndMove(newLines, tokenStream);
        return new TypedArrayDimNode({ arraySymbol, classSymbol }, [dims, args], loc);
      }

      matchAndMove(newLines, tokenStream);
      return new TypedArrayDimNode({ arraySymbol, classSymbol }, [dims], loc);
    }

    matchAndMove(newLines, tokenStream);
    return new DimNode(arraySymbol, dims, loc);
  }
}

export default DimRule;
