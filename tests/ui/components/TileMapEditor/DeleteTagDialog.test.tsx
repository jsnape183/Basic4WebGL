// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import DeleteTagDialog from '../../../../src/components/TileMapEditor/DeleteTagDialog';

function setup(overrides: Partial<React.ComponentProps<typeof DeleteTagDialog>> = {}) {
  const onCancel = vi.fn();
  const onDeleteFromListOnly = vi.fn();
  const onRemoveEverywhere = vi.fn();
  render(
    <DeleteTagDialog
      tag="rogue"
      markerCount={7}
      layerCount={2}
      onCancel={onCancel}
      onDeleteFromListOnly={onDeleteFromListOnly}
      onRemoveEverywhere={onRemoveEverywhere}
      {...overrides}
    />
  );
  return { onCancel, onDeleteFromListOnly, onRemoveEverywhere };
}

describe('DeleteTagDialog', () => {
  test('names the tag and reports how many markers and layers use it', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete tag rogue' })).toBeInTheDocument();
    expect(screen.getByText('"rogue" is used on 7 markers across 2 layers.')).toBeInTheDocument();
  });

  test('singular wording for exactly one marker on one layer', () => {
    setup({ markerCount: 1, layerCount: 1 });
    expect(screen.getByText('"rogue" is used on 1 marker across 1 layer.')).toBeInTheDocument();
  });

  test('clicking "Delete from list only" calls onDeleteFromListOnly', async () => {
    const { onDeleteFromListOnly } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete from list only' }));
    expect(onDeleteFromListOnly).toHaveBeenCalled();
  });

  test('clicking "Remove everywhere" calls onRemoveEverywhere', async () => {
    const { onRemoveEverywhere } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Remove everywhere' }));
    expect(onRemoveEverywhere).toHaveBeenCalled();
  });

  test('Cancel, backdrop click, and Escape all call onCancel', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
