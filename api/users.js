import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser, isAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const userIsAdmin = await isAdmin(user);
    const isProfileScope = req.query?.scope === 'profile' || req.query?.profile === 'true' || !userIsAdmin;

    if (req.method === 'GET') {
      if (isProfileScope) {
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

      // Admin user list
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      if (isProfileScope || req.body?.full_name !== undefined) {
        const { full_name = '', phone = '' } = req.body ?? {};
        const sanitizedName = String(full_name).trim().slice(0, 100);
        const sanitizedPhone = String(phone).replace(/\D/g, '').slice(0, 15);
        if (sanitizedName.length > 0 && sanitizedName.length < 2) {
          return res.status(400).json({ error: 'Full name must be at least 2 characters' });
        }
        const { data: current } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const { data, error } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: sanitizedName,
          phone: sanitizedPhone,
          role: current?.role || 'customer',
        }, { onConflict: 'id', ignoreDuplicates: false }).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      // Admin role change
      if (!userIsAdmin) return res.status(403).json({ error: 'Admin access required' });
      const { id, role } = req.body ?? {};
      if (!id || !['customer', 'admin'].includes(role)) return res.status(400).json({ error: 'Valid user and role required' });
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Users API error:', err.message);
    return res.status(500).json({ error: 'Unable to process user request' });
  }
}
