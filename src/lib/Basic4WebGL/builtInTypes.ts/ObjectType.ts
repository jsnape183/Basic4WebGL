class ObjectType extends BuiltInType {
  fullName: string = '';
  constructor(fullName: string) {
    super('Object', []);
    this.fullName = fullName;
  }

  canAccept(typeName: string): boolean {
    return this.fullName === typeName;
  }
}

export default ObjectType;
