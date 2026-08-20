export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
}

export function updateMetaTags({
  title = 'SOLEVAULT — Original Footwear. Unreal Prices.',
  description = 'Original, brand-new footwear at 50–75% off MRP. Authentic sneakers, running shoes & casuals with secure UPI checkout via Cashfree.',
  keywords = ['sneakers', 'footwear', 'shoes', 'Nike', 'Adidas', 'original shoes', 'discounted footwear', 'India', 'UPI payment'],
  canonical,
  ogImage = '/images/solevault-hero.webp',
  ogType = 'website',
}: SeoMetadata = {}) {
  document.title = title;

  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  setMeta('description', description);
  setMeta('keywords', keywords.join(', '));
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:type', ogType, true);
  setMeta('og:image', ogImage, true);
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', ogImage);

  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }
}
