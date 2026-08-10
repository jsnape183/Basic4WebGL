// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { usePaintDrag } from '../../../../src/components/TileMapEditor/usePaintDrag';

describe('usePaintDrag', () => {
  test('startPaint calls onPaintCell immediately', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('continuePaint does nothing before startPaint has been called', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).not.toHaveBeenCalled();
  });

  test('continuePaint paints after startPaint has been called', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 0));
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledWith(0, 0);
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('a window mouseup event stops continuePaint from painting', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 0));
    act(() => { window.dispatchEvent(new Event('mouseup')); });
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });
});
