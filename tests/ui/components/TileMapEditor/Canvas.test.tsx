// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TileMapCanvas from '../../../../src/components/TileMapEditor/Canvas';

describe('TileMapCanvas', () => {
  test('mouse down paints a single cell', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 0);
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('mouse enter without a prior mouse down does not paint', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).not.toHaveBeenCalled();
  });

  test('mouseup on window stops painting', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseUp(window);
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });

  test('every cell has a visible gridline border', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toHaveClass('border', 'border-ds-border');
  });

  test('every cell has the hover highlight classes', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toHaveClass(
      'hover:ring-2', 'hover:ring-inset', 'hover:ring-ds-accent'
    );
  });

  test('interactive=false renders cell content but no aria-label, role, or mouse handlers', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Row 0, Column 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('gridcell')).not.toBeInTheDocument();
  });

  test('interactive=false also drops the outer grid role/label, so a dimmed layer never duplicates the active layer\'s "Tilemap canvas" label', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Tilemap canvas')).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('interactive defaults to true when the prop is omitted', () => {
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Tilemap canvas')).toBeInTheDocument();
  });
});
