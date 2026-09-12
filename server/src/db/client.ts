import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required (see .env.example)');
}

// Direct (non-pooled) connection — required for migrations and safe for the
// low request volume this service handles pre-launch. Revisit (pooled/
// -pooler host) once E5's endpoints see real concurrent traffic.
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
