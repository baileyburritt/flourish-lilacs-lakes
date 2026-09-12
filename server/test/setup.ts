// Runs before any test file's imports evaluate (vitest.config.ts's
// setupFiles) — otherwise @clerk/fastify's module-level client singleton
// reads process.env.CLERK_SECRET_KEY before dotenv has populated it,
// since test files import src/app.js directly rather than going through
// index.ts (the only file that previously had this import).
import 'dotenv/config';
