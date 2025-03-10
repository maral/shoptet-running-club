import { date, integer, pgTable, text } from "drizzle-orm/pg-core";

export const tokens = pgTable("tokens", {
  name: text().primaryKey(),
  value: text().notNull(),
});

export const activities = pgTable("activities", {
  id: text().primaryKey(),
  athlete: text().notNull(),
  name: text().notNull(),
  distance: integer().notNull(),
  moving_time: integer().notNull(),
  elapsed_time: integer().notNull(),
  total_elevation_gain: integer().notNull(),
  sport_type: text().notNull(),
  saved_at: date().notNull().defaultNow(),
});
