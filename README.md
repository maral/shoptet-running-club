# Shoptet Running Club Strava -> Slack automation

This is a simple Slack app that posts leaderboards into a Slack channel every 3 hours. I've built it using Supabase's
[Edge Functions](https://supabase.com/docs/guides/functions), [Database](https://supabase.com/docs/guides/database/overview)
and [Cron job](https://supabase.com/docs/guides/functions/schedule-functions). It uses
[Strava API](https://developers.strava.com/docs/reference/#api-Clubs-getClubActivitiesById) and posts to a Slack channel using
an [Incoming Webhook](https://api.slack.com/messaging/webhooks).
