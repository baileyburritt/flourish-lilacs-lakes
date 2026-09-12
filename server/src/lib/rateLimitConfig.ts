// E7 (§12): the numbers app.ts (per-IP) and auth.ts (per-user) enforce,
// pulled out so test/rateLimit.test.ts can compute how many requests to fire
// without duplicating the literals it's asserting against.
export const PER_IP_MAX_REQUESTS = 300;
export const PER_IP_WINDOW = '1 minute';

export const PER_USER_MAX_REQUESTS = 120;
export const PER_USER_WINDOW_MS = 60_000;
