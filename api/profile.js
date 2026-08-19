import supabase from './db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const result = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: 'customer',
        }).select().single();
        if (result.error) throw result.error;
        data = result.data;
      }
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const { full_name = '', phone = '' } = req.body ?? {};
      const { data: current } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name,
        phone,
        role: current?.role || 'customer',
      }, { onConflict: 'id', ignoreDuplicates: false }).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profile API error:', err.message);
    return res.status(500).json({ error: 'Unable to update profile' });
  }
}
