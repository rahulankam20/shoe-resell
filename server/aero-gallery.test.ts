import { describe, expect, it } from 'vitest';
import { getAeroAvailableSizes, getAeroHeroProduct, getAeroInitialSize } from '../src/lib/aeroGallery';

describe('Aero Gallery stock-aware presentation helpers', () => {
  const product = {
    sizes: ['7', '8', '9'],
    stock: { '7': 0, '8': 2, '9': 1 },
    preferred_size: '9',
  };

  it('shows only currently available sizes in the hero purchase rail', () => {
    expect(getAeroAvailableSizes(product)).toEqual(['8', '9']);
  });

  it('uses an available preferred size and safely falls back to the first available size', () => {
    expect(getAeroInitialSize(product)).toBe('9');
    expect(getAeroInitialSize({ ...product, preferred_size: '7' })).toBe('8');
  });

  it('uses a deal when no featured product exists and returns an explicit empty result otherwise', () => {
    expect(getAeroHeroProduct([], ['deal-object'])).toBe('deal-object');
    expect(getAeroHeroProduct([], [])).toBeNull();
  });
});
