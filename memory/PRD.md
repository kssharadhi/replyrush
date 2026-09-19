# ReplyRush — PRD

## Problem statement
AI-powered review & complaint reply assistant for small local businesses. Owners get reviews on Google, Zomato, Amazon, Yelp and Instagram but have no time to reply. ReplyRush drafts fast, personal (never templated) replies. It DRAFTS ONLY — never auto-posts. No real platform APIs; "Connect" simulates using seeded sample data.

## Architecture
- Frontend: React (CRA/craco), Tailwind + shadcn/ui, framer-motion, react-icons (Si* + FaAmazon), recharts, sonner. Routing via react-router. Auth state in AuthContext.
- Backend: FastAPI + Motor (MongoDB). All routes under /api.
- Auth: Emergent-managed Google OAuth only (prompt=select_account). Session stored as httpOnly cookie `session_token`; backend also accepts `Authorization: Bearer`. Frontend axios attaches `Bearer localStorage.rr_token` when present (test/non-browser clients).
- LLM: Claude Sonnet 4.6 via emergentintegrations LlmChat + EMERGENT_LLM_KEY. One structured-JSON call per reply; one cached call per theme for the "suggested action".

## User persona
Owner/manager of a restaurant, retail store, salon or service business who needs quick, on-brand replies to public reviews.

## Core requirements (static)
- 5 platforms with brand logos/colors everywhere.
- Per-user persistence of reviews, replies, history, themes.
- Strict AI honesty: never invent refunds/discounts/policies/contact details/promises absent from the review or the owner's "what can you offer?" field. Match the review's language. ~50–120 words.
- Flags red/yellow/green; red sorts first. Themes from a fixed 8-item set.
- Issue Radar: theme bars split by platform + trend vs previous 30d; pulsing "Needs attention" banner when a theme has ≥3 negatives or ≥2 reds; side drawer with matching reviews + one suggested action.
- Seed 25 reviews (5/platform), pre-tagged, incl. Spanish + French, ≥2 red flags, radar lights up on first connect.

## Implemented (2026-06-19)
- Landing, Login (Google OAuth), Dashboard (analytics donut + animated counters + time saved + urgency chips + Issue Radar + 5 Connect cards), Connect flow (2s loader → sorted seeded cards), Reply Studio (business type + tone + offer + Generate/Edit/Copy/Regenerate), History (platform + flag filters).
- Backend endpoints: auth/session, auth/me, auth/logout, platforms/status, connect/{platform}, reviews (list/get/manual), reviews/{id}/generate, analytics, issue-radar, issue-radar/theme?theme=.
- Seed data with themes/flags/languages; radar alert verified across platforms.
- Verified: language matching (ES/FR), honesty rule, connect idempotency, sorting, analytics, radar alerts, theme drawer action (incl. slash themes).

## Known/After-fix notes
- Fixed: theme drilldown moved from path param to `?theme=` (slash-containing themes 404'd before).
- Added: one retry + error state around LLM generate; ThemeDrawer error state; SheetDescription a11y.

## Backlog (P1/P2)
- P1: Recharts ResponsiveContainer min-height polish; hash review IDs in theme_actions cache key.
- P2: Richer analytics over time; per-review status labels.
