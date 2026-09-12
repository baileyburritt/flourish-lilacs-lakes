import { bookmarks, trips, userPrivateGems } from '../db/schema.js';
import { ownedResourceRepo } from './ownedResource.js';

export const gemsRepo = ownedResourceRepo(userPrivateGems);
export const tripsRepo = ownedResourceRepo(trips);
export const bookmarksRepo = ownedResourceRepo(bookmarks);
