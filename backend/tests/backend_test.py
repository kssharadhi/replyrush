"""ReplyRush backend integration tests.
Runs against the external REACT_APP_BACKEND_URL using the seeded test session.
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://review-rush-ai.preview.emergentagent.com").rstrip("/")
TOKEN = "test_session_replyrush"
PLATFORMS = ["google", "zomato", "amazon", "yelp", "instagram"]


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    })
    return s


@pytest.fixture(scope="session", autouse=True)
def _reset_state(api):
    # ensure a clean slate for the seeded test user, but keep session
    # we can't delete via API, rely on mongosh in shell before running tests
    yield


# ---------- Auth ----------
def test_auth_me(api):
    r = api.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user_id"] == "user_testreplyrush"
    assert data["email"] == "owner@replyrush.test"


def test_auth_me_unauthorized():
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


# ---------- Connect ----------
@pytest.mark.parametrize("platform", PLATFORMS)
def test_connect_seeds_5_and_sorted(api, platform):
    r = api.post(f"{BASE_URL}/api/connect/{platform}")
    assert r.status_code == 200, r.text
    reviews = r.json()
    assert len(reviews) == 5, f"{platform} should have 5, got {len(reviews)}"
    # verify sort: red first, then yellow, then green
    order = {"red": 0, "yellow": 1, "green": 2}
    flags = [order.get(x["flag"], 3) for x in reviews]
    assert flags == sorted(flags), f"{platform} not sorted: {[r['flag'] for r in reviews]}"
    # pre-tagged themes and flag
    for rv in reviews:
        assert rv["flag"] in ("red", "yellow", "green")
        assert isinstance(rv["themes"], list) and len(rv["themes"]) >= 1


def test_connect_idempotent(api):
    # call again for google, should still be 5
    r = api.post(f"{BASE_URL}/api/connect/google")
    assert r.status_code == 200
    assert len(r.json()) == 5


def test_connect_unknown_platform(api):
    r = api.post(f"{BASE_URL}/api/connect/facebook")
    assert r.status_code == 404


# ---------- Seed integrity ----------
def test_total_25_and_language_and_reds(api):
    r = api.get(f"{BASE_URL}/api/reviews")
    assert r.status_code == 200
    revs = r.json()
    assert len(revs) == 25
    reds = [x for x in revs if x["flag"] == "red"]
    assert len(reds) >= 2
    langs = {x["language"] for x in revs}
    assert "es" in langs, "Spanish review missing"
    assert "fr" in langs, "French review missing"


# ---------- Analytics ----------
def test_analytics_counts(api):
    r = api.get(f"{BASE_URL}/api/analytics")
    assert r.status_code == 200
    a = r.json()
    assert a["total_reviews"] == 25
    assert a["red"] + a["yellow"] + a["green"] == 25
    assert a["negative"] == a["red"] + a["yellow"]
    assert a["positive"] == a["green"]
    assert a["minutes_saved"] == a["handled"] * 5


# ---------- Issue Radar ----------
def test_issue_radar_and_alert(api):
    r = api.get(f"{BASE_URL}/api/issue-radar")
    assert r.status_code == 200
    data = r.json()
    themes = data["themes"]
    assert any(t["theme"] == "Delivery/Wait time" for t in themes)
    dwt = next(t for t in themes if t["theme"] == "Delivery/Wait time")
    # multi-platform
    assert len(dwt["platforms"]) >= 2
    # alerts include Delivery/Wait time (>=3 negatives)
    alerts = data["alerts"]
    assert any(a["theme"] == "Delivery/Wait time" for a in alerts), f"alerts: {alerts}"
    dwt_alert = next(a for a in alerts if a["theme"] == "Delivery/Wait time")
    assert len(dwt_alert["platforms"]) >= 2


def test_theme_detail_with_llm_action(api):
    r = api.get(f"{BASE_URL}/api/issue-radar/theme/Delivery%2FWait%20time")
    assert r.status_code == 200
    data = r.json()
    assert data["theme"] == "Delivery/Wait time"
    assert len(data["reviews"]) >= 3
    assert isinstance(data["suggested_action"], str) and len(data["suggested_action"]) > 5

    # second call must return same cached action
    r2 = api.get(f"{BASE_URL}/api/issue-radar/theme/Delivery%2FWait%20time")
    assert r2.status_code == 200
    assert r2.json()["suggested_action"] == data["suggested_action"]


# ---------- Generate replies ----------
def _find_review(api, language=None, platform=None):
    revs = api.get(f"{BASE_URL}/api/reviews").json()
    for r in revs:
        if language and r["language"] != language:
            continue
        if platform and r["platform"] != platform:
            continue
        return r
    return None


def test_generate_english_no_offer_honesty(api):
    # pick a red english review
    revs = api.get(f"{BASE_URL}/api/reviews").json()
    target = next(r for r in revs if r["flag"] == "red" and r["language"] == "en")
    payload = {"business_type": "Restaurant", "tone": "Apologetic-and-solution-focused", "offer": ""}
    r = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["handled"] is True
    reply = updated["reply"]
    assert reply and len(reply) > 10
    # HONESTY: no invented refund/discount/contact
    banned = [r"\brefund\b", r"\bdiscount\b", r"\bcompensat", r"\bvoucher\b",
              r"\bfree\b", r"\bcoupon\b", r"\bcall us at\b", r"\bemail us at\b",
              r"\+?\d[\d\-\s]{6,}", r"\b[\w\.-]+@[\w\.-]+\b"]
    for pat in banned:
        assert not re.search(pat, reply, re.I), f"Banned invention '{pat}' in reply: {reply}"


def test_generate_spanish_language_match(api):
    target = _find_review(api, language="es")
    assert target, "no spanish review"
    payload = {"business_type": "Restaurant", "tone": "Friendly", "offer": ""}
    r = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload)
    assert r.status_code == 200, r.text
    reply = r.json()["reply"].lower()
    # Spanish detection: presence of common spanish words / accents
    assert any(w in reply for w in [" gracias", "hola", "por ", " nos", "usted", "ñ", "á", "é", "í", "ó", "ú"]), reply


def test_generate_french_language_match(api):
    target = _find_review(api, language="fr")
    assert target, "no french review"
    payload = {"business_type": "Salon", "tone": "Apologetic-and-solution-focused", "offer": ""}
    r = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload)
    assert r.status_code == 200, r.text
    reply = r.json()["reply"].lower()
    assert any(w in reply for w in [" merci", " nous", " vous", " désol", " excus", "é", "è", "à"]), reply


def test_generate_with_offer_allows_that_offer(api):
    revs = api.get(f"{BASE_URL}/api/reviews").json()
    # amazon red about product + refund
    target = next(r for r in revs if r["platform"] == "amazon" and r["flag"] == "red")
    payload = {"business_type": "Home appliances retailer", "tone": "Formal", "offer": "full refund available"}
    r = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload)
    assert r.status_code == 200
    reply = r.json()["reply"].lower()
    assert "refund" in reply


def test_regenerate_produces_different_text(api):
    revs = api.get(f"{BASE_URL}/api/reviews").json()
    target = next(r for r in revs if r["platform"] == "yelp" and r["flag"] == "yellow")
    payload = {"business_type": "Salon", "tone": "Friendly", "offer": ""}
    r1 = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload).json()
    r2 = api.post(f"{BASE_URL}/api/reviews/{target['id']}/generate", json=payload).json()
    assert r1["reply"] != r2["reply"], "Regenerate returned identical text"


# ---------- Manual review ----------
def test_manual_review_flow(api):
    payload = {"platform": "google", "rating": 2, "text": "TEST_manual: The waiter forgot our drinks and the table was sticky.", "reviewer_name": "TEST_reviewer"}
    r = api.post(f"{BASE_URL}/api/reviews/manual", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["source"] == "manual"
    assert created["flag"] is None
    assert created["themes"] == []

    gen = api.post(f"{BASE_URL}/api/reviews/{created['id']}/generate", json={
        "business_type": "Restaurant", "tone": "Apologetic-and-solution-focused", "offer": ""
    })
    assert gen.status_code == 200
    updated = gen.json()
    assert updated["flag"] in ("red", "yellow", "green")
    assert len(updated["themes"]) >= 1


# ---------- Filters ----------
def test_history_filters(api):
    handled = api.get(f"{BASE_URL}/api/reviews", params={"handled": "true"}).json()
    assert all(r["handled"] for r in handled)

    r_google = api.get(f"{BASE_URL}/api/reviews", params={"platform": "google"}).json()
    assert all(r["platform"] == "google" for r in r_google)

    r_red = api.get(f"{BASE_URL}/api/reviews", params={"flag": "red"}).json()
    assert all(r["flag"] == "red" for r in r_red)
    assert len(r_red) >= 2
