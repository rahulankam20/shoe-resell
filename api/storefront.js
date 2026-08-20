import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';

const addDiscount = (product) => ({
  ...product,
  discount: Math.round(((Number(product.mrp) - Number(product.sale_price)) / Number(product.mrp || 1)) * 100),
});

const BRAND_HEROES = {
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

const CATEGORY_META = {
  sneakers: { image: '/images/category-sneakers.jpg', description: 'Lifestyle & Classics' },
  running: { image: '/images/category-running.jpg', description: 'Engineered For Distance' },
  casual: { image: '/images/category-casual.jpg', description: 'Everyday Comfort' },
  training: { image: '/images/category-training.jpg', description: 'Gym & Cross-Training' },
};

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(250);
    if (error) throw error;

    const products = (data ?? []).map(addDiscount);

    // Derive brands from products
    const brandMap = new Map();
    for (const p of products) {
      if (!p.brand_slug) continue;
      const bSlug = p.brand_slug.toLowerCase();
      if (!brandMap.has(bSlug)) {
        const localHero = BRAND_HEROES[bSlug] || '/images/solevault-hero.webp';
        brandMap.set(bSlug, {
          slug: bSlug,
          name: p.brand,
          product_count: 0,
          hero_image: localHero,
        });
      }
      brandMap.get(bSlug).product_count += 1;
    }
    const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Derive categories from products
    const categoryMap = new Map();
    for (const p of products) {
      if (!p.category_slug) continue;
      const cSlug = p.category_slug.toLowerCase();
      if (!categoryMap.has(cSlug)) {
        const meta = CATEGORY_META[cSlug] || {
          image: '/images/category-sneakers.jpg',
          description: `${p.category} Collection`,
        };
        categoryMap.set(cSlug, {
          slug: cSlug,
          name: p.category,
          image: meta.image,
          description: meta.description,
          product_count: 0,
        });
      }
      categoryMap.get(cSlug).product_count += 1;
    }
    const categories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      brands,
      categories,
      featured: products.filter((p) => p.featured).slice(0, 8),
      deals: [...products].sort((a, b) => b.discount - a.discount).slice(0, 4),
    });
  } catch (err) {
    console.error('Storefront API error:', err.message);
    return res.status(500).json({ error: 'Unable to load the storefront' });
  }
}
