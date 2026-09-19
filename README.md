# ReplyRush

**Never leave a review unanswered again.**

ReplyRush is an AI-powered review and complaint reply assistant for small local businesses. Owners get reviews on Google, Zomato, Amazon, Yelp and Instagram but rarely have time to answer each one. ReplyRush drafts replies that sound personal instead of templated, and its **Issue Radar** shows the owner which problems keep coming up across platforms.

> ReplyRush **drafts** replies only. It never posts anything to a platform. The owner reviews, edits and copies each reply.

Built for the Emergent Builders contest.

- **Live demo:** `<add your deployed Emergent URL here>`
- **Demo video:** `<add link here>`

---

## Features

| Area | What it does |
|---|---|
| **Google sign-in** | Google is the only login method. The account chooser is always shown, so the user picks which Google account to use. |
| **Landing and login** | Animated gradient hero, a 3-step explainer, and a centred login card with the standard "Sign in with Google" button. |
| **Dashboard** | Analytics (reviews handled, positive vs negative donut chart, time saved), red/yellow/green urgency chips, the Issue Radar, and five platform cards. |
| **Connect flow** | A short loading animation ("Fetching your latest reviews...") followed by that platform's reviews, styled like the platform's own review cards. |
| **Add Review Manually** | Paste any real review or complaint from anywhere, pick the platform and star rating, and continue to the same reply screen. |
| **Reply Studio** | Choose a business type and a tone, optionally state what the business can actually offer, then generate, edit, regenerate and copy the reply. |
| **Urgency flags** | Every review is flagged red, yellow or green. Lists always sort red first. |
| **History** | Every handled review with its platform logo, flag, reply and date, filterable by platform and flag. |
| **Issue Radar** | Recurring complaint themes across all platforms, with alerts and a suggested action. See below. |

### Issue Radar

Issue Radar answers the question "what is going wrong in my business right now?" instead of only "how do I reply?".

- Every review carries 1 to 3 themes: *Product quality, Delivery/Wait time, Staff/Service, Pricing/Value, Cleanliness/Environment, Order accuracy, Refund/Billing, Other*.
- For the last 30 days, each theme is shown as a bar with its count, split by platform logo, plus a trend arrow compared with the previous 30 days.
- A pulsing **Needs attention** banner appears when a theme has **3 or more negative reviews** or **2 or more red flags**, for example `Delivery/Wait time: 4 complaints across Zomato and Google`.
- Clicking a theme opens a side drawer with the matching reviews and **one suggested action**, grounded only in those reviews. The suggestion is generated once per theme and cached until new reviews arrive.
- Seeded reviews are pre-tagged, so connecting a platform makes no AI calls. The radar lights up straight after the first Connect.
- Themes are language-independent, so Issue Radar works for any market.

### AI honesty rule

The reply prompt enforces strict rules about what the model may say:

- It must reference specifics from the actual review, not generic filler.
- It must never invent facts, refunds, compensation, policies, staff actions, discounts, resolutions, contact details, names, phone numbers, emails or links.
- The only resolutions it may mention are those the owner typed into **"What can you actually offer?"**. If the field is empty, it acknowledges the specific issue and invites the customer to get in touch, without inventing any contact detail.
- For positive reviews it thanks the customer for the specifics they mentioned and promises nothing.
- It replies in the same language as the review, in roughly 50 to 120 words.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (CRA + CRACO), Tailwind CSS, shadcn/ui, framer-motion, Recharts, react-router, sonner |
| Icons | react-icons (Simple Icons and Font Awesome brand icons) for real platform logos |
| Backend | FastAPI, Motor (async MongoDB driver) |
| Database | MongoDB |
| Auth | Emergent-managed Google OAuth, with the session stored in an httpOnly cookie |
| AI | Claude Sonnet 4.6 through `emergentintegrations` and the Emergent universal LLM key (no personal API key needed) |

## Architecture

```
React SPA  ──/api──▶  FastAPI  ──▶  MongoDB
   │                     │
   │                     └──▶ Claude Sonnet 4.6 (Emergent LLM key)
   └──▶ Emergent Google OAuth (account chooser) ──▶ back to /dashboard
```

- **One LLM call per reply.** It returns structured JSON: `reply`, `sentiment`, `flag`, `urgency_reason`, `themes`. A failed call is retried once, then a clear error is shown.
- **Seeded reviews keep their pre-set flag and themes.** Manually added reviews are tagged by the AI during Generate Reply.
- **All data is per user.** Every query is filtered by the logged-in user's ID, so accounts never see each other's data.
- **Suggested actions are cached** in the `theme_actions` collection and invalidated when new reviews arrive or a reply is generated.

## Project structure

```
replyrush/
├── backend/
│   ├── server.py          # FastAPI app: auth, connect, reviews, generate, analytics, issue radar
│   ├── seed_data.py       # 25 pre-tagged sample reviews (5 per platform)
│   ├── requirements.txt
│   └── tests/backend_test.py
└── frontend/
    └── src/
        ├── pages/         # Landing, Login, Dashboard, ConnectView, ReplyStudio, History
        ├── components/    # IssueRadar, ThemeDrawer, AnalyticsWidget, ReviewCard, PlatformCard, ...
        ├── context/       # AuthContext
        └── lib/           # api client, platform brand config
```

## API reference

All routes are under `/api` and require a session, except `auth/session`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/session` | Exchange the OAuth session ID for a session cookie |
| GET | `/auth/me` | Current user |
| POST | `/auth/logout` | End the session |
| GET | `/platforms/status` | Which platforms are connected |
| POST | `/connect/{platform}` | Simulated connect: loads that platform's seeded reviews (idempotent) |
| GET | `/reviews` | List reviews (filterable), red first |
| GET | `/reviews/{id}` | One review |
| POST | `/reviews/manual` | Add a review manually |
| POST | `/reviews/{id}/generate` | Generate an AI reply for a review |
| GET | `/analytics` | Totals, positive vs negative split, time saved |
| GET | `/issue-radar` | Theme counts, trends and "Needs attention" alerts |
| GET | `/issue-radar/theme?theme=` | Reviews for one theme plus the cached suggested action |

## Data model (MongoDB)

- `users`: `user_id`, `email`, `name`, `picture`
- `user_sessions`: `session_token`, `user_id`, `expires_at` (7 days)
- `reviews`: platform, reviewer, rating, text, date, flag, sentiment, themes, language, reply, handled, source (`seed` or `manual`)
- `theme_actions`: cached suggested action per user and theme

## Seed data

25 realistic reviews, 5 per platform, covering positive, neutral and negative sentiment across food quality, waiting time, product defects, service, cleanliness, wrong orders and billing. They include 4 red-flagged reviews, 11 yellow and 10 green, plus one Spanish and one French review to show language matching. Reviewer names, currencies and locations are international.

---

## Running the project

ReplyRush is built for the **Emergent** platform, which supplies MongoDB, the Google OAuth flow and the LLM key. The easiest way to run it is on Emergent using the deployed URL above.

To run it elsewhere you will need the following, and it may take extra setup:

**Prerequisites:** Python 3.11+, Node.js 18+, Yarn, a MongoDB instance, and an Emergent LLM key.

**Backend** (`backend/.env`):

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=replyrush
EMERGENT_LLM_KEY=<your Emergent universal key>
CORS_ORIGINS=http://localhost:3000
```

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Frontend** (`frontend/.env`):

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

```bash
cd frontend
yarn install
yarn start
```

**Notes for local runs**
- Login redirects to Emergent's hosted Google OAuth and validates the session with Emergent's auth service, so it needs internet access.
- The session cookie is set with `secure` and `samesite=none`, which browsers only accept over HTTPS. Google sign-in is therefore most reliable on the deployed HTTPS URL.
- `emergentintegrations` may need Emergent's package index. If `pip install` cannot find it, check Emergent's documentation.

## Testing

```bash
cd backend
pytest
```

The backend tests cover language matching, the honesty rule, Connect idempotency, sorting, analytics, radar alerts and the theme drawer.

To try the app end to end:

1. Sign in with Google and choose an account.
2. Connect **Zomato** and **Google** and watch the **Needs attention** banner pulse.
3. Open a theme in the drawer and read the suggested action.
4. Open a red-flagged review, leave **"What can you actually offer?"** empty and generate a reply. It should acknowledge the specific issue and invite the customer to get in touch, with no invented refund or contact details.
5. Type an offer such as "full refund" and regenerate. The reply may now mention only that.
6. Open the Spanish or French review to see the reply match the review's language.
7. Check **History** and filter by platform and flag.

## Limitations

- **Platform connections are simulated.** Connect loads pre-seeded sample reviews. There is no integration with the Google Business Profile, Zomato, Amazon, Yelp or Instagram APIs, because those require business verification and app review.
- **Drafting only.** Replies are copied by the owner and are never posted automatically.
- **Time saved is an estimate** based on 5 minutes saved per reply.

## Roadmap

- Real platform integrations once API access is approved
- Saved reply presets (tone and offer)
- Weekly email digest of top complaint themes
- Sentiment trends over time

## License

Add your preferred license here.
