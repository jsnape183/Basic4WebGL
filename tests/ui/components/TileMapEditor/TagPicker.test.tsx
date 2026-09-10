// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TagPicker from '../../../../src/components/TileMapEditor/TagPicker';

const base = {
  selectedTags: [] as string[],
  eraserActive: false,
  onToggleTag: vi.fn(),
  onSelectEraser: vi.fn(),
};

describe('TagPicker (paint mode)', () => {
  test('renders a chip per tag', () => {
    render(<TagPicker {...base} tags={['spawn', 'pickup']} onToggleTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toBeInTheDocument();
    expect(screen.getByLabelText('Tag pickup')).toBeInTheDocument();
  });

  test('clicking a chip toggles that tag', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} onToggleTag={onToggleTag} />);
    await userEvent.click(screen.getByLabelText('Tag spawn'));
    expect(onToggleTag).toHaveBeenCalledWith('spawn');
  });

  test('several tags can be pressed at once', () => {
    render(<TagPicker {...base} tags={['spawn', 'enemy', 'pickup']} selectedTags={['spawn', 'enemy']} />);
    expect(screen.getByLabelText('Tag spawn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tag enemy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tag pickup')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the Eraser reflects eraserActive, and is not pressed when tags are loaded', () => {
    const { rerender } = render(<TagPicker {...base} tags={['spawn']} eraserActive />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'true');
    rerender(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} eraserActive={false} />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking the Eraser calls onSelectEraser', async () => {
    const onSelectEraser = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} onSelectEraser={onSelectEraser} />);
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectEraser).toHaveBeenCalled();
  });

  test('typing a new tag name and pressing Enter toggles it on', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={[]} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'boss_spawn{Enter}');
    expect(onToggleTag).toHaveBeenCalledWith('boss_spawn');
  });

  test('pressing Enter with an empty input does nothing', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={[]} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), '{Enter}');
    expect(onToggleTag).not.toHaveBeenCalled();
  });

  test('typing a name that is already loaded does not toggle it back off', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    expect(onToggleTag).not.toHaveBeenCalled();
  });

  test('an unused tag can be deleted from the registry via its × affordance', async () => {
    const onRemoveTag = vi.fn();
    render(<TagPicker {...base} tags={['ghost']} tagsInUse={[]} onRemoveTag={onRemoveTag} />);
    await userEvent.click(screen.getByLabelText('Delete tag ghost from tilemap'));
    expect(onRemoveTag).toHaveBeenCalledWith('ghost');
  });
});
