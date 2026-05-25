import { ClassDescriptor } from '../generator/types';

export const transformDescriptor: ClassDescriptor = {
  name: 'ObjectTransform',
  properties: ['_handle'],
  constructor: {
    params: ['handle'],
    // 'constructor_handle' is the mangled param name (prefix 'constructor_' + param 'handle').
    // Using the literal directly rather than p.handle avoids a proxy round-trip.
    body: (_p, _self) => `constructor_handle`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'x',
      params: [],
      returns: (_p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'y',
      params: [],
      returns: (_p, self) => `_sb.getPositionY(${self._handle})`,
    },
  ],
};
