import supabase from '../db-client.js';

export async function getUser(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function requireUser(req, res) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in to continue' });
    return null;
  }
  return user;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function isAdmin(user) {
  if (!user) return false;
  const profile = await getProfile(user.id);
  return profile?.role === 'admin';
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!await isAdmin(user)) {
    res.status(403).json({ error: 'Administrator access required' });
    return null;
  }
  return user;
}
