// @vitest-environment jsdom
// tests/ui/components/AssetPreview/AudioPreview.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioPreview from '../../../../src/components/AssetPreview/AudioPreview';
import { IAsset } from '../../../../src/features/assets/assetsSlice';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const asset: IAsset = {
  id: 'a1', name: 'theme.mp3',
  projectId: 'p1', folderId: null, fullName: 'theme.mp3',
};

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  (URL as unknown as { createObjectURL?: unknown }).createObjectURL ??= () => '';
  (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL ??= () => {};
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock/theme');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  await putAssetBlob('a1', new Blob(['x'], { type: 'audio/mpeg' }));
});
afterEach(() => vi.restoreAllMocks());

describe('AudioPreview', () => {
  test('shows the asset name label', () => {
    render(<AudioPreview asset={asset} />);
    expect(screen.getByText('theme.mp3')).toBeInTheDocument();
  });

  test('renders an audio element with a blob URL from the asset blob store', async () => {
    const { container } = render(<AudioPreview asset={asset} />);
    await waitFor(() => {
      const audio = container.querySelector('audio');
      expect(audio).not.toBeNull();
      expect(audio).toHaveAttribute('src', 'blob:mock/theme');
    });
  });
});
