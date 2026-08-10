// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TagPicker from '../../../../src/components/TileMapEditor/TagPicker';

describe('TagPicker', () => {
  test('renders a chip per tag', () => {
    render(<TagPicker tags={['spawn', 'pickup']} selectedTag={null} onSelectTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toBeInTheDocument();
    expect(screen.getByLabelText('Tag pickup')).toBeInTheDocument();
  });

  test('clicking a chip selects that tag', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={['spawn']} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByLabelText('Tag spawn'));
    expect(onSelectTag).toHaveBeenCalledWith('spawn');
  });

  test('clicking Eraser selects null', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={['spawn']} selectedTag="spawn" onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectTag).toHaveBeenCalledWith(null);
  });

  test('typing a new tag name and pressing Enter selects it', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={[]} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'boss_spawn{Enter}');
    expect(onSelectTag).toHaveBeenCalledWith('boss_spawn');
  });

  test('pressing Enter with an empty input does not select anything', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={[]} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), '{Enter}');
    expect(onSelectTag).not.toHaveBeenCalled();
  });

  test('the selected tag chip is visually indicated via aria-pressed', () => {
    render(<TagPicker tags={['spawn']} selectedTag="spawn" onSelectTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toHaveAttribute('aria-pressed', 'true');
  });
});
