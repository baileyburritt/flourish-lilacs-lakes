// E7 (§12): "photo and audio uploads are unbounded" — these are the caps
// referenced by src/routes/gems.ts's upload endpoints and by
// test/uploads.test.ts, kept in one place so the two stay in lockstep.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_PHOTOS_PER_GEM = 10;

// E10 (§03, §06): the catalog-image upload path (destination/event cover
// photos and galleries), same cap as a gem photo since both are single
// still images.
export const MAX_CATALOG_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
