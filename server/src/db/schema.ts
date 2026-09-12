import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// PRD §2.2, applied with §04's data-model gaps closed rather than as written —
// see docs/review.html §04 for the findings this schema resolves.

export const regionType = pgEnum('region_type', [
  'ROCHESTER_METRO',
  'CANANDAIGUA',
  'KEUKA_LAKE',
  'SENECA_LAKE',
  'GENESEE_VALLEY',
  'NIAGARA_FRONTIER',
]);

// Canonical gem/destination taxonomy resolved in C3 (§04 "three incompatible
// taxonomies" finding) — app/constants/categories.js is the other half of
// this source of truth and must stay in lockstep with these ids.
export const destinationCategory = pgEnum('destination_category', [
  'WINERY_BREWERY',
  'NATURE_WATERFALLS',
  'CULTURAL_HISTORIC',
  'DINING_MARKETS',
  'LIVE_VENUE',
  'CIVIC_LANDMARK',
]);

export const musicGenre = pgEnum('music_genre', [
  'JAZZ',
  'FOLK_ACOUSTIC',
  'INDIE_ROCK',
  'CLASSICAL_ORCHESTRAL',
  'BLUES_ROOTS',
  'ELECTRONIC',
]);

// §04 "Season and magic hour metadata: designed, unmodeled" — values lifted
// from the New Private Gem screen's chip set, which had nowhere to save to.
export const idealSeason = pgEnum('ideal_season', [
  'SPRING_LILAC',
  'SUMMER_WATERS',
  'GOLDEN_FOLIAGE',
  'WINTER_FROST',
]);

export const goldenHour = pgEnum('golden_hour', ['DAWN_MIST', 'GOLDEN_HOUR', 'DEEP_TWILIGHT', 'MIDDAY_SUN']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const destinations = pgTable('destinations', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  description: text('description').notNull(),
  region: regionType('region').notNull(),
  category: destinationCategory('category').notNull(),
  addressStreet: text('address_street'),
  city: varchar('city', { length: 100 }).notNull().default('Rochester'),
  state: varchar('state', { length: 2 }).notNull().default('NY'),
  postalCode: varchar('postal_code', { length: 10 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  coverImageUrl: text('cover_image_url').notNull(),
  galleryUrls: text('gallery_urls').array().notNull().default([]),
  // A boolean flag, deliberately not folded into `category` — §04's
  // "Flower City is a boolean, not a category" finding is a filter-bar UI
  // fix (independent toggle alongside the category selector), not a schema
  // change; this column is already shaped correctly.
  isFlowerCityWaypoint: boolean('is_flower_city_waypoint').notNull().default(false),
  ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).notNull().default('0.0'),
  reviewCount: integer('review_count').notNull().default(0),
  seasonality: varchar('seasonality', { length: 50 }).notNull().default('Year-round'),
  curatorTips: text('curator_tips').array().notNull().default([]),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  artistName: varchar('artist_name', { length: 150 }),
  venueDestinationId: uuid('venue_destination_id').references(() => destinations.id, { onDelete: 'set null' }),
  customVenueName: varchar('custom_venue_name', { length: 150 }),
  genre: musicGenre('genre'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  coverImageUrl: text('cover_image_url'),
  priceMinCents: integer('price_min_cents').notNull().default(0),
  priceMaxCents: integer('price_max_cents').notNull().default(0),
  ticketExternalUrl: text('ticket_external_url'),
  description: text('description'),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  coverImageUrl: text('cover_image_url'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const itineraryStops = pgTable(
  'itinerary_stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    destinationId: uuid('destination_id').references(() => destinations.id, { onDelete: 'cascade' }),
    // Ordering column stays: it sequences stops within a day (and drives
    // drive-time estimates between them, §16), independent of the
    // drag-to-reorder UI control that B4 removed.
    stopOrder: integer('stop_order').notNull(),
    dayNumber: integer('day_number').notNull().default(1),
    scheduledTime: time('scheduled_time'),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('itinerary_stops_trip_order_day_unique').on(table.tripId, table.stopOrder, table.dayNumber)],
);

export const userPrivateGems = pgTable(
  'user_private_gems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    // §04 "two free-text location fields, one schema column": the PRD's single
    // `location_hint` collided with the New Private Gem screen's two distinct
    // inputs (a GPS coordinate pair and a separate landmark clue). The GPS pair
    // already had its own latitude/longitude columns below; this column is
    // rescoped to just the landmark clue.
    landmarkNote: text('landmark_note'),
    notes: text('notes'),
    category: destinationCategory('category').notNull().default('CIVIC_LANDMARK'),
    photoUrls: text('photo_urls').array().notNull().default([]),
    // §04 "audio memo capture has no storage target" — same signed-URL access
    // control as photos applies here (E6), not a public path.
    audioUrl: text('audio_url'),
    idealSeason: idealSeason('ideal_season'),
    goldenHour: goldenHour('golden_hour'),
    attachedTripId: uuid('attached_trip_id').references(() => trips.id, { onDelete: 'set null' }),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    // E3 (§12): community sharing of private gems was cut (§16), so the safe
    // form of this column is "always true, enforced by the database" rather
    // than a mutable flag pre-wired for a sharing feature that will never
    // ship. The check constraint below is what actually resolves it — the
    // column stays only as the historical name/shape the schema already had.
    isPrivate: boolean('is_private').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('user_private_gems_is_private_always_true', sql`${table.isPrivate} = true`)],
);
