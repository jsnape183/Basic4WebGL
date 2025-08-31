class BuiltInType {
  name: string;
  acceptsTypes: Array<string>;
  constructor(name: string, acceptsTypes: Array<string> = []) {
    this.name = name;
    this.acceptsTypes = acceptsTypes;
  }

  canAccept(typeName: string): boolean {
    return this.name === typeName || this.acceptsTypes.includes(typeName);
  }
}
