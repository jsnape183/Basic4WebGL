import { ModuleDescriptor } from './types';
import { makeParamProxy, makeSelfProxy } from './proxies';

export function generateModule(descriptor: ModuleDescriptor): string {
  const { name, properties, functions } = descriptor;
  const self = makeSelfProxy('module', name);
  const lines: string[] = [];

  if (properties?.length) {
    properties.forEach((prop) => lines.push(`dim ${prop}`));
    lines.push('');
  }

  functions.forEach((fn) => {
    const params = fn.params.join(', ');
    lines.push(`function ${fn.name}(${params})`);
    const p = makeParamProxy(fn.name);
    if (fn.returns) {
      lines.push(`    return call("${fn.returns(p, self)}")`);
    } else if (fn.body) {
      lines.push(`    call("${fn.body(p, self)}")`);
    }
    lines.push('endfunction');
    lines.push('');
  });

  return lines.join('\n').trimEnd();
}
