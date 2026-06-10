import BuiltInType from '../CompilerLib/builtInTypes';
import { SymbolError } from '../errors';

export class SymbolScope {
  public name: string = '';
  public type: string = '';

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }
}

export class Symbol {
  public name: string = '';
  public type: string = '';
  public scope: SymbolScope;
  public fullScope: string = '';
  public dataType: BuiltInType;

  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    dataType: BuiltInType
  ) {
    this.name = name;
    this.type = type;
    this.scope = scope;
    this.fullScope = fullScope;
    this.dataType = dataType;
  }

  setType(type: string) {
    this.type = type;
  }

  setScopeType(type: string) {
    this.scope.type = type;
  }

  isScopedToType(scopeType: string) {
    return this.scope.type === scopeType;
  }
}

class Symbols {
  private isMatchingType: (expected: string, actual: string) => Boolean;
  private table: Array<Symbol> = [];
  /** Fast O(1) index for exact-scope lookups: "${name}::${scopeName}::${fullScope}" */
  private index: Map<string, Symbol> = new Map();
  private scopes: Array<SymbolScope> = [];
  private currentScope: SymbolScope;
  private defaultType: BuiltInType;

  constructor(
    defaultType: BuiltInType,
    isMatchingType: (expected: string, actual: string) => Boolean = (
      expected: string,
      actual: string
    ) => expected === actual
  ) {
    this.isMatchingType = isMatchingType;
    this.currentScope = new SymbolScope('', '');
    this.scopes.push({ ...this.currentScope });
    this.defaultType = defaultType;
  }

  private indexKey(name: string, scopeName: string, fullScope: string): string {
    return `${name.toLowerCase()}::${scopeName}::${fullScope}`;
  }

  private indexSymbol(symbol: Symbol): void {
    this.index.set(
      this.indexKey(symbol.name, symbol.scope.name, symbol.fullScope),
      symbol
    );
  }

  getFullScopeName(): string {
    const fullScope = this.scopes
      .map((s) => s.name)
      .filter((s) => s !== '')
      .join('.');
    return fullScope;
  }
  getScope(): SymbolScope {
    return this.currentScope;
  }
  getScopeName(): string {
    if (this.scopes.length === 0) return '';
    return this.scopes[this.scopes.length - 1].name;
  }
  getScopeType(): string {
    if (this.scopes.length === 0) return '';
    return this.scopes[this.scopes.length - 1].type;
  }
  setScope(scope: string, type: string = '') {
    this.scopes.push(new SymbolScope(scope, type));
    this.currentScope = this.scopes[this.scopes.length - 1];
  }
  setCurrentScope(scope: string, type: string = '') {
    if (this.scopes.length === 0) return;

    this.scopes[this.scopes.length - 1].name = scope;
    this.scopes[this.scopes.length - 1].type = type;
    this.currentScope.name = scope;
    this.currentScope.type = type;
  }
  getScopeDepth(): number {
    return this.scopes.length;
  }
  clearScope(): void {
    this.scopes.pop();
    if (this.scopes.length === 0) {
      this.currentScope = new SymbolScope('', '');
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
    const childSymbols = this.table
      .filter((s) => s.scope.name === symbol.name)
      .slice(0);

    const clonedSymbol = this.add(name, newType, scope, symbol.dataType);
    this.setScope(name);
    childSymbols.forEach((c) => {
      const clonedChild = Object.create(Object.getPrototypeOf(c)) as Symbol;
      Object.assign(clonedChild, c);
      clonedChild.scope = new SymbolScope(name, symbol.type);
      clonedChild.fullScope = this.getFullScopeName();
      this.table.push(clonedChild);
      this.indexSymbol(clonedChild);
    });
    this.clearScope();
    return clonedSymbol;
  }
  addTyped(symbol: Symbol) {
    if (
      this.retrieveSymbol(
        symbol.name,
        symbol.type,
        symbol.scope,
        symbol.fullScope
      )
    ) {
      throw new SymbolError(
        `${symbol.type} ${symbol.name} in ${symbol.scope.name} already exists.`
      );
    }
    this.table.push(symbol);
    this.indexSymbol(symbol);
    return symbol;
  }
  add(
    name: string,
    type: string = 'Variable',
    scope: SymbolScope = this.currentScope,
    dataType: BuiltInType = this.defaultType
  ) {
    if (!scope || !scope?.name) {
      scope = new SymbolScope('', '');
    }

    const fullScope = this.scopes
      .map((s) => s.name)
      .filter((s) => s !== '')
      .join('.');

    if (this.retrieveSymbol(name, type, scope, fullScope)) {
      throw new SymbolError(`${type} ${name} in ${scope.name} already exists.`);
    }

    const symbol = new Symbol(name, type, scope, fullScope, dataType);
    this.table.push(symbol);
    this.indexSymbol(symbol);
    return symbol;
  }
  retrieveSymbol(
    name: string,
    type: string = 'Variable',
    scope: SymbolScope | undefined = undefined,
    fullScope: string = ''
  ) {
    const formattedName = name.toLowerCase();

    if (scope !== undefined) {
      // O(1) fast path: exact scope lookup via index
      const key = this.indexKey(formattedName, scope.name, fullScope);
      const indexed = this.index.get(key);
      if (indexed && this.isMatchingType(type, indexed.type)) {
        return indexed;
      }
      return undefined;
    }

    // Scope-priority path: find best match across visible scopes (stays O(n) — needed
    // for implicit scope resolution where the caller doesn't know which scope owns the symbol)
    const symbolMatches: Symbol[] = this.table.filter(
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
      return currentPriority > bestPriority ? current : best;
    }, undefined as (typeof symbolMatches)[number] | undefined);

    return symbol;
  }
  get(
    name: string,
    type: string = 'Variable',
    scope: SymbolScope | undefined = undefined,
    fullScope: string = ''
  ): Symbol {
    const symbol = this.retrieveSymbol(name, type, scope, fullScope);
    if (symbol) {
      return symbol;
    }

    throw new SymbolError(
      `${type} ${name} ${
        scope?.name !== '' ? 'in ' + scope?.name : ''
      } has not been declared yet.`
    );
  }
  /** Lookup by name and type within a specific scope name, ignoring fullScope.
   * Used by module rules where the function was registered under a different
   * fullScope than the current call-site fullScope. */
  getInScope(name: string, type: string, scopeName: string): Symbol {
    const formattedName = name.toLowerCase();
    const match = this.table.find(
      (s) =>
        s.name.toLowerCase() === formattedName &&
        this.isMatchingType(type, s.type) &&
        s.scope.name === scopeName
    );
    if (!match) {
      throw new SymbolError(
        `${type} ${name} in ${scopeName} has not been declared yet.`
      );
    }
    return match;
  }
  check(
    name: string,
    type: string,
    scope: SymbolScope | undefined = undefined,
    fullScope: string = ''
  ) {
    return this.retrieveSymbol(name, type, scope, fullScope) !== undefined;
  }
  getAll(
    type: string = 'Variable',
    scope: SymbolScope = this.currentScope,
    fullScope?: string
  ): Array<Symbol> {
    const result: Array<Symbol> = Object.values(
      Object.fromEntries(
        Object.entries(this.table).filter(
          ([, _value]) =>
            _value.type === type &&
            _value.scope.name === scope.name &&
            (fullScope === undefined || _value.fullScope === fullScope)
        )
      )
    );

    return result ?? new Array<symbol>();
  }
}

export default Symbols;
