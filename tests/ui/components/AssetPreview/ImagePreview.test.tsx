// @vitest-environment jsdom
// tests/ui/components/AssetPreview/ImagePreview.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ImagePreview from '../../../../src/components/AssetPreview/ImagePreview';
import { IAsset } from '../../../../src/features/assets/assetsSlice';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const asset: IAsset = {
  id: 'a1', name: 'logo.png',
  projectId: 'p1', folderId: null, fullName: 'logo.png',
};

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  (URL as unknown as { createObjectURL?: unknown }).createObjectURL ??= () => '';
  (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL ??= () => {};
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock/logo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  await putAssetBlob('a1', new Blob(['x'], { type: 'image/png' }));
});
afterEach(() => vi.restoreAllMocks());

describe('ImagePreview', () => {
  test('renders image with a blob URL from the asset blob store', async () => {
    render(<ImagePreview asset={asset} />);
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'logo.png' })).toHaveAttribute('src', 'blob:mock/logo'),
    );
  });

  test('shows error message when image fails to load', async () => {
    render(<ImagePreview asset={asset} />);
    await waitFor(() => screen.getByRole('img', { name: 'logo.png' }));
    fireEvent.error(screen.getByRole('img', { name: 'logo.png' }));
    expect(screen.getByText(/unable to display image/i)).toBeInTheDocument();
  });
});
