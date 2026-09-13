import type { FastifyInstance } from 'fastify';
import { clerkClient } from '@clerk/fastify';
import { eq } from 'drizzle-orm';

import { requireAuth } from '../auth.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { deleteObject } from '../lib/storage.js';
import { gemsRepo } from '../repositories/index.js';

// E8 (§12): Apple App Store guideline 5.1.1(v) requires in-app account
// deletion for any app that offers account creation. The DB half of this
// was already correct from E1 — every table that hangs off users.id (trips,
// user_private_gems, bookmarks, and itinerary_stops transitively through
// trips) is ON DELETE CASCADE — but a cascaded row delete never touches R2,
// so a user's photos and audio memos would otherwise survive in the bucket
// as objects nothing references any more. This route closes that gap:
// enumerate the storage keys the DB still knows about *before* the cascade
// removes the rows naming them, delete those objects, then delete the
// Clerk account and the local user row (Clerk-then-DB mirrors
// server/test/helpers.ts's deleteTestUser).
//
// Retention: deletion is immediate, with no grace period or soft-delete
// window. §12's finding was the absence of a stated policy, not a request
// for a specific delay — a product whose entire privacy promise is that
// gems are the user's alone has no reason to retain their content after
// they've asked for it to be gone.
export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.delete('/', async (request) => {
    const userId = request.userId!;

    const gems = await gemsRepo.list(userId);
    const keys = gems.flatMap((gem) => (gem.audioUrl ? [...gem.photoUrls, gem.audioUrl] : gem.photoUrls));
    await Promise.all(keys.map((key) => deleteObject(key)));

    await clerkClient.users.deleteUser(userId);
    await db.delete(users).where(eq(users.id, userId));

    return { ok: true };
  });
}
