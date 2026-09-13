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

export type NewGemFields = {
  title: string;
  landmarkNote?: string;
  notes?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
};

export type CreatedGem = { id: string };

// E11 (§04, §16): server/src/routes/gems.ts's POST /, added for this ticket
// specifically so the audio-memo capture flow has a gem id to attach an
// upload to — E4's locked ownership contract never needed the client to
// create one before now.
export async function createGem(token: string, fields: NewGemFields): Promise<CreatedGem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/gems`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!response.ok) {
    throw new Error(`POST /api/v1/gems failed: ${response.status}`);
  }
  return response.json();
}

// E11 (§04, §16): uploads a just-recorded memo to the gem it belongs to via
// server/src/routes/gems.ts's POST /:id/audio (E7's upload path). `localUri`
// is whatever expo-audio's AudioRecorder left on disk (or a blob: URL on
// web) — fetching it for its blob is the standard Expo pattern for turning a
// local recording into upload bytes, on every platform this app targets.
export async function uploadGemAudioMemo(token: string, gemId: string, localUri: string): Promise<void> {
  const recording = await fetch(localUri);
  const blob = await recording.blob();
  const form = new FormData();
  form.append('audio', blob, 'memo.m4a');

  const response = await fetch(`${API_BASE_URL}/api/v1/gems/${gemId}/audio`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`POST /api/v1/gems/${gemId}/audio failed: ${response.status}`);
  }
}
