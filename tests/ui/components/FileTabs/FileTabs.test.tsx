// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FileTabs from '../../../../src/components/FileTabs';

const files = [
  { id: 'f1', name: 'main.bas', source: '', projectId: 'p1' },
  { id: 'f2', name: 'utils.bas', source: '', projectId: 'p1' },
];

test('renders a tab for each file', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.getByText('main.bas')).toBeInTheDocument();
  expect(screen.getByText('utils.bas')).toBeInTheDocument();
});

test('active tab has aria-selected="true"', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.getByRole('tab', { name: /main\.bas/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /utils\.bas/ })).toHaveAttribute('aria-selected', 'false');
});

test('dirty tab shows ● indicator', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={['f2']}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  const dirtyTab = screen.getByRole('tab', { name: /utils\.bas/ });
  expect(dirtyTab.textContent).toContain('●');
});

test('clicking a tab calls onSelect with file id', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={onSelect}
      onClose={vi.fn()}
    />
  );
  await user.click(screen.getByRole('tab', { name: /utils\.bas/ }));
  expect(onSelect).toHaveBeenCalledWith('f2');
});

test('close button hidden when only one file', () => {
  render(
    <FileTabs
      files={[files[0]]}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
});
