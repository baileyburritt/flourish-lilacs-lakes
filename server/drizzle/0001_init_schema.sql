CREATE TYPE "public"."destination_category" AS ENUM('WINERY_BREWERY', 'NATURE_WATERFALLS', 'CULTURAL_HISTORIC', 'DINING_MARKETS', 'LIVE_VENUE', 'CIVIC_LANDMARK');--> statement-breakpoint
CREATE TYPE "public"."golden_hour" AS ENUM('DAWN_MIST', 'GOLDEN_HOUR', 'DEEP_TWILIGHT', 'MIDDAY_SUN');--> statement-breakpoint
CREATE TYPE "public"."ideal_season" AS ENUM('SPRING_LILAC', 'SUMMER_WATERS', 'GOLDEN_FOLIAGE', 'WINTER_FROST');--> statement-breakpoint
CREATE TYPE "public"."music_genre" AS ENUM('JAZZ', 'FOLK_ACOUSTIC', 'INDIE_ROCK', 'CLASSICAL_ORCHESTRAL', 'BLUES_ROOTS', 'ELECTRONIC');--> statement-breakpoint
CREATE TYPE "public"."region_type" AS ENUM('ROCHESTER_METRO', 'CANANDAIGUA', 'KEUKA_LAKE', 'SENECA_LAKE', 'GENESEE_VALLEY', 'NIAGARA_FRONTIER');--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(150) NOT NULL,
	"title" varchar(200) NOT NULL,
	"tagline" varchar(255),
	"description" text NOT NULL,
	"region" "region_type" NOT NULL,
	"category" "destination_category" NOT NULL,
	"address_street" text,
	"city" varchar(100) DEFAULT 'Rochester' NOT NULL,
	"state" varchar(2) DEFAULT 'NY' NOT NULL,
	"postal_code" varchar(10),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"cover_image_url" text NOT NULL,
	"gallery_urls" text[] DEFAULT '{}' NOT NULL,
	"is_flower_city_waypoint" boolean DEFAULT false NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"seasonality" varchar(50) DEFAULT 'Year-round' NOT NULL,
	"curator_tips" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"artist_name" varchar(150),
	"venue_destination_id" uuid,
	"custom_venue_name" varchar(150),
	"genre" "music_genre",
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"cover_image_url" text,
	"price_min_cents" integer DEFAULT 0 NOT NULL,
	"price_max_cents" integer DEFAULT 0 NOT NULL,
	"ticket_external_url" text,
	"description" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"destination_id" uuid,
	"stop_order" integer NOT NULL,
	"day_number" integer DEFAULT 1 NOT NULL,
	"scheduled_time" time,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_stops_trip_order_day_unique" UNIQUE("trip_id","stop_order","day_number")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"start_date" date,
	"end_date" date,
	"cover_image_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_private_gems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"landmark_note" text,
	"notes" text,
	"category" "destination_category" DEFAULT 'CIVIC_LANDMARK' NOT NULL,
	"photo_urls" text[] DEFAULT '{}' NOT NULL,
	"audio_url" text,
	"ideal_season" "ideal_season",
	"golden_hour" "golden_hour",
	"attached_trip_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_destination_id_destinations_id_fk" FOREIGN KEY ("venue_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_private_gems" ADD CONSTRAINT "user_private_gems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_private_gems" ADD CONSTRAINT "user_private_gems_attached_trip_id_trips_id_fk" FOREIGN KEY ("attached_trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;