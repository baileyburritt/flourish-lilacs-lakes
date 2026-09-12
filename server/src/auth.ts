import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuth } from '@clerk/fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

// E2 (§03): one place that turns "does this request carry a verified Clerk
// session" into either a 401 or a userId on the request — E5's endpoints
// (and their ownership-scoping work against E4's suite) build on this
// rather than each calling getAuth() themselves.
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const { isAuthenticated, userId } = getAuth(request);
  if (!isAuthenticated) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  request.userId = userId;
}
