// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import ResizeTilemapDialog from '../../../../src/components/TileMapEditor/ResizeTilemapDialog';

const noLoss = () => ({ tiles: 0, collisionCells: 0, markers: 0 });

function setup(overrides: Partial<React.ComponentProps<typeof ResizeTilemapDialog>> = {}) {
  const onApply = vi.fn();
  const onCancel = vi.fn();
  render(
    <ResizeTilemapDialog
      currentRows={4}
      currentCols={5}
      describeLoss={noLoss}
      onApply={onApply}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onApply, onCancel };
}

describe('ResizeTilemapDialog', () => {
  test('prefills the inputs with the current size', () => {
    setup();
    expect(screen.getByLabelText('Rows')).toHaveValue(4);
    expect(screen.getByLabelText('Columns')).toHaveValue(5);
  });

  test('Apply is disabled until a value changes', async () => {
    setup();
    const apply = screen.getByRole('button', { name: 'Apply' });
    expect(apply).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '6');
    expect(apply).toBeEnabled();
  });

  test('a non-destructive Apply calls onApply immediately with clamped integers', async () => {
    const { onApply } = setup();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(8, 5);
  });

  test('a destructive Apply shows a confirm step naming only non-zero losses', async () => {
    const { onApply } = setup({ describeLoss: () => ({ tiles: 4, collisionCells: 0, markers: 1 }) });
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText('This removes 4 painted tiles and 1 marker. Continue?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onApply).toHaveBeenCalledWith(2, 5);
  });

  test('Back returns from the confirm step without applying', async () => {
    const { onApply } = setup({ describeLoss: () => ({ tiles: 1, collisionCells: 0, markers: 0 }) });
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Rows')).toHaveValue(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  test('Cancel and Escape call onCancel', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test('values below 1 or blank are clamped to 1 on Apply', async () => {
    const { onApply } = setup();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '0');
    await userEvent.clear(screen.getByLabelText('Columns'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(1, 1);
  });
});
