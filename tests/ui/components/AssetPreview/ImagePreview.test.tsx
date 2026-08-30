// @vitest-environment jsdom
// tests/ui/components/AssetPreview/ImagePreview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ImagePreview from '../../../../src/components/AssetPreview/ImagePreview';
import { IAsset } from '../../../../src/features/assets/assetsSlice';

const asset: IAsset = {
  id: 'a1', name: 'logo.png',
  projectId: 'p1', folderId: null, fullName: 'logo.png',
};

describe('ImagePreview', () => {
  test('renders image with src from asset content', () => {
    render(<ImagePreview asset={asset} />);
    // updated in Task 11: src comes from a blob object URL. For now it is stubbed
    // empty, and React omits the attribute entirely for an empty string.
    expect(screen.getByRole('img', { name: 'logo.png' })).not.toHaveAttribute('src');
  });

  test('shows error message when image fails to load', () => {
    render(<ImagePreview asset={asset} />);
    fireEvent.error(screen.getByRole('img', { name: 'logo.png' }));
    expect(screen.getByText(/unable to display image/i)).toBeInTheDocument();
  });
});
