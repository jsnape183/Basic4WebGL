import { ModuleDescriptor } from '../generator/types';

export const fileDescriptor: ModuleDescriptor = {
  name: 'file',
  functions: [
    { name: 'write', params: ['path', 'content'], body: (p) => `_sb.fileWrite(${p.path}, ${p.content})` },
    { name: 'read', params: ['path'], returns: (p) => `_sb.fileRead(${p.path})` },
    { name: 'exists', params: ['path'], returns: (p) => `_sb.fileExists(${p.path})` },
    { name: 'delete', params: ['path'], body: (p) => `_sb.fileDelete(${p.path})` },
  ],
};
