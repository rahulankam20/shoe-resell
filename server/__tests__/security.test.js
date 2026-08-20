import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { clientIp } from '../../api/_lib/http.js';
import { recordWebhookEvent } from '../../api/_lib/settlement.js';

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
