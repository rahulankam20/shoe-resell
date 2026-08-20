import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data: wishes, error } = await supabase.from('wishlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      const ids = (wishes ?? []).map((wish) => wish.product_id);
      if (!ids.length) return res.status(200).json([]);
      const { data: products, error: productError } = await supabase.from('products').select('*').in('id', ids);
      if (productError) throw productError;
      const merged = (wishes ?? []).map((wish) => {
        const product = products.find((item) => item.id === wish.product_id);
        return product ? {
          ...product,
          wishlist_id: wish.id,
          preferred_size: wish.size,
          discount: Math.round(((Number(product.mrp) - Number(product.sale_price)) / Number(product.mrp || 1)) * 100),
        } : null;
      }).filter(Boolean);
      return res.status(200).json(merged);
    }

    if (req.method === 'POST') {
      const { product_id, size = null } = req.body ?? {};
      if (!product_id) return res.status(400).json({ error: 'Product is required' });
      const { data: existing } = await supabase.from('wishlists').select('*').eq('user_id', user.id).eq('product_id', Number(product_id)).maybeSingle();
      if (existing) return res.status(200).json(existing);
      const { data, error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: Number(product_id), size }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { product_id } = req.body ?? {};
      const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', Number(product_id));
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Wishlist API error:', err.message);
    return res.status(500).json({ error: 'Unable to update wishlist' });
  }
}
