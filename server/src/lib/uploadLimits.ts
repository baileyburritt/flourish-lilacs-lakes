// E7 (§12): "photo and audio uploads are unbounded" — these are the caps
// referenced by src/routes/gems.ts's upload endpoints and by
// test/uploads.test.ts, kept in one place so the two stay in lockstep.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_PHOTOS_PER_GEM = 10;
