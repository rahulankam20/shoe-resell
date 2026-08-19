const buckets = new Map();

function hasUpstashEnv() {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || process.env.UPSTASH_REDIS_URL
    || process.env.REDIS_URL,
  );
}

const upstashLimiters = new Map();
let upstashRedis = null;
let upstashModules = null;

async function loadUpstash() {
  if (upstashModules) return upstashModules;
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import('@upstash/ratelimit'),
    import('@upstash/redis'),
  ]);
  upstashModules = { Ratelimit, Redis };
  return upstashModules;
}

async function getUpstashLimiter(limit, windowMs) {
  const cacheKey = `${limit}:${windowMs}`;
  if (upstashLimiters.has(cacheKey)) return upstashLimiters.get(cacheKey);
  const { Ratelimit, Redis } = await loadUpstash();
  if (!upstashRedis) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      upstashRedis = Redis.fromEnv();
    } else {
      const url = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN || '';
      upstashRedis = new Redis({ url, token });
    }
  }
  const windowSeconds = Math.max(1, Math.ceil(Number(windowMs) / 1000));
  const limiter = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: 'solevault:rl',
    analytics: false,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const current = buckets.get(key) || [];
  const fresh = current.filter((ts) => now - ts < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return { ok: false, retryAfterMs: windowMs - (now - fresh[0]) };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.length || now - v[v.length - 1] > windowMs * 2) buckets.delete(k);
    }
  }
  return { ok: true, remaining: limit - fresh.length };
}

export async function enforceRateLimit(res, key, limit, windowMs) {
  if (hasUpstashEnv()) {
    try {
      const limiter = await getUpstashLimiter(limit, windowMs);
      const result = await limiter.limit(key);
      if (!result.success) {
        const retryAfter = Math.max(1, Math.ceil(((result.reset || Date.now() + windowMs) - Date.now()) / 1000));
        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Rate limit backend unavailable, using local fallback:', error.message);
    }
  }

  const result = rateLimit(key, limit, windowMs);
  if (!result.ok) {
    res.setHeader('Retry-After', String(Math.ceil((result.retryAfterMs || windowMs) / 1000)));
    res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
    return false;
  }
  return true;
}
