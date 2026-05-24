import { ParamProxy, SelfProxy } from './types';

export function makeParamProxy(fnName: string): ParamProxy {
  const prefix = fnName.toLowerCase();
  return new Proxy({} as ParamProxy, {
    get(_target, prop: string | symbol) {
      return `${prefix}_${String(prop)}`;
    },
  });
}

export function makeSelfProxy(context: 'class' | 'module', name: string): SelfProxy {
  if (context === 'class') {
    return new Proxy({} as SelfProxy, {
      get(_target, prop: string | symbol) {
        return `this.${String(prop).toLowerCase()}`;
      },
    });
  }
  const moduleName = name.toLowerCase();
  return new Proxy({} as SelfProxy, {
    get(_target, prop: string | symbol) {
      return `${moduleName}.${String(prop).toLowerCase()}`;
    },
  });
}
