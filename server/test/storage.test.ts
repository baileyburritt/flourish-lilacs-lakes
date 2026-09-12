import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { deleteObject, putObject, rawObjectUrl, signedGetUrl } from '../src/lib/storage.js';

// E6 (§12, §16): the done-when is exactly these three requests against a
// real R2 bucket, not a mocked S3 client — the finding this ticket exists
// to close is "gem photos and audio memos have no access control," and a
// mock can't demonstrate that a raw storage URL is actually unreachable.
const testKey = `e6-storage-test/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`;
const testBody = 'e6 signed-url fixture, safe to delete';

beforeAll(async () => {
  await putObject(testKey, testBody, 'text/plain');
});

afterAll(async () => {
  await deleteObject(testKey);
});

// R2 stamps every response — including error responses — with its own
// server-side clock via the `Date` header. The expiry test below signs a
// URL against that clock instead of this machine's, so the assertion can't
// be thrown off by local clock drift (observed in this sandbox: requests
// signed "now" by this machine's clock and re-checked seconds later were
// still accepted, because R2's real clock trailed this machine's by more
// than the wait covered).
async function r2ServerNow(): Promise<Date> {
  const response = await fetch(rawObjectUrl(testKey));
  const header = response.headers.get('date');
  if (!header) throw new Error('R2 response carried no Date header to read the server clock from');
  return new Date(header);
}

describe('R2 signed URLs', () => {
  test('a raw, unsigned storage URL is rejected', async () => {
    const response = await fetch(rawObjectUrl(testKey));
    // R2's S3-compatible endpoint requires an auth mechanism on every
    // request; one carrying none at all is rejected as malformed (400)
    // before it ever gets to verifying a signature — a present-but-wrong
    // signature is the 403 case, proven by the expired-URL test below.
    expect(response.status).toBe(400);
  });

  test('a signed URL reaches the object', async () => {
    const url = await signedGetUrl(testKey, 900);
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(testBody);
  });

  test('an expired signed URL is rejected', async () => {
    const serverNow = await r2ServerNow();
    const signedTenMinutesAgo = new Date(serverNow.getTime() - 10 * 60 * 1000);
    const url = await signedGetUrl(testKey, 60, signedTenMinutesAgo);
    const response = await fetch(url);
    expect(response.status).toBe(403);
    expect(await response.text()).toContain('ExpiredRequest');
  });
});
