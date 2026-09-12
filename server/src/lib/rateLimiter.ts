// E7 (§12): "no rate limiting anywhere" named unthrottled auth endpoints as
// the specific credential-stuffing risk (§12), which is a per-authenticated-
// user concern @fastify/rate-limit's IP-keyed default (app.ts) doesn't cover
// on its own — two callers behind the same NAT/proxy share an IP but not a
// budget. A single in-memory fixed-window counter is enough for the one
// Node process this runs on today; once there's more than one instance
// (Stage F) this needs a shared store (Redis) instead, the same way
// ensureUserSynced's lazy provisioning (auth.ts) is a placeholder for a
// Clerk webhook that has nowhere to call yet.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

// Test-only: lets rateLimit.test.ts start each case from a clean window
// instead of inheriting counts from whichever key another test used.
export function resetRateLimits(): void {
  buckets.clear();
}
