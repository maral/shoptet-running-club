// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getLeaderboard, getNewActivities, saveNewActivities } from "./db.ts";
import { getStravaAccessToken, getStravaClubActivities } from "./stravaApi.ts";

import AsciiTable, {
  AsciiAlign,
} from "https://deno.land/x/ascii_table@v0.1.0/mod.ts";
import { postToSlack } from "./slackApi.ts";
import { getActivityText } from "./openaiApi.ts";

Deno.serve(async () => {
  try {
    const stravaAccessToken = await getStravaAccessToken();
    const data = await getStravaClubActivities(stravaAccessToken);
    const newActivities = await getNewActivities(data);
    await saveNewActivities(newActivities);

    for (const activity of newActivities) {
      const text = await getActivityText({
        athlete: `${activity.athlete.firstname} ${activity.athlete.lastname}`,
        name: activity.name,
        distance: `${(activity.distance / 1000).toFixed(1)} km`,
        time: new Date(activity.moving_time * 1000).toISOString().slice(11, 19),
        elevationGain: `${activity.total_elevation_gain} m`,
        tempo: new Date(activity.moving_time / activity.distance * 1000 * 1000)
          .toISOString().slice(15, 19),
      });

      await postToSlack(text);
    }

    const leaderboard = await getLeaderboard();
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

    await postToSlack("```" + table.toString() + "```");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/test' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
