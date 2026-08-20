import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

function sanitizeAddress(body) {
  return {
    label: String(body.label || 'Home').trim().slice(0, 40),
    full_name: String(body.full_name || '').trim().slice(0, 100),
    phone: String(body.phone || '').replace(/\D/g, '').slice(0, 15),
    line1: String(body.line1 || '').trim().slice(0, 200),
    line2: String(body.line2 || '').trim().slice(0, 200),
    city: String(body.city || '').trim().slice(0, 60),
    state: String(body.state || '').trim().slice(0, 60),
    postal_code: String(body.postal_code || '').trim().slice(0, 10),
    is_default: Boolean(body.is_default),
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const raw = req.body ?? {};
      const body = sanitizeAddress(raw);
      if (!body.full_name || !body.phone || !body.line1 || !body.city || !body.state || !body.postal_code) {
        return res.status(400).json({ error: 'Complete all required address fields' });
      }
      if (!/^\d{6}$/.test(body.postal_code)) {
        return res.status(400).json({ error: 'PIN code must be exactly 6 digits' });
      }
      if (body.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('addresses').insert({
        user_id: user.id,
        label: body.label,
        full_name: body.full_name,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postal_code: body.postal_code,
        is_default: body.is_default,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...raw } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'Address id required' });
      const body = sanitizeAddress(raw);
      if (body.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('addresses').update(body).eq('id', Number(id)).eq('user_id', user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'Address id required' });
      const { error } = await supabase.from('addresses').delete().eq('id', Number(id)).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Addresses API error:', err.message);
    return res.status(500).json({ error: 'Unable to update addresses' });
  }
}
