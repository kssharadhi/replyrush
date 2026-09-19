# Auth-Gated Testing Playbook (ReplyRush)

Login: Emergent-managed Google OAuth ONLY. Backend accepts either the httpOnly
`session_token` cookie OR `Authorization: Bearer <token>`. The frontend axios
client also attaches `Authorization: Bearer <localStorage.rr_token>` when that
key is present (used for automated browser tests).

## Pre-seeded test identity
- user_id: user_testreplyrush
- email: owner@replyrush.test
- session_token: test_session_replyrush

Recreate if missing:
```
mongosh --quiet --eval '
use("test_database");
var uid="user_testreplyrush", tok="test_session_replyrush";
db.users.updateOne({user_id:uid},{$set:{user_id:uid,email:"owner@replyrush.test",name:"Test Owner",picture:"https://via.placeholder.com/150",created_at:new Date().toISOString()}},{upsert:true});
db.user_sessions.updateOne({session_token:tok},{$set:{user_id:uid,session_token:tok,expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(),created_at:new Date().toISOString()}},{upsert:true});
'
```

## Backend API (Bearer)
curl $BASE/api/auth/me -H "Authorization: Bearer test_session_replyrush"

## Frontend browser auth (recommended: localStorage token)
Before loading protected routes, seed the token then navigate:
```
await page.add_init_script("window.localStorage.setItem('rr_token','test_session_replyrush');")
await page.goto(f"{BASE}/dashboard")
```
Alternative: inject cookie session_token (httpOnly, secure, sameSite=None).
