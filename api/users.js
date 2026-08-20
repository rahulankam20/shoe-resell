import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'PUT') {
      const { id, role } = req.body ?? {};
      if (!id || !['customer', 'admin'].includes(role)) return res.status(400).json({ error: 'Valid user and role required' });
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Users API error:', err.message);
    return res.status(500).json({ error: 'Unable to update users' });
  }
}
