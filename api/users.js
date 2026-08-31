import supabase from './_lib/db-client.js';
import { applySecurityHeaders } from './_lib/http.js';
import { requireUser, isAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── Public Unauthenticated Endpoints (Reset Password & Check Email) ──
    if (req.method === 'POST') {
      const action = req.query?.action || req.body?.action;

      if (action === 'check_email') {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return res.status(400).json({ error: 'Please enter a valid email address' });
        }
        const { data: profile } = await supabase.from('profiles').select('id, email, full_name').ilike('email', email).maybeSingle();
        if (!profile) {
          return res.status(404).json({ error: 'No SOLEVAULT account found with this email address' });
        }
        return res.status(200).json({ exists: true, name: profile.full_name || 'Member' });
      }

      if (action === 'reset_password') {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const newPassword = String(req.body?.password || '');

        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return res.status(400).json({ error: 'Please enter a valid email address' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const { data: profile, error: pErr } = await supabase.from('profiles').select('id, email').ilike('email', email).maybeSingle();
        if (pErr || !profile) {
          return res.status(404).json({ error: 'No account found with this email address' });
        }

        if (supabase.auth?.admin?.updateUserById) {
          const { error: authErr } = await supabase.auth.admin.updateUserById(profile.id, {
            password: newPassword,
          });
          if (authErr) throw authErr;
        }

        return res.status(200).json({ success: true, message: 'Password has been updated successfully' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

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
