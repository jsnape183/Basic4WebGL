import { ClassDescriptor } from '../generator/types';

export const textDescriptor: ClassDescriptor = {
  name: 'text',
  properties: ['_handle'],
  constructor: {
    params: ['content', 'x', 'y'],
    body: (p, _self) => `_sb.createText(${p.content}, ${p.x}, ${p.y})`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setText',
      params: ['content'],
      body: (p, self) => `_sb.setText(${self._handle}, ${p.content})`,
    },
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
    {
      name: 'setStyle',
      params: ['size', 'r', 'g', 'b'],
      body: (p, self) => `_sb.setTextStyle(${self._handle}, ${p.size}, ${p.r}, ${p.g}, ${p.b})`,
    },
    {
      name: 'setFont',
      params: ['fontFamily'],
      body: (p, self) => `_sb.setTextFont(${self._handle}, ${p.fontFamily})`,
    },
    {
      name: 'setAlign',
      params: ['align'],
      body: (p, self) => `_sb.setTextAlign(${self._handle}, ${p.align})`,
    },
  ],
};
