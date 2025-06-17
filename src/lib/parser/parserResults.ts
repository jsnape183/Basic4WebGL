import Symbols from "../symbols";
import { Tree } from "../tree";

export class ParseFileResult {
  public name: string;
  public tree: Tree;
  public symbols: Symbols;

  constructor(name: string, tree: Tree, symbols: Symbols) {
    this.name = name;
    this.tree = tree;
    this.symbols = symbols;
  }
}

class ParserResults {
  public results: Array<ParseFileResult> = [];
  public symbolTable: Symbols;

  constructor(symbolTable: Symbols) {
    this.results = [];
    this.symbolTable = symbolTable;
  }
}

export default ParserResults;
