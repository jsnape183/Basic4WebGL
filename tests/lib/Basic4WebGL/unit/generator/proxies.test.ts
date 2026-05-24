import { describe, test, expect } from 'vitest';
import { makeParamProxy, makeSelfProxy } from '@Basic4WebGL/library/generator/proxies';

describe('makeParamProxy', () => {
  test('prefixes param with lowercased function name and underscore', () => {
    const p = makeParamProxy('setPosition');
    expect(p.x).toBe('setposition_x');
  });

  test('lowercases the param name', () => {
    const p = makeParamProxy('setPosition');
    expect(p.imagePath).toBe('setposition_imagepath');
  });

  test('constructor prefix produces constructor_paramname', () => {
    const p = makeParamProxy('constructor');
    expect(p.imagePath).toBe('constructor_imagepath');
  });

  test('single-letter params work', () => {
    const p = makeParamProxy('drawLine');
    expect(p.x).toBe('drawline_x');
    expect(p.x2).toBe('drawline_x2');
  });
});

describe('makeSelfProxy — class context', () => {
  test('produces this.propname', () => {
    const self = makeSelfProxy('class', 'sprite');
    expect(self._handle).toBe('this._handle');
  });

  test('lowercases property name', () => {
    const self = makeSelfProxy('class', 'sprite');
    expect(self.MyProp).toBe('this.myprop');
  });

  test('class name has no effect on class self proxy', () => {
    const self = makeSelfProxy('class', 'anything');
    expect(self._handle).toBe('this._handle');
  });
});

describe('makeSelfProxy — module context', () => {
  test('produces modulename.propname', () => {
    const self = makeSelfProxy('module', 'audio');
    expect(self._volume).toBe('audio._volume');
  });

  test('lowercases module name', () => {
    const self = makeSelfProxy('module', 'Audio');
    expect(self._volume).toBe('audio._volume');
  });

  test('lowercases property name', () => {
    const self = makeSelfProxy('module', 'audio');
    expect(self.MyProp).toBe('audio.myprop');
  });
});
