# Shoptet Running Club Strava -> Slack automation

This is a simple Slack app that posts leaderboards into a Slack channel every 3 hours. I've built it using Supabase's
[Edge Functions](https://supabase.com/docs/guides/functions), [Database](https://supabase.com/docs/guides/database/overview)
and [Cron job](https://supabase.com/docs/guides/functions/schedule-functions). It uses
[Strava API](https://developers.strava.com/docs/reference/#api-Clubs-getClubActivitiesById) and posts to a Slack channel using
an [Incoming Webhook](https://api.slack.com/messaging/webhooks).

## Setup and commands

### Supabase setup

Make sure to [install Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

Initialize Supabase local environment (Docker must be installed & running):
```
supabase init
```

Start Supabase containers:
```
supabase start
```

Link your Supabase project:
```
supabase link --project-ref=<your-project-ref>
```

### Edge Functions commands

Run Edge Functions locally:
```
supabase functions serve
```

Deploy the functions:
```
supabase functions deploy
```

You can add `--no-verify-jwt` to both commands to disable the JWT authentication for simple in-browser testing.

### Database

To be able to change the DB structure, you need to install npm dependencies (not necessary if you keep the DB as-is).
```
npm install
```

If you want to make changes to the schema, you need to change it in both `schema.ts` and `supabase/<function-name>/db.ts`, as each Edge function should keep their own isolated context.

After adjusting the `schema.ts`, generate the migrations as follows:
```
npx drizzle-kit generate
```

Locally, you can push the migrations like this:
```
supabase migrations up
```
or
```
supabase db reset
```

Push the migrations to the production DB:
```
supabase db push
```
