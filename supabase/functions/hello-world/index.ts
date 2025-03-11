// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getStravaAccessToken, getStravaClubActivities } from "./stravaApi.ts";
import { getLeaderboard, saveNewActivities } from "./db.ts";

import AsciiTable, {
  AsciiAlign,
} from "https://deno.land/x/ascii_table@v0.1.0/mod.ts";
import { postToSlack } from "./slackApi.ts";

Deno.serve(async () => {
  try {
    const stravaAccessToken = await getStravaAccessToken();
    const data = await getStravaClubActivities(stravaAccessToken);
    await saveNewActivities(data);

    const leaderboard = await getLeaderboard();
    const now = new Date();
    const table = AsciiTable.fromJSON({
      title: `Shoptet Running Challenge ${
        now.getMonth() + 1
      }/${now.getFullYear()}`,
      heading: ["#", "Jméno", "Vzdálenost", "Převýšení", "Celkový čas"],
      rows: leaderboard.map((row, index) => [
        index + 1,
        row.athlete,
        `${(row.total_distance / 1000).toFixed(1)} km`,
        `${row.total_elevation_gain} m`,
        new Date(row.total_moving_time * 1000).toISOString().slice(11, 19),
      ]),
    })
      .setAlign(2, AsciiAlign.RIGHT)
      .setAlign(3, AsciiAlign.RIGHT)
      .setAlign(4, AsciiAlign.RIGHT);

    console.log(table.toString());
    // await postToSlack("```" + table.toString() + "```");

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
