-- E4 (§12): users.id becomes Clerk's user id (text) instead of a generated
-- uuid, so the FK-dependent columns' type changes safely: drop the two
-- existing FKs that reference users.id, change all three columns' types,
-- then re-add the FKs. Doing it in place (without dropping first) fails
-- because Postgres checks FK type compatibility at each ALTER COLUMN TYPE
-- statement, not once at the end of the migration.
ALTER TABLE "trips" DROP CONSTRAINT "trips_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_private_gems" DROP CONSTRAINT "user_private_gems_user_id_users_id_fk";--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_private_gems" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint

ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_private_gems" ADD CONSTRAINT "user_private_gems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TYPE "public"."bookmark_subject_type" AS ENUM('DESTINATION', 'EVENT');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject_type" "bookmark_subject_type" NOT NULL,
	"destination_id" uuid,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_destination_unique" UNIQUE("user_id","destination_id"),
	CONSTRAINT "bookmarks_user_event_unique" UNIQUE("user_id","event_id"),
	CONSTRAINT "bookmarks_subject_matches_type" CHECK (("bookmarks"."subject_type" = 'DESTINATION' AND "bookmarks"."destination_id" IS NOT NULL AND "bookmarks"."event_id" IS NULL)
          OR ("bookmarks"."subject_type" = 'EVENT' AND "bookmarks"."event_id" IS NOT NULL AND "bookmarks"."destination_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
