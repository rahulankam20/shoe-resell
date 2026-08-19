import supabase from './db-client.js';
import { applySecurityHeaders } from './_lib/http.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      // Derive categories from the products table (no separate categories table)
      const { data, error } = await supabase.from('products').select('category, category_slug').order('category');
      if (error) throw error;
      const categoryMap = new Map();
      for (const p of data ?? []) {
        if (!p.category_slug) continue;
        if (!categoryMap.has(p.category_slug)) {
          categoryMap.set(p.category_slug, { slug: p.category_slug, name: p.category, active: true, sort_order: 99 });
        }
      }
      return res.status(200).json(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    }
    // Admin write operations require a categories table — not supported in this schema
    return res.status(501).json({ error: 'Categories are managed via products in this deployment' });
  } catch (err) {
    console.error('Categories API error:', err.message);
    return res.status(500).json({ error: 'Unable to load categories' });
  }
}
