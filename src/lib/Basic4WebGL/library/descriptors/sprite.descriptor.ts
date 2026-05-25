import { ClassDescriptor } from '../generator/types';

export const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
    assignTo: '_handle',
    after: (_p, self) => [
      `dim transform as ObjectTransform(call("${self._handle}"))`,
    ],
  },
  methods: [
    {
      name: 'setAngle',
      params: ['angle'],
      body: (p, self) => `_sb.setAngle(${self._handle}, ${p.angle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};
