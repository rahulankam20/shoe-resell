import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { return this; },
  };
}

async function loadUsersHandler() {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role';
  const mod = await import('../../api/users.js');
  return mod.default;
}

// Any Supabase lookup goes through fetch; count calls so a test can prove the
// handler rejected the request before touching the database.
async function withFetchSpy(fn) {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('network disabled in tests');
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
  return calls;
}

for (const action of ['reset_password', 'check_email']) {
  test(`unauthenticated POST /api/users?action=${action} is rejected without any lookup`, async () => {
    const handler = await loadUsersHandler();
    const res = mockRes();
    const fetchCalls = await withFetchSpy(() => handler({
      method: 'POST',
      headers: {},
      query: { action },
      body: { email: 'admin@example.com', password: 'attacker-chosen-password' },
    }, res));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Please sign in to continue');
    assert.equal(fetchCalls, 0, 'handler must not query Supabase for an unauthenticated request');
  });
}

test('users API never changes passwords with the service role', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'api/users.js'), 'utf8');
  assert.ok(!source.includes('updateUserById'), 'api/users.js must not call auth.admin.updateUserById');
  assert.ok(!source.includes('reset_password'), 'api/users.js must not expose a reset_password action');
  assert.ok(!source.includes('check_email'), 'api/users.js must not expose a check_email action');
});

test('RLS migrations do not let users write their own profile role', () => {
  const rls = fs.readFileSync(path.resolve(process.cwd(), 'migrations/002_rls_policies.sql'), 'utf8');
  assert.ok(!/CREATE POLICY "profiles_self_update"/.test(rls), '002 must not create profiles_self_update');
  assert.ok(!/CREATE POLICY "profiles_self_insert"/.test(rls), '002 must not create profiles_self_insert');

  const lock = fs.readFileSync(path.resolve(process.cwd(), 'migrations/003_lock_profile_role.sql'), 'utf8');
  assert.ok(lock.includes('DROP POLICY IF EXISTS "profiles_self_update" ON profiles;'));
  assert.ok(lock.includes('DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;'));
  assert.ok(/CHECK \(role IN \('customer', 'admin'\)\)/.test(lock));
});
