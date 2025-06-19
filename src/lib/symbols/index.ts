export class SymbolScope {
  public name: string = "";
  public type: string = "";

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }
}

export class Symbol {
  public name: string = "";
  public type: string = "";
  public scope: SymbolScope;
  public fullScope: string = "";

  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string
  ) {
    this.name = name;
    this.type = type;
    this.scope = scope;
    this.fullScope = fullScope;
  }
}

class Symbols {
  private isMatchingType: (expected: string, actual: string) => Boolean;
  private table: Record<string, Symbol> = {};
  private scopes: Array<SymbolScope> = [];
  private currentScope: SymbolScope;

  constructor(
    isMatchingType: (expected: string, actual: string) => Boolean = (
      expected: string,
      actual: string
    ) => expected === actual
  ) {
    this.isMatchingType = isMatchingType;
    this.currentScope = new SymbolScope("", "");
    this.scopes.push({ ...this.currentScope });
  }

  getScope(): string {
    if (this.scopes.length === 0) return "";
    return this.scopes[this.scopes.length - 1].name;
  }
  getScopeType(): string {
    if (this.scopes.length === 0) return "";
    return this.scopes[this.scopes.length - 1].type;
  }
  setScope(scope: string, type: string = "") {
    this.scopes.push(new SymbolScope(scope, type));
    this.currentScope = this.scopes[this.scopes.length - 1];
  }
  clearScope(): void {
    this.scopes.pop();
    if (this.scopes.length === 0) {
      this.currentScope = new SymbolScope("", "");
      this.scopes.push({ ...this.currentScope });
    }
    this.currentScope = this.scopes[this.scopes.length - 1];
  }
  clone(
    name: string,
    symbol: Symbol,
    newType: string,
    scope: SymbolScope = this.currentScope
  ) {
    const childSymbols = Object.values(this.table)
      .filter((s) => s.scope.name === symbol.name)
      .slice(0);

    const clonedSymbol = this.add(name, newType, scope);
    this.setScope(name);
    childSymbols.forEach((c) => {
      this.add(c.name, c.type, new SymbolScope(name, symbol.type));
    });
    this.clearScope();
    return clonedSymbol;
  }
  add(
    name: string,
    type: string = "Variable",
    scope: SymbolScope = this.currentScope
  ) {
    if (!scope || !scope?.name) {
      scope = new SymbolScope("", "");
    }
    const formattedName = name.toLowerCase();
    if (
      this.table[formattedName] &&
      (this.table[formattedName].scope.name === "" ||
        this.table[formattedName].scope.name === this.currentScope.name)
    ) {
      throw Error(`${type} ${name} in ${scope.name} already exists.`);
    }
    this.table[formattedName] = new Symbol(
      name,
      type,
      scope,
      this.scopes
        .map((s) => s.name)
        .filter((s) => s !== "")
        .join(".")
    );
    return this.table[formattedName];
  }
  retrieveSymbol(
    name: string,
    type: string = "Variable",
    scope: SymbolScope | undefined = undefined
  ) {
    const formattedName = name.toLowerCase();

    if (scope !== undefined) {
      const symbol = this.table[formattedName];
      if (
        symbol &&
        this.isMatchingType(type, symbol.type) &&
        symbol.scope.name === scope.name
      ) {
        return symbol;
      }

      return undefined;
    }
    const symbolMatches: Symbol[] = Object.values(this.table).filter(
      (v) =>
        v.name.toLowerCase() === formattedName &&
        this.isMatchingType(type, v.type)
    );
    const scopePriority = new Map(
      this.scopes.map((s, index) => [s.name, index])
    );
    const symbol = symbolMatches.reduce((best, current) => {
      const currentPriority = scopePriority.get(current.scope.name);
      if (currentPriority === undefined) return best;

      if (!best) return current;

      const bestPriority = scopePriority.get(best.scope.name)!;
      return currentPriority < bestPriority ? current : best;
    }, undefined as (typeof symbolMatches)[number] | undefined);

    return symbol;
  }
  get(
    name: string,
    type: string = "Variable",
    scope: SymbolScope | undefined = undefined
  ): Symbol {
    const symbol = this.retrieveSymbol(name, type, scope);
    if (symbol) {
      return symbol;
    }

    throw Error(
      `${type} ${name} ${
        scope?.name !== "" ? "in " + scope?.name : ""
      } has not been declared yet.`
    );
  }
  check(
    name: string,
    type: string,
    scope: SymbolScope | undefined = undefined
  ) {
    console.log(name);
    console.log(this.table);
    return this.retrieveSymbol(name, type, scope) !== undefined;
  }
  getAll(
    type: string = "Variable",
    scope: SymbolScope = this.currentScope
  ): Array<Symbol> {
    const result: Array<Symbol> = Object.values(
      Object.fromEntries(
        Object.entries(this.table).filter(
          ([, _value]) =>
            _value.type === type && _value.scope.name === scope.name
        )
      )
    );

    return result ?? new Array<symbol>();
  }
}

export default Symbols;
