// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import AsciiTable, {
  AsciiAlign,
} from "https://deno.land/x/ascii_table@v0.1.0/mod.ts";
import { getLeaderboardData } from "./db.ts";

export type LeaderboardActivity = {
  position: number;
  position_change: number;
  athlete: string;
  total_distance: number;
  total_moving_time: number;
  total_elevation_gain: number;
};

async function getLeaderboard() {
  const yesterdayLeaderboardData = await getLeaderboardData(
    // 24 hours ago
    new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
  );
  const yesterdayPositions = new Map(
    yesterdayLeaderboardData.map((row, index) => [row.athlete, index + 1]),
  );
  const leaderboardData = await getLeaderboardData();
  const leaderboard = leaderboardData.map((row, index) => ({
    position: index + 1,
    position_change: (yesterdayPositions.get(row.athlete) ??
      leaderboardData.length) - (index + 1),
    athlete: row.athlete,
    total_distance: row.total_distance,
    total_moving_time: row.total_moving_time,
    total_elevation_gain: row.total_elevation_gain,
  }));
  return leaderboard;
}

export async function getLeaderboardTable() {
  const leaderboard = await getLeaderboard();

  if (leaderboard.length === 0) {
    return "Tento měsíc zatím nikdo neběžel. Zamakejte, lenoši!";
  }

  const now = new Date();
  const table = AsciiTable.fromJSON({
    title: `Shoptet Running Challenge ${
      now.getMonth() + 1
    }/${now.getFullYear()}`,
    heading: ["#", "∆", "Jméno", "Vzdálenost", "Převýšení", "Celkový čas"],
    rows: leaderboard.map((row) => [
      row.position,
      row.position_change !== 0
        ? `${(row.position_change > 0 ? "+" : "")}${row.position_change}`
        : "",
      row.athlete,
      `${(row.total_distance / 1000).toFixed(1)} km`,
      `${row.total_elevation_gain} m`,
      new Date(row.total_moving_time * 1000).toISOString().slice(11, 19),
    ]),
  })
    .setAlign(3, AsciiAlign.RIGHT)
    .setAlign(4, AsciiAlign.RIGHT)
    .setAlign(5, AsciiAlign.RIGHT);

  return "```" + table.toString() + "```";
}
