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
    {
      name: 'setScale',
      params: ['sx', 'sy'],
      body: (p, self) => `_sb.setScale(${self._handle}, ${p.sx}, ${p.sy})`,
    },
    {
      name: 'setFlip',
      params: ['h', 'v'],
      body: (p, self) => `_sb.setFlip(${self._handle}, ${p.h}, ${p.v})`,
    },
    {
      name: 'setVisible',
      params: ['v'],
      body: (p, self) => `_sb.setVisible(${self._handle}, ${p.v})`,
    },
    {
      name: 'setTexture',
      params: ['path'],
      body: (p, self) => `_sb.setTexture(${self._handle}, ${p.path})`,
    },
    {
      name: 'width',
      params: [],
      returns: (_p, self) => `_sb.getSpriteWidth(${self._handle})`,
    },
    {
      name: 'height',
      params: [],
      returns: (_p, self) => `_sb.getSpriteHeight(${self._handle})`,
    },
    {
      name: 'setDepth',
      params: ['n'],
      body: (p, self) => `_sb.setDepth(${self._handle}, ${p.n})`,
    },
    {
      name: 'setVelocity',
      params: ['vx', 'vy'],
      body: (p, self) => `_sb.setVelocity(${self._handle}, ${p.vx}, ${p.vy})`,
    },
    {
      name: 'velocityX',
      params: [],
      returns: (_p, self) => `_sb.getVelocityX(${self._handle})`,
    },
    {
      name: 'velocityY',
      params: [],
      returns: (_p, self) => `_sb.getVelocityY(${self._handle})`,
    },
    {
      name: 'isBlockedUp',
      params: [],
      returns: (_p, self) => `_sb.isBlockedUp(${self._handle})`,
    },
    {
      name: 'isBlockedDown',
      params: [],
      returns: (_p, self) => `_sb.isBlockedDown(${self._handle})`,
    },
    {
      name: 'isBlockedLeft',
      params: [],
      returns: (_p, self) => `_sb.isBlockedLeft(${self._handle})`,
    },
    {
      name: 'isBlockedRight',
      params: [],
      returns: (_p, self) => `_sb.isBlockedRight(${self._handle})`,
    },
  ],
};
