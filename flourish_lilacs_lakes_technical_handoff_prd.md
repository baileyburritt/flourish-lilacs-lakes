# Flourish: Lilacs & Lakes — Technical Handoff PRD & Architecture Specification

**Version:** 1.0.0  
**Target Form Factor:** Mobile App (iOS / Android / PWA)  
**Brand Identity:** *Flourish: Lilacs & Lakes* (Rochester, Finger Lakes & Western New York Discovery & Trip Planning)  
**Design Tokens / Theme System:** `Flourish / ROC & Lakes` (Font: `Outfit`, Roundness: `ROUND_EIGHT`, Primary: `#162a45`, Accent: `#7e57c2`)

---

## 1. Executive Summary & Product Scope

Flourish is a regional discovery and travel curation platform tailored to Rochester, NY, and the surrounding Finger Lakes and Western NY regions. The application bridges civic heritage (e.g., Rochester Flower City lilacs, Genesee Valley waterways, Finger Lakes wine country) with real-time cultural events, live music itineraries, and personalized travel curation.

### Key Screen Inventory:
1. **Explore & Curate (`SCREEN_14`)**: Regional discovery feed, category filtering (Wineries, Waterfalls, Architecture, Flower City Heritage), search, and curated editorial collections.
2. **Music & Live Events (`SCREEN_12`)**: Live music discovery, date-based schedule filter (Jazz, Folk, Indie, Classical), venue locator, and event ticket/RSVP integration.
3. **Trip Planner (`SCREEN_10`)**: Dynamic multi-day itinerary builder, waypoint routing, travel time calculation, and scheduled stop management.
4. **Destination Detail & Private Gem (`SCREEN_9`)**: Detailed destination profile, accessibility notes, official Rochester Flower City waypoint indicator, and personal spot reminder hooks.
5. **New Private Gem standalone (`SCREEN_7`)**: Universal quick-entry modal for saving private, off-the-beaten-path locations, local tips, and notes with optional binding to active itineraries.

---

## 2. Information Architecture & Data Models

### 2.1 Entity Relationship Overview
```
[User] ────┬──< [Saved Gem / Note] (Private)
           ├──< [Trip / Itinerary] ──< [Itinerary Stop] ───┐
           └──< [Event RSVP / Favorite]                    │
                                                           ▼
[Destination / POI] <──── [Event] (Venue Reference) ───────┘
```

---

### 2.2 PostgreSQL / Relational Database Schema Proposal

```sql
-- Enums
CREATE TYPE region_type AS ENUM (
  'ROCHESTER_METRO',
  'CANANDAIGUA',
  'KEUKA_LAKE',
  'SENECA_LAKE',
  'GENESEE_VALLEY',
  'NIAGARA_FRONTIER'
);

CREATE TYPE destination_category AS ENUM (
  'WINERY_BREWERY',
  'NATURE_WATERFALLS',
  'CULTURAL_HISTORIC',
  'DINING_MARKETS',
  'LIVE_VENUE',
  'CIVIC_LANDMARK'
);

CREATE TYPE music_genre AS ENUM (
  'JAZZ',
  'FOLK_ACOUSTIC',
  'INDIE_ROCK',
  'CLASSICAL_ORCHESTRAL',
  'BLUES_ROOTS',
  'ELECTRONIC'
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Destinations & Points of Interest (POIs)
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(255),
  description TEXT NOT NULL,
  region region_type NOT NULL,
  category destination_category NOT NULL,
  address_street TEXT,
  city VARCHAR(100) NOT NULL DEFAULT 'Rochester',
  state VARCHAR(2) NOT NULL DEFAULT 'NY',
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  cover_image_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}',
  is_flower_city_waypoint BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3, 2) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  seasonality VARCHAR(50) DEFAULT 'Year-round',
  curator_tips TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events & Live Music
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  artist_name VARCHAR(150),
  venue_destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  custom_venue_name VARCHAR(150),
  genre music_genre,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  cover_image_url TEXT,
  price_min_cents INT DEFAULT 0,
  price_max_cents INT DEFAULT 0,
  ticket_external_url TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips / Itineraries
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itinerary Stops (Ordered list)
CREATE TABLE itinerary_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  day_number INT NOT NULL DEFAULT 1,
  scheduled_time TIME,
  duration_minutes INT DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, stop_order, day_number)
);

-- User Private Gems (Option A: Private Personal Notes & Secret Spots)
CREATE TABLE user_private_gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  location_hint TEXT,
  notes TEXT,
  category destination_category DEFAULT 'CIVIC_LANDMARK',
  photo_urls TEXT[] DEFAULT '{}',
  attached_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  is_private BOOLEAN NOT NULL DEFAULT TRUE, -- Configured for future community sharing migration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Core API Endpoints Specification (REST / GraphQL Compatible)

### 3.1 Explore & Curation
- `GET /api/v1/destinations`
  - **Query Params:** `region`, `category`, `search`, `is_flower_city_waypoint`, `limit`, `offset`
  - **Response:** Paginated list of POI cards with cover image, badge status, coordinates, and short taglines.
- `GET /api/v1/destinations/{id_or_slug}`
  - **Response:** Full POI payload including gallery, opening hours, curated tips, accessibility attributes, and related upcoming events.
- `GET /api/v1/editorial/collections`
  - **Response:** Curated highlights (e.g., "High Falls & Genesee Brewery Walk", "Keuka Lake Scenic Overlooks").

### 3.2 Music & Events
- `GET /api/v1/events`
  - **Query Params:** `date_from`, `date_to`, `genre`, `venue_id`, `featured_only`
  - **Response:** Chronological event listings grouped by date with performer metadata and direct ticket link.
- `POST /api/v1/events/{id}/bookmark`
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** Toggle state for user's saved events calendar.

### 3.3 Trip Planning & Itineraries
- `GET /api/v1/trips`
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** User's active and upcoming itineraries.
- `POST /api/v1/trips`
  - **Payload:** `{ title, start_date, end_date, stops: [...] }`
  - **Response:** Newly created trip object.
- `POST /api/v1/trips/{id}/stops`
  - **Payload:** `{ destination_id, day_number, scheduled_time, notes }`
  - **Response:** Recalculated stop sequence and driving estimates.

### 3.4 Private Gems (Personal Spot Saver — Option A)
- `GET /api/v1/gems/private`
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** Array of user's personal unlisted spots, secret viewpoints, and notes.
- `POST /api/v1/gems/private`
  - **Headers:** `Authorization: Bearer <token>`
  - **Payload:**
    ```json
    {
      "title": "Hidden Spring Petal Cove",
      "location_hint": "North trail off Highland Park bowl",
      "notes": "Best lilacs blooming in late May; quiet reading bench",
      "category": "NATURE_WATERFALLS",
      "attached_trip_id": "9a12c8b0-4f51-4e76-8f3e-8c3e8c3e8c3e"
    }
    ```
  - **Response:** `201 Created` with saved record and offline sync hash.

---

## 4. Frontend Design Tokens & Styling Guide

All styling is built around the **`Flourish / ROC & Lakes`** design system:

| Token Category | Token Key | Value / Specification | Context of Use |
| :--- | :--- | :--- | :--- |
| **Primary Navy** | `--color-primary` | `#162a45` | Main headers, navigation bar, primary CTAs, text anchor |
| **Lilac Accent** | `--color-accent` | `#7e57c2` | Flower City badges, active tabs, subtitle tags, highlight chips |
| **Surface Base** | `--color-surface` | `#f8f9ff` | Page background, app canvas |
| **Surface Low** | `--color-surface-low`| `#eff4ff` | Secondary card containers, subtle group backgrounds |
| **Surface Lowest** | `--color-surface-white`| `#ffffff` | Elevated interactive cards, bottom navigation sheet |
| **Border Accent** | `--color-border-subtle`| `#ccdbf3` | Subtle 1px borders, card divider rules |
| **Typography** | `font-family` | `'Outfit', sans-serif` | Clean geometric sans; 400 (regular), 600 (semi-bold), 800 (bold) |
| **Radii** | `border-radius` | `ROUND_EIGHT` (12px–16px) | Tactile rounded pill buttons, cards, modal sheets |

---

## 5. Third-Party Integrations & Service Architecture

1. **Mapping & Routing:**
   - Mapbox GL / Google Maps SDK for vector tile rendering.
   - Mapbox Directions API for calculating drive times between Rochester metro and Finger Lakes rural scenic routes.
2. **Event Feeds:**
   - Integration with local calendar APIs (e.g., Rochester Jazz Festival feed, Eastman School of Music, Geva Theatre).
3. **Asset Storage:**
   - AWS S3 or Google Cloud Storage with CloudFront CDN for destination imagery, user gem photo uploads, and SVG brand assets.
4. **Authentication:**
   - OAuth 2.0 / Apple Sign-In / Google Auth for frictionless mobile onboarding.
