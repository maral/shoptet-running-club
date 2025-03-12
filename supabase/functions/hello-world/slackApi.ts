import ky from "https://esm.sh/ky@1.7.5";

export async function postToSlack(message: string) {
  if (Deno.env.get("DEBUG") === "1") {
    console.log("DEBUG: Would post message to Slack:\n", message);
    return;
  }
  try {
    await ky.post(
      `https://hooks.slack.com/services/${Deno.env.get("SLACK_HOOK_TOKEN")}`,
      {
        json: {
          username: "Strava",
          icon_emoji: ":vltava-run:",
          text: message,
        },
      },
    );
  } catch (error) {
    throw new Error(
      `Failed to post message to Slack: ${(error as Error).message}`,
    );
  }
}
