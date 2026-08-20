import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

// Lazily created — defer createClient() until first use so that Vite's SSR
// middleware has time to patch process.env before this module is evaluated.
let _client = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment');
  _client = createClient(url, key, {
    global: {
      fetch: async (fetchUrl, options) => {
        const res = await fetch(fetchUrl, options);
        if (!res.ok && res.status >= 500) triggerRestore();
        return res;
      },
    },
  });
  return _client;
}

// Proxy so existing code using `supabase.from(...)` keeps working unchanged.
const supabase = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  },
});

export default supabase;
