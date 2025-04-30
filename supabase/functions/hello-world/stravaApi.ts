import {
  getAccessToken,
  getExpiresAt,
  getRefreshToken,
  saveAccessToken,
  saveExpiresAt,
  saveRefreshToken,
} from "./db.ts";
import ky from "https://esm.sh/ky@1.7.5";

type StravaOauthResponse = {
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  token_type: string;
};

export async function getStravaAccessToken() {
  const expiresAt = await getExpiresAt();
  if (expiresAt && expiresAt > new Date()) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      return accessToken;
    }
  }

  const refresh_token = await getRefreshToken() ??
    Deno.env.get("STRAVA_REFRESH_TOKEN");
  if (!refresh_token) {
    throw new Error("No refresh token found, add it first to the database.");
  }

  try {
    const res = await ky.post<StravaOauthResponse>(
      "https://www.strava.com/api/v3/oauth/token",
      {
        searchParams: {
          client_id: Deno.env.get("STRAVA_CLIENT_ID")!,
          client_secret: Deno.env.get("STRAVA_CLIENT_SECRET")!,
          grant_type: "refresh_token",
          refresh_token: refresh_token,
        },
      },
    ).json();

    await saveRefreshToken(res.refresh_token);
    await saveAccessToken(res.access_token);
    await saveExpiresAt(res.expires_at.toString());

    return res.access_token;
  } catch {
    throw new Error(`Failed to get Strava access token.`);
  }
}

export type StravaActivity = {
  resource_state: number;
  athlete: {
    resource_state: number;
    firstname: string;
    lastname: string;
  };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  workout_type: number;
};

export async function getStravaClubActivities(accessToken: string) {
  const clubId = Deno.env.get("CLUB_ID");
  const now = new Date();
  const after = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

  const allActivities: StravaActivity[] = [];
  while (true) {
    const res = await ky.get<StravaActivity[]>(
      `https://www.strava.com/api/v3/clubs/${clubId}/activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        searchParams: {
          after,
          per_page: 200,
        },
      },
    ).json();
    allActivities.push(...res);

    if (res.length < 200) {
      break;
    }
  }

  return allActivities.filter((activity) =>
    activity.sport_type === "Run" || activity.sport_type === "TrailRun"
  );
}
