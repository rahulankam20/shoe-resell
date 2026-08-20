import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

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
      const body = req.body ?? {};
      if (!body.full_name || !body.phone || !body.line1 || !body.city || !body.state || !body.postal_code) {
        return res.status(400).json({ error: 'Complete all required address fields' });
      }
      if (body.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('addresses').insert({
        user_id: user.id,
        label: body.label || 'Home',
        full_name: body.full_name,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2 || '',
        city: body.city,
        state: body.state,
        postal_code: body.postal_code,
        is_default: Boolean(body.is_default),
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...body } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'Address id required' });
      if (body.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('addresses').update(body).eq('id', Number(id)).eq('user_id', user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
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
