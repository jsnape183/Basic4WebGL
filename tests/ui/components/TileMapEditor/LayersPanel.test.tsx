// tests/ui/components/TileMapEditor/LayersPanel.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import LayersPanel from '../../../../src/components/TileMapEditor/LayersPanel';
import { EditorLayer } from '../../../../src/components/TileMapEditor/types';

// dnd-kit uses ResizeObserver internally — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const makeLayers = (): EditorLayer[] => [
  { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
  { key: 'k2', name: 'foreground', kind: 'tile', data: [[0]] },
];

const noHidden = new Set<string>();

describe('LayersPanel', () => {
  test('renders a drag handle per layer', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(2);
  });

  test('clicking a layer name calls onSelect with its index', async () => {
    const onSelect = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={onSelect} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByText('foreground'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('clicking "Add tile layer" calls onAdd with a unique default name and kind "tile"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add tile layer'));
    expect(onAdd).toHaveBeenCalledWith('layer3', 'tile');
  });

  test('clicking "Add marker layer" calls onAdd with a unique default name and kind "marker"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    expect(onAdd).toHaveBeenCalledWith('markers3', 'marker');
  });

  test('a marker layer shows a distinguishing badge in the list', () => {
    const layers: EditorLayer[] = [
      { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
      { key: 'k2', name: 'spawns', kind: 'marker', markers: [] },
    ];
    render(<LayersPanel layers={layers} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByText('tag')).toBeInTheDocument();
  });

  test('clicking remove calls onRemove with the layer index', async () => {
    const onRemove = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={onRemove} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Remove layer foreground'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  test('double-click, edit, and Enter renames the layer', async () => {
    const onRename = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={onRename} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.dblClick(screen.getByText('background'));
    const input = screen.getByDisplayValue('background');
    await userEvent.clear(input);
    await userEvent.type(input, 'solid{Enter}');
    expect(onRename).toHaveBeenCalledWith(0, 'solid');
  });

  test('renders a visibility toggle per layer, defaulting to "Hide layer" when nothing is hidden', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Hide layer background' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide layer foreground' })).toBeInTheDocument();
  });

  test('a hidden layer shows a "Show layer" toggle instead', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={new Set(['k2'])} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Hide layer background' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show layer foreground' })).toBeInTheDocument();
  });

  test('clicking the visibility toggle calls onToggleVisibility with the layer index, not onSelect', async () => {
    const onToggleVisibility = vi.fn();
    const onSelect = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={onSelect} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={onToggleVisibility} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(onToggleVisibility).toHaveBeenCalledWith(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('clicking "Add collision layer" calls onAdd with a unique default name and kind "collision"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    expect(onAdd).toHaveBeenCalledWith('collision3', 'collision');
  });

  test('a collision layer shows a distinguishing badge in the list', () => {
    const layers: EditorLayer[] = [
      { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
      { key: 'k2', name: 'solidmask', kind: 'collision', data: [[0]] },
    ];
    render(<LayersPanel layers={layers} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByText('solid')).toBeInTheDocument();
  });
});
