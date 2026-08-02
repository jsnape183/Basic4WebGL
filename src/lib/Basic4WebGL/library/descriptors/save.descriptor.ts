import { ModuleDescriptor } from '../generator/types';

export const saveDescriptor: ModuleDescriptor = {
  name: 'save',
  functions: [
    { name: 'set', params: ['key', 'value'], body: (p) => `_sb.saveSet(${p.key}, ${p.value})` },
    { name: 'get', params: ['key'], returns: (p) => `_sb.saveGet(${p.key})` },
    { name: 'exists', params: ['key'], returns: (p) => `_sb.saveExists(${p.key})` },
    { name: 'delete', params: ['key'], body: (p) => `_sb.saveDelete(${p.key})` },
    { name: 'setAll', params: ['data'], body: (p) => `_sb.saveSetAll(${p.data})` },
    { name: 'getAll', params: [], returns: () => `_sb.saveGetAll()` },
  ],
};
