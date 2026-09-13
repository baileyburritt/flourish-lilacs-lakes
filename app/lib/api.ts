// E2 (§03): the API base URL for the Fastify service E1/E5 build out. There
// is no deployed environment yet — this points at a local dev server, and
// gets a real per-environment value (dev/staging/prod) when E5 ships and
// deployment (Stage F) exists. Not committed as a secret: it's a plain
// endpoint address, not a credential.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type MeResponse = { userId: string };

// Proves the E2 done-when — "the API receives a verified user id on every
// authenticated request" — by actually making that request, not just
// wiring the client and server halves in isolation. Callers pass the Clerk
// session token from `useAuth().getToken()`.
export async function fetchMe(token: string): Promise<MeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`GET /api/v1/me failed: ${response.status}`);
  }
  return response.json();
}

// E8 (§12): Apple 5.1.1(v) requires in-app account deletion. Calls the
// server/src/routes/account.ts endpoint, which removes the user's gem
// photo/audio storage objects, the Clerk account, and the local user row
// (cascading to trips/gems/bookmarks) before this resolves.
export async function deleteAccount(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`DELETE /api/v1/account failed: ${response.status}`);
  }
}
