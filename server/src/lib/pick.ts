// Whitelists PATCH bodies to known-mutable columns so a caller can't smuggle
// `id`, `userId`, or `isPrivate` (E3's always-true constraint) through an
// update payload.
export function pick<T extends Record<string, unknown>, K extends readonly (keyof T)[]>(
  obj: T | undefined | null,
  keys: K,
): Partial<T> {
  const result: Partial<T> = {};
  if (!obj) return result;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
