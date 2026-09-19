# ReplyRush

**AI-powered review and complaint reply assistant for small local businesses.**
Never leave a review unanswered again.

---

## Problem

Small business owners receive reviews and complaints across many platforms (Google, Zomato, Amazon, Yelp, Instagram), but they rarely have time to answer each one personally. Unanswered negative reviews hurt trust, and generic copy-pasted replies make it worse.

Owners also miss the bigger picture. Ten separate complaints about slow delivery look like ten unrelated comments, when they are really one operational problem.

## Solution

ReplyRush drafts fast, personal replies that respond to what each customer actually wrote, and it shows the owner which problems keep coming back.

1. **Connect** a platform and see its reviews in one place, sorted by urgency.
2. **Generate** a reply written for that specific review, in the tone and business type the owner chooses.
3. **Copy** the edited reply and post it wherever it belongs. ReplyRush drafts only and never posts on the owner's behalf.
4. **Spot patterns** with Issue Radar, which groups reviews into themes and warns the owner when a problem is repeating.

## Features

**Sign-in**
- Google sign-in with the account chooser, so the user picks which Google account to use.
- All reviews, replies and history are stored per user and persist across sessions.

**Reviews**
- Five platform cards (Google, Zomato, Amazon, Yelp, Instagram) with brand logos and a Connect button.
- Connect shows a short loading animation, then loads that platform's sample reviews, styled per platform.
- 25 seeded sample reviews (5 per platform): a mix of positive, neutral and negative, including one Spanish and one French review.
- "Add Review Manually" to paste any real review or complaint from anywhere.

**Urgency flags**
- Red = angry, urgent, or threatening to leave or report the business.
- Yellow = moderately negative.
- Green = neutral or positive.
- Every list is sorted with red first, then yellow, then green.

**Reply Studio**
- Business type: Restaurant, Retail Store, Salon, Service Business, Other.
- Tone: Friendly, Formal, Apologetic-and-solution-focused.
- Optional field, "What can you actually offer?", where the owner enters real refunds, replacements, contact details or policies.
- Generates a unique reply each time, in the same language as the review (roughly 50 to 120 words).
- Editable reply box, Copy Reply button, and Regenerate.

**Honesty rule**
- The AI never invents facts, refunds, compensation, policies, staff actions, discounts, resolutions or promises. It only mentions resolutions that appear in the review or in the owner's "What can you actually offer?" field.
- When there is not enough information to promise anything, it acknowledges the specific issue and invites the customer to get in touch, without making up contact details.

**Issue Radar**
- Every review carries one to three themes: Product quality, Delivery/Wait time, Staff/Service, Pricing/Value, Cleanliness/Environment, Order accuracy, Refund/Billing, Other.
- Over the last 30 days, each theme is shown as a bar with its count, split by platform logo, with a trend arrow against the previous 30 days.
- A pulsing "Needs attention" banner appears when a theme has 3 or more negative reviews, or 2 or more red flags.
- Clicking a theme opens a side drawer with the matching reviews and one suggested action, based only on those reviews.

**Dashboard and history**
- Analytics: total reviews, positive vs negative split (donut chart), and estimated time saved (5 minutes per reply).
- Red / Yellow / Green count chips.
- History page listing every handled review with its platform logo, flag, reply and date, filterable by platform and flag.
- Responsive layout with animated counters, skeleton loaders and toast notifications.

## Architecture

```
┌───────────────────────┐      HTTPS / JSON       ┌────────────────────────┐
│  React frontend       │ ──────────────────────► │  FastAPI backend       │
│  (routing, UI, charts)│ ◄────────────────────── │  (all routes under     │
└───────────────────────┘   cookie or Bearer      │   /api)                │
                            session token         └───────┬────────┬───────┘
                                                          │        │
                                              Motor (async)        │ one structured-JSON
                                                          │        │ call per reply,
                                                  ┌───────▼──────┐ │ one cached call per
                                                  │   MongoDB    │ │ theme suggestion
                                                  │ users        │ │
                                                  │ user_sessions│ ┌▼────────────────┐
                                                  │ reviews      │ │ LLM             │
                                                  │ theme_actions│ │ (Claude Sonnet) │
                                                  └──────────────┘ └─────────────────┘
```

**How the main flows work**

- **Sign-in:** the frontend redirects to a hosted Google OAuth service with `prompt=select_account`. It returns to the app with a `session_id`, which the backend exchanges for user details. The backend then creates a 7-day session and sets an httpOnly cookie. The API also accepts an `Authorization: Bearer` token.
- **Connect:** `POST /api/connect/{platform}` copies that platform's seeded reviews into the database for the current user (only once, so repeated clicks are safe) and returns them sorted by urgency. No AI call is made, because seeded reviews are already tagged with flags and themes.
- **Generate Reply:** `POST /api/reviews/{id}/generate` builds a system prompt from the business type, tone and the owner's offer field, sends the review text to the LLM, and expects strict JSON back (`reply`, `sentiment`, `flag`, `urgency_reason`, `themes`). It retries once on failure. Seeded reviews keep their preset flag and themes. Manually added reviews are tagged from the LLM result.
- **Issue Radar:** `GET /api/issue-radar` aggregates themes over the last 30 days against the 30 days before, and produces the alert list. `GET /api/issue-radar/theme?theme=...` returns the matching reviews and one suggested action. That action is cached per theme and review count, and the cache is cleared whenever new reviews arrive or a reply is generated.

**API routes**

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/session` | Exchange the OAuth session for an app session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | End session |
| GET | `/api/platforms/status` | Connection state and review count per platform |
| POST | `/api/connect/{platform}` | Load seeded reviews for a platform |
| GET | `/api/reviews` | List reviews (filter by platform, flag, handled) |
| GET | `/api/reviews/{id}` | Single review |
| POST | `/api/reviews/manual` | Add a review by hand |
| POST | `/api/reviews/{id}/generate` | Generate a reply and classify the review |
| GET | `/api/analytics` | Totals, sentiment split, time saved |
| GET | `/api/issue-radar` | Theme counts, trends and alerts |
| GET | `/api/issue-radar/theme` | Theme drawer data and suggested action |

**Project structure**

```
backend/
  server.py        FastAPI app, auth, reviews, LLM calls, analytics, Issue Radar
  seed_data.py     25 pre-tagged sample reviews
  tests/           Backend API tests (pytest)
frontend/
  src/pages/       Landing, Login, Dashboard, ConnectView, ReplyStudio, History
  src/components/  IssueRadar, ThemeDrawer, AnalyticsWidget, ReviewCard, PlatformCard, ...
  src/lib/         API client, platform and urgency definitions
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Sonner (toasts) |
| Icons | react-icons (Simple Icons brand logos, Font Awesome Amazon logo, Google multi-color "G") |
| Backend | Python, FastAPI, Uvicorn |
| Database | MongoDB, accessed through Motor (async driver) |
| AI | Claude Sonnet 4.6, structured JSON output |
| Auth | Google OAuth with account chooser, httpOnly session cookie |
| Testing | pytest |

## How to Run

### Prerequisites

- Node.js 18 or later, and Yarn 1.x
- Python 3.11 or later
- MongoDB running locally (or a MongoDB connection string)
- An LLM API key for reply generation

### 1. Get the code

```bash
git clone <your-repository-url>
cd replyrush
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=replyrush
CORS_ORIGINS=http://localhost:3000
# Also add your LLM API key here, using the exact variable name read
# near the top of backend/server.py (os.environ[...]).
```

Run the API:

```bash
uvicorn server:app --reload --port 8001
```

Check it at `http://localhost:8001/api/`. You should see `{"message": "ReplyRush API"}`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
yarn install
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Run the app:

```bash
yarn start
```

Open `http://localhost:3000`.

### 4. Sign in

**Google sign-in.** The Login page redirects to a hosted Google OAuth service and comes back to `/dashboard`. The session cookie is set as `Secure`, so this path is intended for an HTTPS deployment.

**Local development sign-in (no Google needed).** Create a test user and session directly in the database:

```bash
mongosh --quiet --eval '
const d = db.getSiblingDB("replyrush");
const uid = "user_dev", tok = "dev_session_token";
d.users.updateOne({user_id: uid}, {$set: {user_id: uid, email: "dev@example.com", name: "Dev Owner", picture: null, created_at: new Date().toISOString()}}, {upsert: true});
d.user_sessions.updateOne({session_token: tok}, {$set: {user_id: uid, session_token: tok, expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), created_at: new Date().toISOString()}}, {upsert: true});
'
```

Then open the app in your browser, open the developer console, and run:

```js
localStorage.setItem("rr_token", "dev_session_token");
```

Go to `http://localhost:3000/dashboard`. The frontend sends this token as a Bearer header, which the backend accepts.

### 5. Try the main flow

1. On the dashboard, click **Connect** on Zomato and Google.
2. Watch the pulsing **Needs attention** banner appear, then click a theme to open its drawer.
3. Open a red-flagged review, choose a business type and tone, and click **Generate Reply**.
4. Edit the reply, then click **Copy Reply**.
5. Open **History** to see the handled review.

There is no separate seed command. Seed reviews are loaded per user the first time a platform is connected.

### Run the tests

The backend tests call a running API, so keep the backend running first, then from the project root:

```bash
cd backend
pytest
```

## Limitations

- **Connect is simulated.** It loads sample reviews from the app's own database. There is no live integration with Google Business Profile, Zomato, Amazon, Yelp or Instagram, since those need business verification and app review.
- **Drafts only.** Replies are copied out by the owner. Nothing is posted back to any platform.
- **Fixed sample data.** Each platform has 5 seeded reviews (25 total), and they are dated relative to the moment a platform is connected, so they always fall inside the 30-day Issue Radar window.
- **Edits are not saved.** The owner can edit a reply before copying it, but the History page stores the reply as generated, not the edited version.
- **Flags and themes come from an AI model.** They can occasionally be wrong, and seeded reviews keep their preset flags and themes rather than being re-classified.
- **Time saved is an estimate.** It assumes 5 minutes per reply and is not measured.
- **Single role.** Every user is a business owner. There are no teams, roles or admin views.
- **Internet and LLM key required.** Reply generation and theme suggestions need network access to the LLM. Generation retries once and then shows an error.
- **Google sign-in needs HTTPS.** The secure session cookie means local testing normally uses the development sign-in described above.

## Future Scope

- **Real platform connections** through official APIs once business verification and app review are in place.
- **Reply presets** so owners can save their favourite tone and offer and start every reply pre-filled.
- **Saved edits** so History keeps the version the owner actually used.
- **Sentiment trends** showing positive vs negative over the past weeks on the dashboard.
- **Reply confidence** with a quality score and word-count fit before copying.
- **Weekly Issue Radar digest** emailed to the owner so problems are caught before they pile up.
- **Multi-location and team support** with roles, so several staff can share one workspace.
- **Localized interface** in more languages, beyond the reply language matching that already exists.
- **Richer analytics** such as response-time tracking and per-review status labels.
