// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import CollisionCanvas from '../../../../src/components/TileMapEditor/CollisionCanvas';

describe('CollisionCanvas', () => {
  test('renders a grid of the given rows/cols', () => {
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument();
  });

  test('a solid cell (non-zero) gets the solid fill class', () => {
    render(<CollisionCanvas rows={1} cols={2} data={[[0, 1]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).not.toHaveClass('bg-ds-error/70');
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveClass('bg-ds-error/70');
  });

  test('mouse down paints a cell', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('interactive=false renders cell content but no aria-label, role, or mouse handlers', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 1], [0, 0]]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Row 0, Column 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('gridcell')).not.toBeInTheDocument();
  });

  test('interactive=false also drops the outer grid role/label', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Collision canvas')).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('interactive defaults to true when the prop is omitted', () => {
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Collision canvas')).toBeInTheDocument();
  });

  test('a data grid smaller than rows/cols renders the missing cells as not-solid rather than crashing', () => {
    render(<CollisionCanvas rows={2} cols={2} data={[[1]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 1, Column 1')).not.toHaveClass('bg-ds-error/70');
  });
});
