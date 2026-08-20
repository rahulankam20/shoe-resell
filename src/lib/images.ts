export const BRAND_FALLBACKS: Record<string, string> = {
  nike: '/images/products/nike-pegasus.jpg',
  adidas: '/images/products/adidas-ultraboost.jpg',
  puma: '/images/products/puma-rsx.jpg',
  'new-balance': '/images/products/nb-550.jpg',
  asics: '/images/products/asics-gel.jpg',
  reebok: '/images/products/reebok-classic.jpg',
  skechers: '/images/products/common-projects.jpg',
  jordan: '/images/products/jordan-mid.jpg',
  converse: '/images/products/converse-chuck.jpg',
  vans: '/images/products/vans-oldskool.jpg',
  salomon: '/images/products/salomon-trail.jpg',
  crocs: '/images/products/crocs-clog.jpg',
};

export const PRODUCT_SLUG_MAP: Record<string, string> = {
  'air-max-90': '/images/products/nike-women.jpg',
  'air-force-1-07': '/images/products/jordan-mid.jpg',
  'pegasus-41': '/images/products/nike-pegasus.jpg',
  'nike-cortez': '/images/products/nike-women.jpg',
  'metcon-9': '/images/products/nike-pegasus.jpg',
  'ultraboost-22': '/images/products/adidas-ultraboost.jpg',
  'stan-smith': '/images/products/common-projects.jpg',
  'grand-court-2': '/images/products/adidas-ultraboost.jpg',
  'powerlift-5': '/images/products/adidas-ultraboost.jpg',
  'suede-classic-xxi': '/images/products/puma-rsx.jpg',
  'cali-sport': '/images/products/puma-rsx.jpg',
  'fuse-2': '/images/products/puma-rsx.jpg',
  '574-core': '/images/products/nb-550.jpg',
  'fresh-foam-1080v13': '/images/products/nb-550.jpg',
  'gel-kayano-30': '/images/products/asics-gel.jpg',
  'skechers-dlites': '/images/products/common-projects.jpg',
  'nano-x3': '/images/products/reebok-classic.jpg',
};

const BLOCKED_DOMAINS = [
  'static.nike.com',
  'assets.adidas.com',
  'images.puma.com',
  'assets.reebok.com',
  'www.skechers.in',
  'images.asics.com',
];

export function getProductImage(
  product?: { slug?: string; brand_slug?: string; brand?: string; images?: string[] } | null,
  index = 0
): string {
  if (!product) return '/images/solevault-hero.webp';
  const rawImage = product.images?.[index] || product.images?.[0];

  // If local valid image path
  if (rawImage && rawImage.startsWith('/images/')) {
    return rawImage;
  }

  // If product slug has a verified high-res local asset
  if (product.slug && PRODUCT_SLUG_MAP[product.slug]) {
    return PRODUCT_SLUG_MAP[product.slug];
  }

  // Check if image is an external URL from a domain that blocks hotlinking
  if (rawImage) {
    const isBlocked = BLOCKED_DOMAINS.some((domain) => rawImage.includes(domain));
    if (!isBlocked && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      return rawImage;
    }
  }

  // Fallback by brand
  const bKey = (product.brand_slug || product.brand || '').toLowerCase().trim().replace(/\s+/g, '-');
  if (BRAND_FALLBACKS[bKey]) {
    return BRAND_FALLBACKS[bKey];
  }

  return '/images/solevault-hero.webp';
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = '/images/solevault-hero.webp'
) {
  const target = event.currentTarget;
  if (!target.src.includes(fallback)) {
    target.src = fallback;
  }
}
