const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
]);

function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app')
      || host.endsWith('.designarena.ai')
      || host === 'designarena.ai'
      || host.endsWith('.arcada.app')
      || host === 'arcada.app';
  } catch {
    return false;
  }
}

export function applySecurityHeaders(req, res, methods = 'GET, POST, PUT, DELETE, OPTIONS') {
  const origin = req.headers?.origin;
  if (origin && originAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key, X-Reconcile-Secret');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export function cors(res, req, methods) {
  applySecurityHeaders(req || { headers: {} }, res, methods);
}

export function clientIp(req) {
  const headers = req?.headers || {};
  const realIp = headers['x-real-ip'] || headers['x-vercel-forwarded-for'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req?.socket?.remoteAddress || 'unknown';
}

export function appBaseUrl(req) {
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    return `${proto}://${host}`;
  }
  const envUrl = process.env.APP_BASE_URL || process.env.CASHFREE_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'http://localhost:5173';
}

function bufferRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const onData = (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks));
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      req.off?.('data', onData);
      req.off?.('end', onEnd);
      req.off?.('error', onError);
    };
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
  });
}

function alreadyBuffered(req) {
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return null;
}

export async function getRawBody(req) {
  const buffered = alreadyBuffered(req);
  if (buffered) {
    const text = buffered.toString('utf8');
    if (req.rawBody == null) req.rawBody = buffered;
    return text;
  }

  const canReadStream = req
    && typeof req.on === 'function'
    && req.readable !== false
    && req.readableEnded !== true
    && req.complete !== true;

  if (canReadStream) {
    const raw = await bufferRequest(req);
    req.rawBody = raw;
    const text = raw.toString('utf8');
    if (req.body == null) {
      try { req.body = text ? JSON.parse(text) : {}; } catch { req.body = {}; }
    }
    return text;
  }

  if (req?.body == null) return '';
  return JSON.stringify(req.body);
}

export function readRawBody(req) {
  const buffered = alreadyBuffered(req);
  if (buffered) return buffered.toString('utf8');
  if (req?.body == null) return '';
  return JSON.stringify(req.body);
}

export function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = readRawBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
