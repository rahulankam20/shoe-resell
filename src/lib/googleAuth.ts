import supabase from './supabase';

export async function signInWithGoogle(_appName = 'SOLEVAULT') {
  const redirectTo = `${window.location.origin}/account`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('Google Sign-In failed:', error.message || error);
    throw error;
  }

  return data;
}

export async function handleGoogleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('google_id_token');
  if (!token) return;
  window.history.replaceState({}, '', window.location.pathname);
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
  if (!error) {
    try {
      window.close();
    } catch {
      /* popup may already be closed */
    }
  }
}
