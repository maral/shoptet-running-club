import { and, between, inArray, notInArray, sql } from "drizzle-orm/";
import { drizzle } from "drizzle-orm/node-postgres";
import _pg from "pg";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { StravaActivity } from "./stravaApi.ts";

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
  saved_at: timestamp().notNull().defaultNow(),
});

let db: ReturnType<typeof drizzle>;

export function getDb() {
  if (!db) {
    const connectionString = Deno.env.get("SUPABASE_DB_URL")!;
    db = drizzle(connectionString);
  }
  return db;
}

export function getExcludedAthletes() {
  return Deno.env.get("EXCLUDED_ATHLETES")?.split(",") ?? [];
}

export async function getLeaderboardData(endDate?: Date) {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  endDate = endDate ?? new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );

  return await getDb().select({
    athlete: activities.athlete,
    total_distance: sql<number>`SUM(${activities.distance})`,
    total_moving_time: sql<number>`SUM(${activities.moving_time})`,
    total_elevation_gain: sql<number>`SUM(${activities.total_elevation_gain})`,
  })
    .from(activities)
    .where(
      and(
        between(
          activities.saved_at,
          startOfMonth,
          endDate,
        ),
        notInArray(activities.athlete, getExcludedAthletes()),
      ),
    )
    .groupBy(activities.athlete)
    .orderBy(sql`SUM(${activities.distance}) DESC`);
}

export async function getNewActivities(activityList: StravaActivity[]) {
  const existingActivities = await getDb().select().from(activities).where(
    and(
      inArray(activities.id, activityList.map(getActivityId)),
    ),
  );
  return activityList.filter(
    (activity) =>
      !existingActivities.some(
        (existingActivity) => existingActivity.id === getActivityId(activity),
      ) &&
      !getExcludedAthletes().includes(
        `${activity.athlete.firstname} ${activity.athlete.lastname}`,
      ),
  );
}

export async function saveNewActivities(activityList: StravaActivity[]) {
  if (activityList.length === 0) {
    return;
  }
  await getDb().insert(activities).values(
    activityList.map((activity) => ({
      id: getActivityId(activity),
      athlete: `${activity.athlete.firstname} ${activity.athlete.lastname}`,
      name: activity.name,
      distance: Math.round(activity.distance),
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: Math.round(activity.total_elevation_gain),
      sport_type: activity.sport_type,
    })),
  ).onConflictDoNothing();
}

function getActivityId(activity: StravaActivity) {
  return `${activity.athlete.firstname}-${activity.athlete.lastname}-${activity.distance}-${activity.moving_time}`;
}

export async function getRefreshToken() {
  return await getTokenValue("refresh_token");
}

export async function getAccessToken() {
  return await getTokenValue("access_token");
}

export async function getExpiresAt(): Promise<Date | null> {
  const expiresAt = await getTokenValue("expires_at");
  return expiresAt ? new Date(parseInt(expiresAt) * 1000) : null;
}

export async function saveRefreshToken(token: string) {
  await saveTokenValue("refresh_token", token);
}

export async function saveAccessToken(token: string) {
  await saveTokenValue("access_token", token);
}

export async function saveExpiresAt(expiresAt: string) {
  await saveTokenValue("expires_at", expiresAt);
}

async function getTokenValue(name: string): Promise<string | null> {
  return (await getDb().select().from(tokens).where(
    sql`${tokens.name} = ${name}`,
  ))[0]?.value ?? null;
}

async function saveTokenValue(name: string, value: string) {
  await getDb().insert(tokens).values({
    name,
    value,
  }).onConflictDoUpdate({ target: tokens.name, set: { value } });
}
