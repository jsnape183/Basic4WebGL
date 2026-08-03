import { ClassDescriptor } from './types';
import { makeParamProxy, makeSelfProxy } from './proxies';

export function generateClass(descriptor: ClassDescriptor): string {
  const { name, properties, methods } = descriptor;
  const ctor = Object.prototype.hasOwnProperty.call(descriptor, 'constructor')
    ? descriptor.constructor
    : undefined;
  const self = makeSelfProxy('class', name);
  const lines: string[] = [];

  lines.push('Class');

  properties.forEach((prop) => lines.push(`dim ${prop}`));
  lines.push('');

  if (ctor) {
    const ctorParams = ctor.params.join(', ');
    lines.push(`Constructor(${ctorParams})`);
    const p = makeParamProxy('constructor');
    lines.push(`    self.${ctor.assignTo} = call("${ctor.body(p, self)}")`);
    if (ctor.after) {
      ctor.after(p, self).forEach((line) => lines.push(`    ${line}`));
    }
    lines.push('EndConstructor');
    lines.push('');
  }

  methods.forEach((method) => {
    const params = method.params.join(', ');
    lines.push(`function ${method.name}(${params})`);
    const p = makeParamProxy(method.name);
    if (method.returns) {
      lines.push(`    return call("${method.returns(p, self)}")`);
    } else if (method.body) {
      lines.push(`    call("${method.body(p, self)}")`);
    }
    lines.push('endfunction');
    lines.push('');
  });

  lines.push('EndClass');

  return lines.join('\n');
}
