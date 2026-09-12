import 'dotenv/config';
import { sql } from 'drizzle-orm';

import { db, pool } from './client.js';
import { userPrivateGems } from './schema.js';

// E3 (§12) done-when: "a direct SQL attempt to set is_private = false is
// rejected by a constraint." Proves it against a real row, not just that
// the migration applied — an UPDATE ... SET is_private = false must fail,
// and every other column on the row must stay writable.

async function main() {
  const [gem] = await db
    .select({ id: userPrivateGems.id })
    .from(userPrivateGems)
    .limit(1);

  if (!gem) {
    throw new Error('No user_private_gems row to test against — run db:seed first.');
  }

  let rejected = false;
  try {
    await db.execute(sql`UPDATE user_private_gems SET is_private = false WHERE id = ${gem.id}`);
  } catch (err) {
    rejected = true;
    const cause = err instanceof Error ? (err.cause as { constraint?: string; message?: string } | undefined) : undefined;
    if (cause?.constraint !== 'user_private_gems_is_private_always_true') {
      const message = cause?.message ?? (err instanceof Error ? err.message : String(err));
      throw new Error(`UPDATE was rejected, but not by the expected constraint: ${message}`);
    }
  }

  if (!rejected) {
    throw new Error('UPDATE ... SET is_private = false succeeded — the constraint is not enforced.');
  }

  // The constraint should reject only that one column's value, not the row.
  await db
    .update(userPrivateGems)
    .set({ title: 'Seed Hidden Ledge (constraint check touched this)' })
    .where(sql`${userPrivateGems.id} = ${gem.id}`);

  console.log('is_private constraint verified: false rejected, other columns still writable.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
