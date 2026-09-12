import 'dotenv/config';
import { sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import { db, pool } from './client.js';
import { destinations, events, itineraryStops, trips, userPrivateGems, users } from './schema.js';

// Asserts E1's done-when criteria actually held after db:migrate + db:seed
// ran, rather than trusting that a zero exit code meant the data is there.

async function count(table: PgTable, label: string) {
  const rows = await db.select().from(table);
  if (rows.length === 0) {
    throw new Error(`Expected at least one seeded row in ${label}, found none.`);
  }
  console.log(`${label}: ${rows.length} row(s)`);
  return rows;
}

async function main() {
  await count(users, 'users');
  await count(destinations, 'destinations');
  await count(events, 'events');
  await count(trips, 'trips');
  await count(itineraryStops, 'itinerary_stops');
  const gems = await count(userPrivateGems, 'user_private_gems');

  const gem = gems[0];
  const missing: string[] = [];
  if (!gem.landmarkNote) missing.push('landmark_note');
  if (!gem.audioUrl) missing.push('audio_url');
  if (!gem.idealSeason) missing.push('ideal_season');
  if (!gem.goldenHour) missing.push('golden_hour');
  if (missing.length > 0) {
    throw new Error(`§04 gap columns did not round-trip on user_private_gems: ${missing.join(', ')}`);
  }

  const extensions = await db.execute(sql`SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'postgis')`);
  const found = extensions.rows.map((r: any) => r.extname).sort();
  if (found.length !== 2) {
    throw new Error(`Expected pgcrypto and postgis extensions enabled, found: ${found.join(', ') || '(none)'}`);
  }
  console.log('Extensions enabled:', found.join(', '));

  console.log('Verification passed.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
