import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import db from './_lib/db.js';
import { skuKey } from './_lib/inventory.js';

const withDiscount = (product) => ({
  ...product,
  discount: Math.round(((Number(product.mrp) - Number(product.sale_price)) / Number(product.mrp || 1)) * 100),
});

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function syncInventoryFromProduct(product) {
  const sizes = Array.isArray(product.sizes) ? product.sizes.map(String) : [];
  const stock = product.stock || {};
  for (const size of sizes) {
    await db.upsertInventory({
      sku_key: skuKey(product.id, size),
      product_id: product.id,
      size,
      quantity: Number(stock[size] || 0),
      reserved: 0,
      version: 1,
      updated_at: new Date().toISOString(),
    });
  }
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(250);
      if (error) throw error;
      const all = (data ?? []).map(withDiscount);

      if (req.query.id || req.query.slug) {
        const product = all.find((item) => (req.query.id ? item.id === Number(req.query.id) : item.slug === req.query.slug));
        return product ? res.status(200).json(product) : res.status(404).json({ error: 'Product not found' });
      }

      const values = (value) => String(value || '').split(',').filter(Boolean).map((entry) => entry.toLowerCase());
      const brands = values(req.query.brand);
      const categories = values(req.query.category);
      const sizes = values(req.query.size);
      const genders = values(req.query.gender);
      const search = String(req.query.search || '').trim().toLowerCase();
      const minPrice = Number(req.query.minPrice || 0);
      const maxPrice = Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER);
      const minDiscount = Number(req.query.discount || 0);

      let filtered = all.filter((product) => {
        const haystack = `${product.brand} ${product.name} ${product.category}`.toLowerCase();
        const productSizes = Array.isArray(product.sizes) ? product.sizes.map((size) => String(size).toLowerCase()) : [];
        return (!search || haystack.includes(search))
          && (!brands.length || brands.includes(String(product.brand_slug).toLowerCase()))
          && (!categories.length || categories.includes(String(product.category_slug).toLowerCase()))
          && (!sizes.length || sizes.some((size) => productSizes.includes(size)))
          && (!genders.length || genders.includes(String(product.gender).toLowerCase()))
          && Number(product.sale_price) >= minPrice
          && Number(product.sale_price) <= maxPrice
          && product.discount >= minDiscount;
      });

      const sort = String(req.query.sort || 'newest');
      if (sort === 'popular') filtered.sort((a, b) => b.popularity - a.popularity);
      if (sort === 'price-asc') filtered.sort((a, b) => Number(a.sale_price) - Number(b.sale_price));
      if (sort === 'price-desc') filtered.sort((a, b) => Number(b.sale_price) - Number(a.sale_price));
      if (sort === 'discount') filtered.sort((a, b) => b.discount - a.discount);
      return res.status(200).json(filtered);
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === 'POST') {
      const body = req.body ?? {};
      if (!body.brand || !body.name || !body.category || !body.mrp || !body.sale_price) {
        return res.status(400).json({ error: 'Brand, name, category, MRP and sale price are required' });
      }
      if (Number(body.sale_price) >= Number(body.mrp)) return res.status(400).json({ error: 'Sale price must be lower than MRP' });
      const record = {
        brand: body.brand,
        brand_slug: slugify(body.brand),
        name: body.name,
        slug: `${slugify(body.brand)}-${slugify(body.name)}-${Date.now().toString().slice(-5)}`,
        category: body.category,
        category_slug: slugify(body.category),
        description: body.description || '',
        images: Array.isArray(body.images) ? body.images : [],
        specifications: body.specifications || {},
        mrp: Number(body.mrp),
        sale_price: Number(body.sale_price),
        sizes: Array.isArray(body.sizes) ? body.sizes : [],
        stock: body.stock || {},
        gender: body.gender || 'Unisex',
        featured: Boolean(body.featured),
        popularity: Number(body.popularity || 0),
      };
      const { data, error } = await supabase.from('products').insert(record).select().single();
      if (error) throw error;
      await syncInventoryFromProduct(data);
      return res.status(201).json(withDiscount(data));
    }

    if (req.method === 'PUT') {
      const { id, ...body } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      const allowed = ['brand', 'name', 'category', 'description', 'images', 'specifications', 'mrp', 'sale_price', 'sizes', 'stock', 'gender', 'featured', 'popularity'];
      const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
      if (updates.brand) updates.brand_slug = slugify(updates.brand);
      if (updates.category) updates.category_slug = slugify(updates.category);
      if (updates.mrp) updates.mrp = Number(updates.mrp);
      if (updates.sale_price) updates.sale_price = Number(updates.sale_price);
      const { data, error } = await supabase.from('products').update(updates).eq('id', Number(id)).select().single();
      if (error) throw error;
      if (updates.stock || updates.sizes) await syncInventoryFromProduct(data);
      return res.status(200).json(withDiscount(data));
    }

    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      const { error } = await supabase.from('products').delete().eq('id', Number(id));
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Products API error:', err.message);
    return res.status(500).json({ error: 'Unable to process product request' });
  }
}
