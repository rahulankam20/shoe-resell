import supabase from './db-client.js';
import { applySecurityHeaders } from './_lib/http.js';

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      // Derive brands from the products table (no separate brands table)
      const { data, error } = await supabase.from('products').select('brand, brand_slug').order('brand');
      if (error) throw error;
      const brandMap = new Map();
      for (const p of data ?? []) {
        if (!p.brand_slug) continue;
        if (!brandMap.has(p.brand_slug)) {
          brandMap.set(p.brand_slug, { slug: p.brand_slug, name: p.brand, active: true, sort_order: 99 });
        }
      }
      return res.status(200).json(Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    }
    // Admin write operations require a brands table — not supported in this schema
    return res.status(501).json({ error: 'Brands are managed via products in this deployment' });
  } catch (err) {
    console.error('Brands API error:', err.message);
    return res.status(500).json({ error: 'Unable to load brands' });
  }
}
