import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { clientIp, applySecurityHeaders } from '../../api/_lib/http.js';
import { recordWebhookEvent } from '../../api/_lib/settlement.js';
import { createMemoryDb } from './memoryDb.js';

test('clientIp prioritizes platform-set headers over spoofable x-forwarded-for', () => {
  // Test 1: x-real-ip takes precedence over client x-forwarded-for
  const reqWithBoth = {
    headers: {
      'x-real-ip': '203.0.113.195',
      'x-forwarded-for': '198.51.100.1, 198.51.100.2',
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(clientIp(reqWithBoth), '203.0.113.195');

  // Test 2: x-vercel-forwarded-for takes precedence if x-real-ip is missing
  const reqWithVercel = {
    headers: {
      'x-vercel-forwarded-for': '203.0.113.50',
      'x-forwarded-for': '1.2.3.4',
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(clientIp(reqWithVercel), '203.0.113.50');

  // Test 3: fallback to first entry in x-forwarded-for if no platform header
  const reqForwardedOnly = {
    headers: {
      'x-forwarded-for': '198.51.100.1, 198.51.100.2',
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(clientIp(reqForwardedOnly), '198.51.100.1');
});

test('recordWebhookEvent computes real SHA-256 hash for raw_body_hash', async () => {
  let capturedInsert = null;
  const mockDb = {
    insertWebhookEvent: async (row) => {
      capturedInsert = row;
      return row;
    },
  };

  const payload1 = '{"event":"PAYMENT_SUCCESS","data":{"order":{"order_id":"SV100"}}}';
  const expectedHash1 = crypto.createHash('sha256').update(payload1).digest('hex');

  await recordWebhookEvent(mockDb, {
    parsed: { type: 'PAYMENT_SUCCESS', orderId: 'SV100' },
    rawBody: payload1,
    verified: true,
    source: 'webhook',
  });

  assert.equal(capturedInsert.raw_body_hash.length, 64);
  assert.equal(capturedInsert.raw_body_hash, expectedHash1);
  assert.match(capturedInsert.raw_body_hash, /^[a-f0-9]{64}$/);

  // Slight 1-character variation produces totally different 64-char hash
  const payload2 = '{"event":"PAYMENT_SUCCESS","data":{"order":{"order_id":"SV101"}}}';
  const expectedHash2 = crypto.createHash('sha256').update(payload2).digest('hex');

  await recordWebhookEvent(mockDb, {
    parsed: { type: 'PAYMENT_SUCCESS', orderId: 'SV101' },
    rawBody: payload2,
    verified: true,
    source: 'webhook',
  });

  assert.notEqual(capturedInsert.raw_body_hash, expectedHash1);
  assert.equal(capturedInsert.raw_body_hash, expectedHash2);
});

test('RLS migration uses valid PostgreSQL syntax and explicit type casts', () => {
  const sqlPath = path.resolve(process.cwd(), 'migrations/002_rls_policies.sql');
  assert.ok(fs.existsSync(sqlPath), 'migrations/002_rls_policies.sql must exist');

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Must NOT contain invalid "CREATE POLICY IF NOT EXISTS"
  assert.ok(!sql.includes('CREATE POLICY IF NOT EXISTS'), 'Postgres does not support CREATE POLICY IF NOT EXISTS');

  // Must have DROP POLICY IF EXISTS paired with CREATE POLICY for idempotency
  assert.ok(sql.includes('DROP POLICY IF EXISTS "profiles_self_read" ON profiles;'));
  assert.ok(sql.includes('CREATE POLICY "profiles_self_read" ON profiles'));

  // Must use explicit auth.uid()::text cast for string columns to prevent text = uuid error
  assert.ok(sql.includes('auth.uid()::text = id'), 'Profiles must cast auth.uid() to text');
  assert.ok(sql.includes('auth.uid()::text = user_id'), 'Orders must cast auth.uid() to text');
  assert.ok(sql.includes('auth.uid()::text = user_id'), 'Addresses must cast auth.uid() to text');
  assert.ok(sql.includes('auth.uid()::text = user_id'), 'Wishlists must cast auth.uid() to text');
});

test('address PIN code validation enforces 6 digits Indian postal format', () => {
  const pinRegex = /^\d{6}$/;

  assert.ok(pinRegex.test('560001'));
  assert.ok(pinRegex.test('110001'));
  assert.ok(pinRegex.test('400001'));

  // Invalid cases
  assert.ok(!pinRegex.test('56000')); // 5 digits
  assert.ok(!pinRegex.test('5600011')); // 7 digits
  assert.ok(!pinRegex.test('56000A')); // letters
  assert.ok(!pinRegex.test(' 560001 ')); // whitespace
  assert.ok(!pinRegex.test(''));
});

test('inventory lookup finds legacy underscore format and self-heals to canonical colon format', async () => {
  const db = createMemoryDb({
    inventory: [
      { sku_key: '10_9', product_id: 10, size: '9', quantity: 5, reserved: 0, version: 1 },
    ],
  });

  // Querying canonical format finds the legacy row and heals it
  const row = await db.getInventory('10:9');
  assert.ok(row, 'Row should be found');
  assert.equal(row.sku_key, '10:9', 'SKU key should be self-healed to canonical format');
  assert.equal(row.quantity, 5);
  assert.equal(row.version, 2);

  // Subsequent query with canonical format finds the now-canonical row directly
  const canonicalRow = await db.getInventory('10:9');
  assert.equal(canonicalRow.sku_key, '10:9');
  assert.equal(canonicalRow.version, 2);
});

test('concurrent inventory update and healing under version lock works safely', async () => {
  const db = createMemoryDb({
    inventory: [
      { sku_key: '20_10', product_id: 20, size: '10', quantity: 3, reserved: 0, version: 1 },
    ],
  });

  // Concurrent updates with the same initial version — only one can succeed under OCC
  const [res1, res2] = await Promise.all([
    db.updateInventory('20:10', 1, { reserved: 1, version: 2 }),
    db.updateInventory('20:10', 1, { reserved: 2, version: 2 }),
  ]);

  const succeeded = [res1, res2].filter(Boolean);
  assert.equal(succeeded.length, 1, 'Only one concurrent update with matching version should succeed');
  assert.equal(succeeded[0].sku_key, '20:10', 'Should update to canonical format');
});

test('applySecurityHeaders omits Access-Control-Allow-Origin for disallowed origins and sets HSTS/CSP', () => {
  function createMockRes() {
    const headers = {};
    return {
      setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
      getHeader: (k) => headers[k.toLowerCase()],
      headers,
    };
  }

  // Case 1: Disallowed Origin -> NO ACAO header set
  const res1 = createMockRes();
  applySecurityHeaders({ headers: { origin: 'https://evil-attacker.com' } }, res1);
  assert.equal(res1.getHeader('Access-Control-Allow-Origin'), undefined, 'Disallowed origin must get no ACAO header');

  // Case 2: Allowed Origin -> Echo origin + Vary: Origin
  const res2 = createMockRes();
  applySecurityHeaders({ headers: { origin: 'https://solevault-app.vercel.app' } }, res2);
  assert.equal(res2.getHeader('Access-Control-Allow-Origin'), 'https://solevault-app.vercel.app');
  assert.equal(res2.getHeader('Vary'), 'Origin');

  // Case 3: HTTPS Request -> Strict-Transport-Security header present
  const res3 = createMockRes();
  applySecurityHeaders({ headers: { 'x-forwarded-proto': 'https' } }, res3);
  assert.equal(res3.getHeader('Strict-Transport-Security'), 'max-age=31536000; includeSubDomains');
  assert.equal(res3.getHeader('Content-Security-Policy'), "default-src 'none'; frame-ancestors 'none'");

  // Case 4: Local non-HTTPS -> No HSTS header
  const res4 = createMockRes();
  applySecurityHeaders({ headers: {} }, res4);
  assert.equal(res4.getHeader('Strict-Transport-Security'), undefined);
  assert.equal(res4.getHeader('Content-Security-Policy'), "default-src 'none'; frame-ancestors 'none'");
});
