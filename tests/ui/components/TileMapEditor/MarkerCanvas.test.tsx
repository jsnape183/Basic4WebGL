// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import MarkerCanvas from '../../../../src/components/TileMapEditor/MarkerCanvas';

describe('MarkerCanvas', () => {
  test('renders a grid of the given rows/cols', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument();
  });

  test('a marked cell shows the tag\'s first letter, uppercased', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveTextContent('S');
  });

  test('an unmarked cell shows no letter', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toHaveTextContent('');
  });

  test('a marked cell carries its tag as the title attribute (hover tooltip)', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveAttribute('title', 'spawn');
  });

  test('mouse down paints a cell', () => {
    const onPaintCell = vi.fn();
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });
});
