# Body Budget

A gentle, personal wellbeing tracker for noticing relationships between habits, inputs, symptoms, mood, energy, and sleep.

## Setup

1. Copy `.env.example` to `.env` and add your Postgres connection. Use the dedicated `body_budget` schema.
2. Set `APP_TIME_ZONE` and `NEXT_PUBLIC_APP_TIME_ZONE` to the same IANA zone (default `America/New_York`).
3. Optionally set `APP_PASSWORD` if this should not be open on the local network.
4. Install and initialize:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open the local URL printed by Next.js.

## What is included

- Daily mood, energy, sleep, habits/inputs, symptoms, and notes
- Editable and archivable trackers with boolean, amount, and severity inputs
- 7/30/90-day trend charts
- Full CSV and JSON export
- Timezone-aware daily date keys
- Optional password gate via `APP_PASSWORD`

## Scripts

- `npm run lint`
- `npm run build`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`
