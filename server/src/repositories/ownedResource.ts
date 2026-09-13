import { and, eq } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import { db } from '../db/client.js';

type OwnedTable = PgTable & { id: AnyPgColumn; userId: AnyPgColumn };

// E5 (§12): the one place every gem/trip/bookmark query is scoped to its
// owner. A `WHERE user_id = ?` repeated per handler is correct until the day
// someone adds the thirteenth endpoint and forgets it (§12's specific
// finding) — every route in src/routes/* reads or writes through one of
// these instead of querying the table directly.
//
// `table` is cast to `any` at each drizzle call site below: drizzle's query
// builder generics don't resolve through a table typed as a generic `T
// extends PgTable`, only through the concrete table type each call site
// actually has. The public return type is reconstructed from `T['$inferSelect']`
// instead, so callers (gemsRepo, tripsRepo, bookmarksRepo) still get the
// right row shape.
export function ownedResourceRepo<T extends OwnedTable>(table: T) {
  type Row = T['$inferSelect'];
  const anyTable = table as unknown as PgTable;

  return {
    // E11 (§04, §16): the audio-memo capture flow needs a gem to attach the
    // upload to, and nothing before this ticket ever created one outside a
    // test fixture's direct db.insert. `userId` is spread in last so a
    // caller-supplied `data.userId` (there shouldn't be one — pick() in
    // src/routes/gems.ts whitelists columns, and `userId` isn't among them)
    // can never override the authenticated owner.
    create: async (userId: string, data: Record<string, unknown>): Promise<Row> => {
      const rows = (await db
        .insert(anyTable)
        .values({ ...data, userId })
        .returning()) as Row[];
      return rows[0];
    },

    list: (userId: string): Promise<Row[]> =>
      db.select().from(anyTable).where(eq(table.userId, userId)) as unknown as Promise<Row[]>,

    find: async (id: string, userId: string): Promise<Row | undefined> => {
      const rows = (await db
        .select()
        .from(anyTable)
        .where(and(eq(table.id, id), eq(table.userId, userId)))) as Row[];
      return rows[0];
    },

    update: async (id: string, userId: string, patch: Record<string, unknown>): Promise<Row | undefined> => {
      const rows = (await db
        .update(anyTable)
        .set(patch)
        .where(and(eq(table.id, id), eq(table.userId, userId)))
        .returning()) as Row[];
      return rows[0];
    },

    remove: async (id: string, userId: string): Promise<Row | undefined> => {
      const rows = (await db
        .delete(anyTable)
        .where(and(eq(table.id, id), eq(table.userId, userId)))
        .returning()) as Row[];
      return rows[0];
    },
  };
}
