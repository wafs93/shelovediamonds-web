# shelovediamonds-web

## Sanity CMS Setup

### 1) Start the Sanity Studio

```bash
cd sanity-studio
npm install
cp .env.example .env
# set SANITY_STUDIO_PROJECT_ID in .env
npm run dev
```

### 2) Seed the 5 existing products

Create a Sanity token with write access, then run:

```bash
cd ..
SANITY_PROJECT_ID=your_project_id SANITY_DATASET=production SANITY_API_TOKEN=your_token node scripts/seed-sanity-products.mjs
```

### 3) Connect storefront pages

Set public Sanity config in [js/sanity-config.js](js/sanity-config.js):

- `projectId`
- `dataset`
- `apiVersion`
- `useCdn`

When configured, product pages will pull from Sanity first, with local fallback data from [js/products.js](js/products.js).

## Marketing Dashboard (AI tools)

Every AI tool in `/dashboard` (AI Assistant, Social Posts, Email Replies, Find Clients, Content Calendar) runs on **OpenAI** (`gpt-4o-mini`, or `gpt-4o` for the longer Content Calendar output) via a single server-side proxy, `/api/ai-chat`. The browser never holds an API key — `dashboard.html` sends the brand-voice system prompt and the user's message to `/api/ai-chat`, which calls OpenAI with `OPENAI_API_KEY` from Vercel's environment and returns just the generated text. Only one AI provider is required across the whole project — there is no Anthropic key anywhere.

## Instagram Auto-Post (foundation)

Morayo can set a posting schedule from the **Auto-Post** tab in `/dashboard`. On the schedule, a Vercel Cron job hits `/api/auto-post`, which picks a product, drafts an Instagram caption with OpenAI in the brand voice, and saves it as a `scheduledPost` draft in Sanity for review — it does not post to Instagram yet. `/api/auto-post` and `/api/ai-chat` share the same OpenAI request/response handling via `api/_lib/openai.js`.

Set these in the Vercel project's Environment Variables (never in client-side code) — **only these three are required**, plus two optional ones:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key — powers every dashboard AI tool (`/api/ai-chat`) and the auto-post worker (`/api/auto-post`) |
| `SANITY_API_TOKEN` | Sanity token with **write** access, used by `/api/settings` (POST) and `/api/auto-post` |
| `DASHBOARD_SECRET` | Shared secret the dashboard sends as `x-dashboard-key` to `/api/settings` and `/api/ai-chat` — must equal the `DASHBOARD_API_KEY` constant in `dashboard.html` (currently the same value as the dashboard login password) |
| `CRON_SECRET` | Optional. If set, Vercel Cron's `Authorization: Bearer $CRON_SECRET` header is required to trigger `/api/auto-post` |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | Optional — default to the values already hardcoded in `js/sanity-config.js` |

The cron schedule in `vercel.json` runs twice daily (`0 9 * * *` and `0 21 * * *` — 9am and 9pm UTC) as two separate daily jobs, since Vercel's Hobby plan only allows each individual cron job to run once per day. The worker only generates a draft when the selected weekday matches and the configured Europe/London time has already passed.