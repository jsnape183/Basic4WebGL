import { addBuiltInType } from './builtInTypeFactory';

class BuiltInType {
  name: string;
  acceptsTypes: Array<string>;
  constructor(name: string, acceptsTypes: Array<string> = []) {
    this.name = name;
    this.acceptsTypes = [this.name, ...acceptsTypes];
  }

  canAccept(type: BuiltInType): boolean {
    return this.name === type.name || this.acceptsTypes.includes(type.name);
  }
}

export function RegisterBuiltInType(name?: string) {
  return function <T extends { new (...args: any[]): BuiltInType }>(ctor: T) {
    const instance = new ctor();
    addBuiltInType(name ?? ctor.name, instance);
  };
}

export default BuiltInType;
