CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"athlete" text NOT NULL,
	"name" text NOT NULL,
	"distance" integer NOT NULL,
	"moving_time" integer NOT NULL,
	"elapsed_time" integer NOT NULL,
	"total_elevation_gain" integer NOT NULL,
	"sport_type" text NOT NULL,
	"saved_at" date DEFAULT now() NOT NULL
);
