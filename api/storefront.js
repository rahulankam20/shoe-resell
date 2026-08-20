import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';

const addDiscount = (product) => ({
  ...product,
  discount: Math.round(((Number(product.mrp) - Number(product.sale_price)) / Number(product.mrp || 1)) * 100),
});

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

    // Derive brands from products (no separate brands table needed)
    const brandMap = new Map();
    for (const p of products) {
      if (!p.brand_slug) continue;
      if (!brandMap.has(p.brand_slug)) {
        brandMap.set(p.brand_slug, {
          slug: p.brand_slug,
          name: p.brand,
          product_count: 0,
          hero_image: p.images?.[0] || null,
        });
      }
      brandMap.get(p.brand_slug).product_count += 1;
    }
    const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Derive categories from products (no separate categories table needed)
    const categoryMap = new Map();
    for (const p of products) {
      if (!p.category_slug) continue;
      if (!categoryMap.has(p.category_slug)) {
        categoryMap.set(p.category_slug, {
          slug: p.category_slug,
          name: p.category,
          product_count: 0,
        });
      }
      categoryMap.get(p.category_slug).product_count += 1;
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
