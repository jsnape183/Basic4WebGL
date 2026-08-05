import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import { ArraySymbol, DictionarySymbol, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { CompilationError } from '@CompilerLib/errors';
import CloneNode from '../../nodes/CloneNode';
import NewObjectNode from '../../nodes/NewObjectNode';
import AssignNode from '../../nodes/AssignNode';
import VariableDimNode from '../../nodes/VariableDimNode';
import VariableDimAssignNode from '../../nodes/VariableDimAssignNode';
import DimNode from '../../nodes/DimNode';
import TypedArrayDimNode from '../../nodes/TypedArrayDimNode';
import MultiDimNode from '../../nodes/MultiDimNode';
import DictionaryDimNode from '../../nodes/DictionaryDimNode';
import nodeTypes from '../../nodeTypes';
import { newLines } from '../../parserConfig';

function checkCtorArgs(classSymbol: any, got: number, displayName: string): void {
  const expected = classSymbol.constructorArgCount;
  if (expected !== undefined && got !== expected) {
    throw new CompilationError(
      `'${displayName}' constructor expects ${expected} argument${expected === 1 ? '' : 's'} but got ${got}`
    );
  }
}

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
        single.type === nodeTypes.TypedArrayDim ||
        single.type === nodeTypes.DictionaryDim
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
    loc: SourceLocation | undefined
  ): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (check(tokens.Equals, tokenStream.current())) {
      // ── dim name = expr ──────────────────────────────────────────────────
      matchAndMove(tokens.Equals, tokenStream);

      if (check(tokens.New, tokenStream.current())) {
        // Type-inferring: dim a = new ClassName(args)
        matchAndMove(tokens.New, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const className = tokenStream.prev().text;
        const classSymbol = symbolTable.get(className, symbolTypes.Class);

        const object = symbolTable.clone(name, classSymbol, symbolTypes.Object);
        (object as any).classSymbol = classSymbol;

        // Pull inherited members (same as 'dim a as ClassName' path)
        let ancestor = classSymbol;
        while (ancestor.parentClassName) {
          const parentClass = symbolTable.get(ancestor.parentClassName, symbolTypes.Class);
          symbolTable.mergeSymbolsIntoScope(name, ancestor.parentClassName);
          ancestor = parentClass;
        }

        // Parse optional constructor args
        let newNode: Tree;
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
          checkCtorArgs(classSymbol, args.children.length, className);
          newNode = new NewObjectNode({ classSymbol, className }, [args], loc);
        } else {
          checkCtorArgs(classSymbol, 0, className);
          newNode = new NewObjectNode({ classSymbol, className }, [], loc);
        }

        return new AssignNode(object, newNode, loc);
      }

      // Original variant form: dim a = expr
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
      (object as any).classSymbol = classSymbol;

      // Pull inherited members into this object's scope so method/property
      // lookups work on instances of child classes (e.g. dim e as SquishyEnemy
      // still exposes BaseEnemy.hit() under the 'e' scope).
      let ancestor = classSymbol;
      while (ancestor.parentClassName) {
        const parentClass = symbolTable.get(ancestor.parentClassName, symbolTypes.Class);
        symbolTable.mergeSymbolsIntoScope(name, ancestor.parentClassName);
        ancestor = parentClass;
      }

      if (check(tokens.Equals, tokenStream.current())) {
        matchAndMove(tokens.Equals, tokenStream);
        if (check(tokens.New, tokenStream.current())) {
          // dim name as ClassName = new ClassName(args)
          matchAndMove(tokens.New, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const ctorName = tokenStream.prev().text;
          const ctorClassSymbol = symbolTable.get(ctorName, symbolTypes.Class);
          if (ctorClassSymbol.name !== classSymbol.name) {
            throw new CompilationError(
              `Type mismatch: '${name}' is declared as '${classSymbol.name}' but 'new ${ctorClassSymbol.name}' was assigned`
            );
          }
          let newNode: Tree;
          if (check(tokens.OpenParen, tokenStream.current())) {
            const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
            checkCtorArgs(ctorClassSymbol, args.children.length, ctorName);
            newNode = new NewObjectNode({ classSymbol: ctorClassSymbol, className: ctorName }, [args], loc);
          } else {
            checkCtorArgs(ctorClassSymbol, 0, ctorName);
            newNode = new NewObjectNode({ classSymbol: ctorClassSymbol, className: ctorName }, [], loc);
          }
          return new AssignNode(object, newNode, loc);
        }
        // dim name as ClassName = <expression> — e.g. a method call returning that type.
        // Reuses the same Object/Variant compatibility already relied on by the
        // plain two-statement form (`dim name as ClassName` then `name = <expression>`).
        const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
        return new AssignNode(object, expr, loc);
      } else if (check(tokens.OpenParen, tokenStream.current())) {
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
          throw new CompilationError(
            `Array declaration cannot include a constructor — declare 'dim ${name}(N) as ${classSymbol.name}' and assign each element with '${name}(i) = new ${classSymbol.name}(...)'`
          );
        }
        (arraySymbol as any).classSymbol = classSymbol;
        arrayNode = new TypedArrayDimNode(
          { arraySymbol, classSymbol },
          [dims],
          loc
        );
      } else {
        arrayNode = new DimNode(arraySymbol, dims, loc);
      }

      // Array restriction: arrays are only allowed as the sole declarator.
      // Check AFTER parsing so dim sizes are available for the error message.
      // Note: arraySymbol has been added to the symbol table above, but we throw
      // before using it. This is safe — CompilationError is always fatal here
      // (caught by index.ts transpile() which aborts immediately), so the dangling
      // symbol entry is never observed.
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

    } else if (check(tokens.OpenBracket, tokenStream.current())) {
      // ── dim name[] ───────────────────────────────────────────────────────
      matchAndMove(tokens.OpenBracket, tokenStream);
      if (!check(tokens.CloseBracket, tokenStream.current())) {
        throw new CompilationError(
          `Dictionary declaration must use empty brackets: 'dim ${name}[]'`
        );
      }
      matchAndMove(tokens.CloseBracket, tokenStream);

      const dictSymbol = symbolTable.addTyped(
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
        const classSymbol = symbolTable.get(tokenStream.prev().text, symbolTypes.Class);
        dictSymbol.classSymbol = classSymbol;
      }

      if (
        nodesSoFar.length > 0 ||
        check(tokens.Comma, tokenStream.current())
      ) {
        throw new CompilationError(
          `Dictionary declaration '${name}[]' cannot appear in a multi-variable dim — move it to its own line.`
        );
      }

      return new DictionaryDimNode(dictSymbol, loc);

    } else {
      // ── dim name ─────────────────────────────────────────────────────────
      const varSymbol = symbolTable.add(name, symbolTypes.Variable);
      return new VariableDimNode(varSymbol, loc);
    }
  }
}

export default DimRule;
