from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

from seed_data import SEED_REVIEWS, PLATFORMS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("replyrush")

THEMES = [
    "Product quality", "Delivery/Wait time", "Staff/Service", "Pricing/Value",
    "Cleanliness/Environment", "Order accuracy", "Refund/Billing", "Other",
]


# ---------------------------- Models ----------------------------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


class SessionInput(BaseModel):
    session_id: str


class ManualReviewInput(BaseModel):
    platform: str
    rating: int
    text: str
    reviewer_name: Optional[str] = ""


class GenerateInput(BaseModel):
    business_type: str
    tone: str
    offer: Optional[str] = ""


# ---------------------------- Auth helpers ----------------------------
async def get_current_user(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


@api_router.post("/auth/session")
async def create_session(payload: SessionInput, response: Response):
    async with httpx.AsyncClient() as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Failed to validate session")
    data = r.json()

    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60,
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user_doc)


@api_router.get("/auth/me", response_model=User)
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------------------- Review helpers ----------------------------
def _iso_days_ago(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


FLAG_ORDER = {"red": 0, "yellow": 1, "green": 2}


def _sort_reviews(reviews: List[dict]) -> List[dict]:
    return sorted(reviews, key=lambda r: (FLAG_ORDER.get(r.get("flag"), 3), r.get("date", "")))


async def _serialize(reviews):
    return [Review_out(r) for r in reviews]


def Review_out(r: dict) -> dict:
    r = dict(r)
    r.pop("_id", None)
    return r


@api_router.get("/platforms/status")
async def platforms_status(user: User = Depends(get_current_user)):
    out = []
    for p in PLATFORMS:
        count = await db.reviews.count_documents({"user_id": user.user_id, "platform": p})
        out.append({"platform": p, "connected": count > 0, "review_count": count})
    return out


@api_router.post("/connect/{platform}")
async def connect_platform(platform: str, user: User = Depends(get_current_user)):
    if platform not in PLATFORMS:
        raise HTTPException(status_code=404, detail="Unknown platform")

    existing = await db.reviews.count_documents({"user_id": user.user_id, "platform": platform})
    if existing == 0:
        docs = []
        for s in SEED_REVIEWS[platform]:
            docs.append({
                "id": str(uuid.uuid4()),
                "user_id": user.user_id,
                "platform": platform,
                "reviewer_name": s["reviewer_name"],
                "rating": s["rating"],
                "text": s["text"],
                "date": _iso_days_ago(s["days_ago"]),
                "flag": s["flag"],
                "sentiment": s["sentiment"],
                "themes": s["themes"],
                "language": s["language"],
                "reply": None,
                "urgency_reason": None,
                "handled": False,
                "source": "seed",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        if docs:
            await db.reviews.insert_many(docs)
        # new reviews arrived -> invalidate cached theme actions
        await db.theme_actions.delete_many({"user_id": user.user_id})

    reviews = await db.reviews.find(
        {"user_id": user.user_id, "platform": platform}, {"_id": 0}
    ).to_list(1000)
    return _sort_reviews(reviews)


@api_router.get("/reviews")
async def list_reviews(
    user: User = Depends(get_current_user),
    platform: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    handled: Optional[bool] = Query(None),
):
    q = {"user_id": user.user_id}
    if platform and platform != "all":
        q["platform"] = platform
    if flag and flag != "all":
        q["flag"] = flag
    if handled is not None:
        q["handled"] = handled
    reviews = await db.reviews.find(q, {"_id": 0}).to_list(1000)
    return _sort_reviews(reviews)


@api_router.get("/reviews/{review_id}")
async def get_review(review_id: str, user: User = Depends(get_current_user)):
    r = await db.reviews.find_one({"id": review_id, "user_id": user.user_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")
    return r


@api_router.post("/reviews/manual")
async def add_manual_review(payload: ManualReviewInput, user: User = Depends(get_current_user)):
    if payload.platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail="Unknown platform")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user.user_id,
        "platform": payload.platform,
        "reviewer_name": payload.reviewer_name or "Anonymous",
        "rating": payload.rating,
        "text": payload.text,
        "date": datetime.now(timezone.utc).isoformat(),
        "flag": None,
        "sentiment": None,
        "themes": [],
        "language": "en",
        "reply": None,
        "urgency_reason": None,
        "handled": False,
        "source": "manual",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    return Review_out(doc)


# ---------------------------- LLM ----------------------------
def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip().rstrip("`").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


def _reply_system_prompt(business_type: str, tone: str, offer: str) -> str:
    tone_map = {
        "Friendly": "warm, personable and genuine",
        "Formal": "polished, professional and courteous",
        "Apologetic-and-solution-focused": "sincerely apologetic while staying focused on a concrete next step",
    }
    tone_desc = tone_map.get(tone, "warm and genuine")
    offer_line = (
        f'The business owner has authorised ONLY the following resolution(s), which are the ONLY resolutions you may mention: "{offer.strip()}".'
        if offer and offer.strip()
        else "The business owner has NOT authorised any specific resolution. You may NOT promise any refund, replacement, discount, compensation or specific action."
    )
    return f"""You are ReplyRush, an expert reply-writer helping the owner of a {business_type} respond publicly to a customer review.

Write a reply that is {tone_desc}. Follow these rules with zero exceptions:
- Read the actual review and reference its SPECIFIC details (the dish, product, delay, staff behaviour, price, etc.). Never use generic filler like "we're sorry for the inconvenience".
- Vary structure and wording every single time, even for similar ratings.
- Reply in the SAME language as the review.
- Keep it short for a public platform: roughly 50-120 words.
- Do NOT assume region-specific things (currency, holidays) unless present in the review.
- {offer_line}
- STRICT HONESTY: never invent facts, refunds, compensation, policies, staff actions, discounts, resolutions, contact details, names, phone numbers, emails or links that are not in the review or in the authorised resolution above. If there is not enough info to promise a resolution, acknowledge the specific issue and invite the customer to get in touch WITHOUT inventing any contact detail. For positive reviews, thank them for the specifics and promise nothing.

Also classify the review.
Flag rules: red = angry, urgent, or threatening to leave/report/escalate; yellow = moderately negative; green = neutral or positive.
Themes must be 1 to 3 items chosen ONLY from: {", ".join(THEMES)}.

Return ONLY valid minified JSON, no markdown, with EXACTLY this shape:
{{"reply": string, "sentiment": "positive|neutral|negative", "flag": "red|yellow|green", "urgency_reason": string, "themes": [string]}}"""


async def _call_llm_reply(review: dict, payload: GenerateInput) -> dict:
    system = _reply_system_prompt(payload.business_type, payload.tone, payload.offer or "")
    user_prompt = (
        f"Platform: {review['platform']}\n"
        f"Star rating: {review['rating']} out of 5\n"
        f"Reviewer name: {review.get('reviewer_name') or 'Unknown'}\n"
        f"Review text:\n\"\"\"{review['text']}\"\"\"\n\n"
        f"Write the reply and classification now as JSON."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"reply-{review['id']}-{uuid.uuid4().hex[:6]}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-6")
    resp = await chat.send_message(UserMessage(text=user_prompt))
    data = _extract_json(resp if isinstance(resp, str) else str(resp))
    return data


@api_router.post("/reviews/{review_id}/generate")
async def generate_reply(review_id: str, payload: GenerateInput, user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id, "user_id": user.user_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    try:
        data = await _call_llm_reply(review, payload)
    except Exception:
        try:
            data = await _call_llm_reply(review, payload)
        except Exception as e:
            logger.exception("LLM generation failed")
            raise HTTPException(status_code=502, detail=f"Reply generation failed: {e}")

    update = {
        "reply": data.get("reply", "").strip(),
        "handled": True,
        "handled_at": datetime.now(timezone.utc).isoformat(),
        "business_type": payload.business_type,
        "tone": payload.tone,
    }
    # Seeded reviews keep their pre-set flag/themes; manual reviews get tagged now.
    if review.get("source") == "manual" or not review.get("flag"):
        update["flag"] = data.get("flag", "yellow")
        update["sentiment"] = data.get("sentiment", "neutral")
        themes = [t for t in data.get("themes", []) if t in THEMES][:3] or ["Other"]
        update["themes"] = themes

    await db.reviews.update_one({"id": review_id, "user_id": user.user_id}, {"$set": update})
    await db.theme_actions.delete_many({"user_id": user.user_id})
    updated = await db.reviews.find_one({"id": review_id, "user_id": user.user_id}, {"_id": 0})
    return updated


# ---------------------------- Analytics ----------------------------
@api_router.get("/analytics")
async def analytics(user: User = Depends(get_current_user)):
    reviews = await db.reviews.find({"user_id": user.user_id}, {"_id": 0}).to_list(2000)
    total = len(reviews)
    handled = sum(1 for r in reviews if r.get("handled"))
    positive = sum(1 for r in reviews if r.get("flag") == "green")
    negative = sum(1 for r in reviews if r.get("flag") in ("red", "yellow"))
    red = sum(1 for r in reviews if r.get("flag") == "red")
    yellow = sum(1 for r in reviews if r.get("flag") == "yellow")
    green = positive
    minutes_saved = handled * 5
    return {
        "total_reviews": total,
        "handled": handled,
        "positive": positive,
        "negative": negative,
        "red": red,
        "yellow": yellow,
        "green": green,
        "minutes_saved": minutes_saved,
    }


# ---------------------------- Issue Radar ----------------------------
def _within(days_from_iso: str, start: datetime, end: datetime) -> bool:
    try:
        d = datetime.fromisoformat(days_from_iso)
    except Exception:
        return False
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return start <= d < end


@api_router.get("/issue-radar")
async def issue_radar(user: User = Depends(get_current_user)):
    reviews = await db.reviews.find({"user_id": user.user_id}, {"_id": 0}).to_list(2000)
    now = datetime.now(timezone.utc)
    cur_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)

    themes = {}
    for r in reviews:
        date = r.get("date", "")
        in_cur = _within(date, cur_start, now)
        in_prev = _within(date, prev_start, cur_start)
        if not (in_cur or in_prev):
            continue
        for t in r.get("themes", []):
            entry = themes.setdefault(t, {
                "theme": t, "count": 0, "prev_count": 0,
                "negative": 0, "red": 0, "platforms": {}, "neg_platforms": {},
            })
            if in_cur:
                entry["count"] += 1
                if r.get("flag") in ("red", "yellow"):
                    entry["negative"] += 1
                    entry["neg_platforms"][r["platform"]] = entry["neg_platforms"].get(r["platform"], 0) + 1
                if r.get("flag") == "red":
                    entry["red"] += 1
                entry["platforms"][r["platform"]] = entry["platforms"].get(r["platform"], 0) + 1
            elif in_prev:
                entry["prev_count"] += 1

    result = []
    alerts = []
    for t, e in themes.items():
        if e["count"] == 0:
            continue
        trend = "up" if e["count"] > e["prev_count"] else ("down" if e["count"] < e["prev_count"] else "flat")
        platforms = sorted(e["platforms"].items(), key=lambda x: -x[1])
        e_out = {
            "theme": t,
            "count": e["count"],
            "negative": e["negative"],
            "red": e["red"],
            "trend": trend,
            "platforms": [{"platform": p, "count": c} for p, c in platforms],
        }
        result.append(e_out)
        if e["negative"] >= 3 or e["red"] >= 2:
            neg_plat = sorted(e["neg_platforms"].items(), key=lambda x: -x[1])
            plat_names = [p for p, _ in neg_plat]
            alerts.append({
                "theme": t,
                "negative": e["negative"],
                "platforms": plat_names,
                "message": f"{t}: {e['negative']} complaints across {_join_platforms(plat_names)}",
            })

    result.sort(key=lambda x: (-x["negative"], -x["count"]))
    return {"themes": result, "alerts": alerts}


def _join_platforms(names: List[str]) -> str:
    pretty = {"google": "Google", "zomato": "Zomato", "amazon": "Amazon", "yelp": "Yelp", "instagram": "Instagram"}
    names = [pretty.get(n, n.title()) for n in names]
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f" and {names[-1]}"


@api_router.get("/issue-radar/theme")
async def theme_detail(theme: str = Query(...), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    cur_start = now - timedelta(days=30)
    reviews = await db.reviews.find({"user_id": user.user_id}, {"_id": 0}).to_list(2000)
    matching = [
        r for r in reviews
        if theme in r.get("themes", []) and _within(r.get("date", ""), cur_start, now)
    ]
    matching = _sort_reviews(matching)

    cache_key = f"{theme}:{len(matching)}"
    cached = await db.theme_actions.find_one(
        {"user_id": user.user_id, "theme": theme, "cache_key": cache_key}, {"_id": 0}
    )
    if cached:
        action = cached["action"]
    else:
        action = await _generate_theme_action(theme, matching)
        await db.theme_actions.delete_many({"user_id": user.user_id, "theme": theme})
        await db.theme_actions.insert_one({
            "user_id": user.user_id, "theme": theme, "cache_key": cache_key,
            "action": action, "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"theme": theme, "reviews": matching, "suggested_action": action}


async def _generate_theme_action(theme: str, reviews: List[dict]) -> str:
    if not reviews:
        return "No recent reviews for this theme."
    neg = sum(1 for r in reviews if r.get("flag") in ("red", "yellow"))
    platforms = sorted({r["platform"] for r in reviews})
    snippets = "\n".join(f"- ({r['platform']}, {r['flag']}) {r['text'][:180]}" for r in reviews[:8])
    system = (
        "You advise a small local business owner. Based ONLY on the reviews provided and their counts, "
        "write ONE short, concrete, actionable suggestion (max 30 words). Do NOT invent facts, numbers, "
        "policies, or details about the business that are not present in the reviews. Return plain text only, no markdown."
    )
    prompt = (
        f"Theme: {theme}\n"
        f"Total reviews this period: {len(reviews)} ({neg} negative) across {', '.join(platforms)}.\n"
        f"Reviews:\n{snippets}\n\nGive one suggested action:"
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"action-{theme}-{uuid.uuid4().hex[:6]}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-6")
        resp = await chat.send_message(UserMessage(text=prompt))
        return (resp if isinstance(resp, str) else str(resp)).strip()
    except Exception:
        logger.exception("theme action failed")
        return f"Review the {neg} recent complaints about {theme} across {', '.join(platforms)} and address the most common issue first."


@api_router.get("/")
async def root():
    return {"message": "ReplyRush API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
