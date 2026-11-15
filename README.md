# Travel Itinerary Planner

Generate a personalised day trip itinerary from a city and a list of interests.

- **Stack:** Next.js (App Router) + TypeScript
- **Model:** Groq `openai/gpt-oss-120b` via the Chat Completions API
- **Hosting:** Vercel (serverless route `app/api/itinerary`)

## Local development

```bash
npm install
cp .env.example .env.local   # then add your Groq key
npm run dev
```

The app runs at <http://localhost:3000>.

## Environment

| Variable        | Required | Purpose                          |
| --------------- | -------- | -------------------------------- |
| `GROQ_API_KEY`  | yes      | Server-side key for Groq API     |

Create a key at <https://console.groq.com/keys>. It is only read in the API
route, never in the browser bundle.

## Deploying to Vercel

1. Import this repository at <https://vercel.com/new>.
2. Framework preset: **Next.js** (no extra configuration needed).
3. Add `GROQ_API_KEY` under *Settings → Environment Variables* for Production,
   Preview and Development.
4. Deploy.

`app/api/itinerary` streams the model response to the browser, so itineraries
appear progressively instead of after a long wait.

## API

`POST /api/itinerary`

```json
{ "city": "Lisbon", "interests": "street food, architecture, live music" }
```

Returns `text/plain` streamed deltas. Validation failures return JSON
`{ "error": "..." }` with a 400/500/502 status.
