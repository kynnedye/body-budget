# Body Budget

A gentle, personal wellbeing tracker for noticing relationships between habits, inputs, symptoms, mood, energy, and sleep.

## Setup

1. Copy `.env.example` to `.env` and add your Postgres connection. Use the dedicated `body_budget` schema.
2. Set `APP_TIME_ZONE` and `NEXT_PUBLIC_APP_TIME_ZONE` to the same IANA zone (default `America/New_York`).
3. Optionally set `APP_PASSWORD` for local use. Production always requires it.
4. Install and initialize:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open the local URL printed by Next.js.

## Vercel

The homepage queries Postgres, so the deploy will look blank/broken until these are set in **Project → Settings → Environment Variables** (Production + Preview):

- `DATABASE_URL` — same Postgres URL you use locally, with `?schema=body_budget` (Vercel/Neon’s default URL does not include that schema, and Prisma looks for this exact name)
- `APP_TIME_ZONE` and `NEXT_PUBLIC_APP_TIME_ZONE` — e.g. `America/New_York`. Enter the bare IANA name with no surrounding quotes; the quotes in `.env.example` are `.env` file syntax, not part of the value.
- `APP_PASSWORD` — required in production. A shared password for this private log (no quotes). Until it is set, Vercel only shows a lock screen.
- `USDA_API_KEY` — optional. Free key from [FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html) for generic foods (banana, chicken, rice). Packaged items search Open Food Facts without a key.

Then redeploy. The build now runs `prisma migrate deploy` and seed so tables exist in production.

## What is included

- Daily mood, energy, sleep, habits/inputs, food with calorie estimates, symptoms, and notes
- Editable and archivable trackers with boolean, amount, and severity inputs
- 7/30/90-day trend charts
- Full CSV and JSON export
- Timezone-aware daily date keys
- Password gate via `APP_PASSWORD` (required in production)

## Scripts

- `npm run lint`
- `npm run build`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`
