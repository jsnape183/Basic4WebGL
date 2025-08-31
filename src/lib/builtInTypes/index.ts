class BuiltInType {
  name: string;
  acceptsTypes: Array<BuiltInType>;
  constructor(name: string, acceptsTypes: Array<BuiltInType> = []) {
    this.name = name;
    this.acceptsTypes = [this, ...acceptsTypes];
  }

  canAccept(type: BuiltInType): boolean {
    return this === type || this.acceptsTypes.includes(type);
  }
}

export default BuiltInType;
