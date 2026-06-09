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

// --- Asset tab tests ---

const assetTabs = [{ id: 'a1', name: 'config.json' }];

const assetTabProps = {
  files,
  selectedFileId: 'f1' as string | undefined,
  dirtyFileIds: [] as string[],
  onSelect: vi.fn(),
  onClose: vi.fn(),
  assetTabs,
  selectedAssetTabId: undefined as string | undefined,
  dirtyAssetIds: [] as string[],
  onSelectAsset: vi.fn(),
  onCloseAsset: vi.fn(),
};

test('renders asset tab alongside file tabs', () => {
  render(<FileTabs {...assetTabProps} />);
  expect(screen.getByText('config.json')).toBeInTheDocument();
});

test('active asset tab has aria-selected="true"', () => {
  render(<FileTabs {...assetTabProps} selectedFileId={undefined} selectedAssetTabId="a1" />);
  expect(screen.getByRole('tab', { name: /config\.json/ })).toHaveAttribute('aria-selected', 'true');
});

test('dirty asset tab shows ● indicator', () => {
  render(<FileTabs {...assetTabProps} selectedAssetTabId="a1" dirtyAssetIds={['a1']} />);
  expect(screen.getByRole('tab', { name: /config\.json/ }).textContent).toContain('●');
});

test('clicking an asset tab calls onSelectAsset with asset id', async () => {
  const user = userEvent.setup();
  const onSelectAsset = vi.fn();
  render(<FileTabs {...assetTabProps} onSelectAsset={onSelectAsset} />);
  await user.click(screen.getByRole('tab', { name: /config\.json/ }));
  expect(onSelectAsset).toHaveBeenCalledWith('a1');
});

test('asset tab close button calls onCloseAsset with asset id', async () => {
  const user = userEvent.setup();
  const onCloseAsset = vi.fn();
  render(<FileTabs {...assetTabProps} onCloseAsset={onCloseAsset} />);
  await user.click(screen.getByRole('button', { name: /close config\.json/i }));
  expect(onCloseAsset).toHaveBeenCalledWith('a1');
});

test('renders no asset tabs when assetTabs prop is omitted', () => {
  render(
    <FileTabs
      files={files}
      selectedFileId="f1"
      dirtyFileIds={[]}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  );
  expect(screen.queryByRole('tab', { name: /config\.json/ })).not.toBeInTheDocument();
});
