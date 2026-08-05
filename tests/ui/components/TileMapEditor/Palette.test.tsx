// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Palette from '../../../../src/components/TileMapEditor/Palette';

describe('Palette', () => {
  test('renders one thumbnail button per slice, labeled by 1-based tile id', () => {
    render(<Palette slices={['data:a', 'data:b', 'data:c']} selectedTile={1} onSelectTile={vi.fn()} />);
    expect(screen.getByLabelText('Tile 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile 3')).toBeInTheDocument();
  });

  test('clicking a tile calls onSelectTile with its 1-based id', async () => {
    const onSelectTile = vi.fn();
    render(<Palette slices={['data:a', 'data:b']} selectedTile={1} onSelectTile={onSelectTile} />);
    await userEvent.click(screen.getByLabelText('Tile 2'));
    expect(onSelectTile).toHaveBeenCalledWith(2);
  });

  test('the selected tile has aria-pressed=true', () => {
    render(<Palette slices={['data:a', 'data:b']} selectedTile={2} onSelectTile={vi.fn()} />);
    expect(screen.getByLabelText('Tile 2')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tile 1')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking Eraser calls onSelectTile(null), and it is pressed when selectedTile is null', async () => {
    const onSelectTile = vi.fn();
    render(<Palette slices={['data:a']} selectedTile={null} onSelectTile={onSelectTile} />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectTile).toHaveBeenCalledWith(null);
  });
});
