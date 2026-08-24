import type { Product } from '../types';

type StockAwareProduct = Pick<Product, 'preferred_size' | 'sizes' | 'stock'>;

export function getAeroAvailableSizes(product?: StockAwareProduct | null): string[] {
  if (!product) return [];

  return product.sizes.filter((size) => Number(product.stock?.[size] ?? 0) > 0);
}

export function getAeroInitialSize(product?: StockAwareProduct | null): string {
  if (!product) return '';

  const availableSizes = getAeroAvailableSizes(product);
  if (product.preferred_size && availableSizes.includes(product.preferred_size)) {
    return product.preferred_size;
  }

  return availableSizes[0] ?? product.sizes[0] ?? '';
}

export function getAeroHeroProduct<T>(featured?: T[] | null, deals?: T[] | null): T | null {
  return featured?.[0] ?? deals?.[0] ?? null;
}
