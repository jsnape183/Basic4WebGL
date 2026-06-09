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
import { CompilationError } from '@CompilerLib/errors';
import CloneNode from '../../nodes/CloneNode';
import VariableDimNode from '../../nodes/VariableDimNode';
import VariableDimAssignNode from '../../nodes/VariableDimAssignNode';
import DimNode from '../../nodes/DimNode';
import TypedArrayDimNode from '../../nodes/TypedArrayDimNode';
import MultiDimNode from '../../nodes/MultiDimNode';
import nodeTypes from '../../nodeTypes';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Dim')
class DimRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Dim, tokenStream);

    const nodes: Tree[] = [];

    // Parse first declarator (always runs)
    nodes.push(this.parseDeclarator(tokenStream, symbolTable, nodes, loc));

    // Parse additional declarators separated by commas
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      nodes.push(this.parseDeclarator(tokenStream, symbolTable, nodes, loc));
    }

    // Single-declarator: preserve backward-compat including newline consumption for arrays.
    if (nodes.length === 1) {
      const single = nodes[0];
      if (
        single.type === nodeTypes.Dim ||
        single.type === nodeTypes.TypedArrayDim
      ) {
        matchAndMove(newLines, tokenStream);
      }
      return single;
    }

    return new MultiDimNode(nodes, loc);
  }

  private parseDeclarator(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    nodesSoFar: Tree[],
    loc: unknown
  ): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (check(tokens.Equals, tokenStream.current())) {
      // ── dim name = expr ──────────────────────────────────────────────────
      matchAndMove(tokens.Equals, tokenStream);
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      return new VariableDimAssignNode(varSymbol, expr, loc);

    } else if (check(tokens.As, tokenStream.current())) {
      // ── dim name as ClassName[(args)] ────────────────────────────────────
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
      } else {
        return new CloneNode({ object, classSymbol }, [], loc);
      }

    } else if (check(tokens.OpenParen, tokenStream.current())) {
      // ── dim name(dims) [as ClassName[(args)]] ────────────────────────────
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

      let arrayNode: Tree;
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
          arrayNode = new TypedArrayDimNode(
            { arraySymbol, classSymbol },
            [dims, args],
            loc
          );
        } else {
          arrayNode = new TypedArrayDimNode(
            { arraySymbol, classSymbol },
            [dims],
            loc
          );
        }
      } else {
        arrayNode = new DimNode(arraySymbol, dims, loc);
      }

      // Array restriction: arrays are only allowed as the sole declarator.
      // Check AFTER parsing so dim sizes are available for the error message.
      if (
        nodesSoFar.length > 0 ||
        check(tokens.Comma, tokenStream.current())
      ) {
        const dimSizes = dims.children
          .map((c) => (c.data !== undefined && c.data !== null ? String(c.data) : '?'))
          .join(', ');
        throw new CompilationError(
          `Array declaration '${name}(${dimSizes})' cannot appear in a multi-variable dim — move it to its own line.`
        );
      }

      return arrayNode;

    } else {
      // ── dim name ─────────────────────────────────────────────────────────
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol, loc);
    }
  }
}

export default DimRule;
