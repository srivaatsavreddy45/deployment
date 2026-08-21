# Team-2 API Contract (living document)

**Machine-readable spec:** `docs/openapi.yaml` (OpenAPI 3.0.3) mirrors the volunteer feedback
endpoints in §2 and carries the same CONFIRMED / PROPOSED / OPEN labelling. The frontend can generate
a client from it. It is validated against the OpenAPI 3.0.3 schema.

Status legend:

- **CONFIRMED** — observable in committed code, or explicitly agreed by the team.
- **PROPOSED** — Dev 2's proposal, awaiting team sign-off. Not a requirement yet.
- **OPEN QUESTION** — genuinely unresolved. Must not be guessed.

> ⚠️ The formal "Volunteer Feedback Collection & Experience Tracking System" requirements document
> has **not** been supplied in-session. Nothing here is derived from it. Re-validate this contract
> against the real requirements before implementation.

Envelope for every endpoint below (CONFIRMED, from `server/middleware/errorHandler.js` and existing
controllers):

```
success  { success: true, data: {...} }        (lists add "count")
error    { success: false, message: "..." }
```

---

## 1. Auth / User — **CONFIRMED (implemented & verified in Phase 2)**

### 1.1 User model — `server/models/User.js`

| Field | Type | Required | Default |
|---|---|---|---|
| `name` | String (trim) | yes | — |
| `email` | String (unique, lowercase, trim, regex) | yes | — |
| `password` | String, min 8, `select: false` | yes | — (bcryptjs, 10 rounds) |
| `refreshToken` | String, `select: false` | no | — |
| `role` | String enum `volunteer` \| `admin` \| `spoc` | no | `volunteer` |
| `verificationStatus` | String enum `pending` \| `verified` \| `rejected` | no | `pending` |
| `status` | String enum `active` \| `inactive` \| `pending` | no | `active` |
| `createdAt`, `updatedAt` | Date | auto | — |
| `isVerified` | **virtual** (`verificationStatus === 'verified'`) | derived | — |

`password` and `refreshToken` are never returned: `select: false` plus a `toJSON` transform.

### 1.2 `req.user` — CONFIRMED

```js
req.user = { _id, role, verificationStatus }
```

`_id` (ObjectId) is canonical. **`req.user.id` does not exist.** `verificationStatus` is re-read from
the database on every request, so admin decisions take effect immediately.

### 1.3 Roles — CONFIRMED

`volunteer` (default) | `admin` | `spoc`. Lowercase only.

### 1.4 Verification states & access policy — CONFIRMED

| State | Authenticate | Read own profile | Verified-only volunteer features |
|---|---|---|---|
| `pending` | yes | yes | **403** "waiting for Admin verification" |
| `verified` | yes | yes | yes |
| `rejected` | yes | yes | **403** "rejected by an Admin" |

Middleware: `verifyJWT` -> `authorizeRoles(...)` -> `requireVerifiedVolunteer`.

### 1.5 Endpoints

All responses use `{ success, message?, data? }`; errors use `{ success: false, message, errors? }`.

---

**`POST /api/auth/register`** — create a volunteer account.
Auth: none · Role: none · Verification: n/a

Request: `{ "name": "...", "email": "...", "password": "min 8 chars" }`

Always creates `role: 'volunteer'`, `verificationStatus: 'pending'`.
Supplying `role`, `verificationStatus`, `isVerified`, `status`, or `corporatePartnerId` is **rejected
with 422** — these can never be set by a client.

`201` -> `{ success, message: "Registration successful. Your account is waiting for Admin verification.", data: <sanitized user> }`

Errors: `409` duplicate email · `422` validation (name 2–80, valid email, password 8–72, forbidden field present)

---

**`POST /api/auth/login`**
Auth: none · Role: none · Verification: **not required** (pending/rejected may log in to see status)

Request: `{ "email": "...", "password": "..." }`

`200` -> `{ success, message: "Login successful", data: <sanitized user> }` and sets `accessToken` +
`refreshToken` as `httpOnly` cookies.

Errors: `401` incorrect email or password (identical message for both, by design) · `403` account
deactivated (`status: 'inactive'`) · `422` validation

---

**`POST /api/auth/refresh-token`**
Auth: refresh cookie · Role: none · Verification: none

Request: no body; `refreshToken` cookie required. Rotates both cookies.

`200` -> `{ success, message: "Tokens refreshed successfully" }`
Errors: `401` missing/invalid/revoked refresh token · `403` deactivated · `422` cookie absent

---

**`POST /api/auth/logout`**
Auth: **required** · Role: any · Verification: none

Clears both cookies and unsets the stored `refreshToken`, so the old refresh token is revoked
(verified: refresh after logout returns `401`).

`200` -> `{ success, message: "Logout successful" }` · `401` unauthenticated

---

**`GET /api/auth/me`**
Auth: **required** · Role: any · Verification: none

`200` -> `{ success, data: { _id, name, email, role, verificationStatus, isVerified, status, createdAt, updatedAt } }`
`401` unauthenticated / invalid / expired token

---

**`PATCH /api/admin/users/:id/verification`** — admin verification. **(CANONICAL)**
Auth: **required** · Role: **`admin`** · Verification: n/a

Request: `{ "verificationStatus": "verified" }` or `{ "verificationStatus": "rejected" }`

Only these two values are accepted, and only users with `role: 'volunteer'` may be targeted.

`200` -> `{ success, message: "Volunteer verified successfully", data: <sanitized user> }`
Errors: `401` unauthenticated · `403` caller is not admin · `404` volunteer not found ·
`422` missing/invalid `verificationStatus`, invalid `id`

**Security:** volunteers cannot call this (403 verified). There is no other path to
`verificationStatus`.

> **Contract change (auth reconciliation with PR #7).** This endpoint moved from
> `PATCH /api/auth/users/:userId/verify` to `PATCH /api/admin/users/:id/verification`. Verification
> is an admin operation on a user resource, the admin router already applies
> `verifyJWT + authorizeRoles('admin')` structurally, and `origin/main` already carried this path —
> converging removes a duplicate implementation. There were **no client callers** of either path, so
> nothing downstream breaks. The old path no longer exists; there is exactly one implementation.

**Side effect:** a successful transition emails the volunteer. Email delivery is best-effort — if
SMTP is unconfigured the send fails, is logged, and the transition still returns `200`.

### 1.6 Mass-assignment protection — CONFIRMED

`services/userServices.js` allow-lists: create -> `name`, `email`, `password`; update -> `name`,
`email`. `role`, `verificationStatus`, `isVerified`, `refreshToken`, `status` are dropped from any
generic user write. Verified: `PUT /api/users/:id` with `{"role":"admin","verificationStatus":"verified"}`
returns 200 but leaves the user `volunteer`/`pending`.

> ⚠️ **OPEN:** `/api/users/*` is still unauthenticated. Allow-lists prevent escalation, but the
> routes need `verifyJWT` + an ownership/role rule. Tracked as a Phase 3 decision.

## 1.7 User profile & admin provisioning — **IMPLEMENTED (Phase 6a)**

### Self-service — `/api/users`

| Method | Route | Auth | Who |
|---|---|---|---|
| GET | `/api/users/:id` | required | the owner, or an `admin` |
| PUT | `/api/users/:id` | required | **the owner only** |

Non-matching id returns **404**, not 403, so ids cannot be enumerated (same convention as
`GET /api/feedback/:id/confirmation`). Unauthenticated requests return **401**.

`PUT` accepts **`name` and `email` only**. Supplying `role`, `status`, `verificationStatus`,
`isVerified` or `refreshToken` returns **422** — the field is never silently dropped. Unknown fields
(for example the client's `company`) are ignored and not persisted.

**Deliberately not provided here:**

| Removed | Use instead |
|---|---|
| `GET /api/users` (directory) | `GET /api/admin/users` (admin) |
| `POST /api/users` | `POST /api/auth/register` (public, volunteer) or `POST /api/admin/users` (admin) |
| `DELETE /api/users/:id` | `DELETE /api/admin/users/:id` (admin) |

Deletion is administrative: `/api/admin/users/:id` already implements it under
`authorizeRoles('admin')`, and no product requirement calls for self-serve account deletion.

### Admin provisioning — `/api/admin/users`

`POST /api/admin/users` and `PUT /api/admin/users/:id` may set **`role`** (`volunteer` | `admin` |
`spoc`) and **`status`**. This is the canonical way to create a **SPOC** account.

> **Bug fixed in Phase 6a.** These previously returned `success: true` while silently creating or
> leaving a `volunteer`: `adminController` passed an admin allow-list as a third argument, but
> `userServices.updateUserById`/`createUser` ignored it. `role` is now persisted correctly.

`verificationStatus` is never accepted from a client on any path (422). It is **derived** for
provisioned privileged roles:

| Created / promoted as | verificationStatus |
|---|---|
| `volunteer` (public register, or admin-created) | `pending` |
| `spoc` (admin-created or admin-promoted) | **`verified`** |
| `admin` (admin-created or admin-promoted) | **`verified`** |

Rationale: the authenticated admin's act of provisioning *is* the authorization decision, matching
`scripts/seedAdmin.js`, which seeds its admin as `verified`. It is also a correctness requirement —
`PATCH /api/admin/users/:id/verification` only matches `role: 'volunteer'`, so a privileged account
left `pending` could never be verified afterwards (returns `404 "Volunteer not found"`).

Volunteer verification is otherwise unchanged: it moves only via
`PATCH /api/admin/users/:id/verification`.

**Role transitions** (`PUT /api/admin/users/:id`), derived server-side:

| Transition | verificationStatus |
|---|---|
| `volunteer` -> `spoc` / `admin` | **`verified`** |
| `spoc` / `admin` -> `volunteer` | **`pending`** |
| same role re-written (e.g. `volunteer` -> `volunteer`) | unchanged |
| update without a `role` field | unchanged |

A demoted account must pass the volunteer verification workflow again; it does not carry over the
verified state it held while privileged. Because only a real transition counts, an admin editing an
already-verified volunteer — even one whose payload repeats `role: "volunteer"` — does not
un-verify them. Admin accounts are provisioned by `npm run seed:admin`
(`scripts/seedAdmin.js`), which stays the canonical mechanism; there is no admin self-registration.

> **Known frontend mismatch (backend unchanged, by design).** The client registration form sends
> `role` (`"volunteer"` / `"corporate"`) and `company`. Public registration rejects any client
> `role` with 422 and has no `company` field. `corporate` is not a backend role; the backend enum is
> `spoc`. Resolving this is a frontend change plus a team decision on the `corporate` -> `spoc`
> naming — see `CLAUDE.md`.

## 2. Volunteer Feedback — **IMPLEMENTED (Phase 4)**

> **Status:** implemented and verified end-to-end (47 endpoint tests + a concurrency test, all
> passing against live MongoDB). The field names remain team-PROPOSED in origin — they came from the
> client prototype — but the API now behaves exactly as described here.
> Resolved in Phase 4: dynamic `answers`, the `/mine` verification rule, inactive-form rejection,
> and the `activityId` type.

### 2.1 Persistence model — **IMPLEMENTED** (`server/models/FeedbackResponse.js`)

`server/models/FeedbackForm.js` (Dev 3) is a *questionnaire definition*. It stores **no volunteer
responses**. A separate `FeedbackResponse` model is required and is Dev 2's to write in Phase 4.

Implemented shape:

| Field | Type | Required | Status |
|---|---|---|---|
| `respondentId` | `ObjectId`, `ref: 'User'` | yes | **PROPOSED** — must be `ObjectId`, taken from `req.user._id`, never from the client |
| `feedbackFormId` | `ObjectId`, `ref: 'FeedbackForm'` | yes | **PROPOSED** |
| `activityId` | `ObjectId`, `ref: 'Activity'` | yes | **IMPLEMENTED** — must match the form's activity |
| `rating` | Number, integer, min 1, max 5 | yes | **PROPOSED** |
| `whatWentWell` | String, trim, max ~2000 | no | **PROPOSED** |
| `whatCouldBeImproved` | String, trim, max ~2000 | no | **PROPOSED** |
| `suggestions` | String, trim, max ~2000 | no | **PROPOSED** |
| `createdAt` / `updatedAt` | Date | auto | **CONFIRMED** convention |
| `answers` | array of `{ questionId, type, value }` | no | **IMPLEMENTED** — validated against the form |
| unique index | `{ respondentId: 1, feedbackFormId: 1 }`, unique | — | **IMPLEMENTED** as `uniq_respondent_form`; verified under concurrency |

**A `respondentId` of type String, or an optional `respondentId`, is not acceptable** — it breaks
`.populate()` for Dev 4's insights and Dev 5's reporting, and makes duplicate prevention impossible.

### 2.2 `POST /api/feedback` — submit volunteer feedback

| | |
|---|---|
| **Method / URL** | `POST /api/feedback` |
| **Purpose** | A verified volunteer submits feedback for one activity/form, once |
| **Auth** | **Required** — `verifyJWT` (**CONFIRMED**) |
| **Role** | `volunteer` — `authorizeRoles('volunteer')` (**CONFIRMED**) |
| **Verification** | `requireVerifiedVolunteer` — `pending` and `rejected` both get **403** (**CONFIRMED**) |
| **Success** | `201 Created` |

**Request headers**

```
Content-Type: application/json
Cookie: accessToken=<jwt>          # normal browser flow
Authorization: Bearer <jwt>        # equally supported
```

**Request body**

```jsonc
{
  "formId":              "68c1f0a4e2b1c3d4a5f60011",  // required, ObjectId string
  "activityId":          "68c1f0a4e2b1c3d4a5f60022",  // required, see §2.7
  "rating":              5,                            // required, integer 1..5
  "whatWentWell":        "Site coordination was smooth and clear.",   // optional, string
  "whatCouldBeImproved": "Transport pickup timing",                   // optional, string
  "suggestions":         "A short briefing before we start would help." // optional, string
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `formId` | string (ObjectId) | ✅ | must reference an existing `FeedbackForm` |
| `activityId` | string | ✅ | **OPEN** whether validated against `Activity` — §2.7 |
| `rating` | integer | ✅ | **PROPOSED** 1–5 |
| `whatWentWell` | string | ❌ | free text |
| `whatCouldBeImproved` | string | ❌ | free text |
| `suggestions` | string | ❌ | free text |

`respondentId` is **never accepted from the client** — it is always `req.user._id`. Any client-supplied
`respondentId`, `createdAt`, or `_id` is ignored/rejected.

**Success `201`** — this response *is* the submission confirmation:

```jsonc
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "_id": "68c1f0a4e2b1c3d4a5f60099",
    "formId": "68c1f0a4e2b1c3d4a5f60011",
    "activityId": "68c1f0a4e2b1c3d4a5f60022",
    "rating": 5,
    "whatWentWell": "Site coordination was smooth and clear.",
    "whatCouldBeImproved": "Transport pickup timing",
    "suggestions": "A short briefing before we start would help.",
    "createdAt": "2026-08-21T10:15:00.000Z"
  }
}
```

**Errors**

| Status | When | Body |
|---|---|---|
| `401` | no/invalid/expired token | `{ success:false, message:"Authentication required" }` / `"Invalid or expired access token"` |
| `403` | role is not `volunteer` | `{ success:false, message:"You are not authorized to perform this action" }` |
| `403` | `verificationStatus === 'pending'` | `{ success:false, message:"Your account is waiting for Admin verification" }` |
| `403` | `verificationStatus === 'rejected'` | `{ success:false, message:"Your volunteer account has been rejected by an Admin" }` |
| `404` | `formId` does not exist | `{ success:false, message:"Feedback form not found" }` |
| `409` | already submitted for this form | `{ success:false, message:"Feedback already submitted for this form" }` |
| `422` | validation failure | `{ success:false, message:"Validation failed", errors:[{ field:"rating", message:"Rating must be an integer between 1 and 5" }] }` |

`422` + an `errors[]` array is the **CONFIRMED** validation convention (`validateMiddleware` +
`ApiError`, verified in Phase 2). Do not expect `400` for field validation.

### 2.3 `GET /api/feedback/mine` — my submissions

| | |
|---|---|
| **Method / URL** | `GET /api/feedback/mine` |
| **Purpose** | The signed-in volunteer lists their own submissions (drives "already submitted" UI) |
| **Auth** | **Required** |
| **Role** | `volunteer` |
| **Verification** | **OPEN** — recommend **not** requiring `verified`, so a pending user can see their history. Not yet decided. |
| **Success** | `200 OK` |

Always scoped to `req.user._id`. A volunteer can never read another volunteer's feedback.

Optional query: `?formId=<id>` / `?activityId=<id>` to check a single form before rendering the
form — **PROPOSED**.

**Success `200`**

```jsonc
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "68c1f0a4e2b1c3d4a5f60099",
      "formId": "68c1f0a4e2b1c3d4a5f60011",
      "activityId": "68c1f0a4e2b1c3d4a5f60022",
      "rating": 5,
      "whatWentWell": "...",
      "whatCouldBeImproved": "...",
      "suggestions": "...",
      "createdAt": "2026-08-21T10:15:00.000Z"
    }
  ]
}
```

Empty result is `200` with `count: 0, data: []` — **not** `404`.

**Errors:** `401` unauthenticated · `403` wrong role · `422` invalid query ObjectId.

### 2.3b `GET /api/feedback/{id}/confirmation` — **IMPLEMENTED**

| | |
|---|---|
| **Auth** | Required |
| **Role** | `volunteer` |
| **Verification** | not required |
| **Success** | `200` |

Returns activity title/domain/date, form title, rating and `submittedAt` for one submission.

**Ownership-scoped:** a submission belonging to another volunteer returns **`404`, not `403`**, so
submission ids cannot be enumerated. `respondentId` is never returned.

Errors: `401` unauthenticated · `403` wrong role · `404` not found or not yours · `422` invalid id.

Concept ported from `origin/main`'s public `GET /:id/confirmation`, secured here.

### 2.4 Field classification — evidence, not assumption

| Field | Status | Evidence |
|---|---|---|
| endpoint paths, envelope, status codes | **PROPOSED (stable)** | project conventions verified in Phase 2 |
| auth / role / verification gating | **CONFIRMED** | implemented and tested in Phase 2 |
| `formId` → `FeedbackForm._id` | **CONFIRMED** exists | `server/models/FeedbackForm.js` |
| `rating` 1–5 | **PROPOSED** | `client/src/components/ssf/FeedbackDemo.jsx` renders 5 stars and an "Average Rating 4.1 / 5" panel |
| `whatWentWell` | **PROPOSED** | prototype label "What went well?" |
| `whatCouldBeImproved` | **PROPOSED** | prototype label "What could be improved?" |
| `suggestions` | **PROPOSED** | prototype label "Your suggestions" |
| `activityId` type | **OPEN** | see §2.7 |
| dynamic `answers[]` | **OPEN / BLOCKED** | see §2.6 |
| volunteer contact info on submission | **OPEN** | nothing in the repo requires it; `User.email` already exists |

⚠️ **The prototype is labelled "Illustrative product mockup — not real activity data"**, and the
`/volunteer` route it links to does not exist in `client/src/routes/AppRoutes.jsx`. It is the best
available evidence for field names, but it is **not** a signed-off requirement. Treat as PROPOSED.

### 2.5 Submission confirmation

The `201` response is the confirmation. **OPEN:** whether an email/notification is also required.
No mailer exists and no dependency should be added without team agreement.

### 2.6 Dynamic questions — **IMPLEMENTED, with a caveat**

Supported types: `rating` (1–5), `text`, `single_choice`, `multi_choice`, `boolean`.
Answers are keyed by a stable `questionId`; `required` is enforced; choice values must come from the
question's `options[].value`.

⚠️ **`FeedbackForm.questions` is still `[Mixed]` on every branch — Dev 3 has not published a question
schema in the repository.** The server normalises questions defensively (accepting `id`,
`questionId`, or `_id`) and returns `422` if `answers` are supplied for a form whose questions carry
no stable ids. Fixed-field submission works regardless.

The original blocking analysis is kept below for reference:

#### 2.6b Original blocker (historical) 🚧

`FeedbackForm.questions` is `[mongoose.Schema.Types.Mixed]` with only a `length > 0` validator
(`server/models/FeedbackForm.js`). It has:

- **no stable question IDs**
- **no defined question types**
- **no defined options / choices**
- **no defined rating representation** (no scale, no min/max)
- no validation in `feedbackFormController` beyond `questions.length > 0`

**No question schema is invented here.** Until Dev 3 publishes one, the fixed-field contract in §2.2
is the only implementable design. See §6 for the exact list Dev 3 must supply.

The fixed fields and dynamic answers are **not mutually exclusive forever** — an `answers[]` array can
be added later as an additive, optional field without breaking the contract in §2.2. That is why the
outer contract is safe to build against now.

### 2.7 `activityId` type — **RESOLVED**

Both `FeedbackResponse.activityId` and `FeedbackForm.activityId` are now `ObjectId` + `ref: 'Activity'`.
The ObjectId change to `FeedbackForm` was adopted from `origin/main` (`5f6a3fb`); `createdBy` was
deliberately preserved. The submitted `activityId` must match the referenced form's activity or the
request is rejected with `422`. A defensive guard still rejects a form whose `activityId` is not a
valid ObjectId, covering any pre-existing string data.

Original analysis:

`FeedbackForm.activityId` is a `String` with no `ref`. But `Activity` now exists as a real model with
an ObjectId `_id`, and on `origin/amolika` (`903655d`) `activityController.getActivityFeedbackSummary`
runs `$convert: { input: '$_id', to: 'objectId' }` on `activityId` in order to `$lookup` into the
`activities` collection.

**That is direct evidence that `activityId` is already meant to hold an `Activity._id`** — a teammate
is casting around the missing type. Recommendation: make it `ObjectId` + `ref: 'Activity'` in
`FeedbackResponse`, and ask Dev 3 to converge `FeedbackForm.activityId` to match. **Dev 3's call.**

---

## 3. Duplicate submission — **IMPLEMENTED**

**Rule:** a volunteer may submit once per feedback form. A second attempt returns:

```jsonc
{ "success": false, "message": "Feedback already submitted for this form" }   // 409
```

**Implemented key: unique compound index `uniq_respondent_form` on `{ respondentId, feedbackFormId }`.**
Verified: 5 concurrent identical submissions produced exactly one `201` and four `409`.

Why:
- Both components are **real, validated ObjectIds**. `activityId` is currently an unvalidated String,
  so indexing on it would bake a fragile assumption into the database.
- It enforces the rule **at the database level**, not just in application code — two concurrent
  submissions cannot both succeed.
- The existing `errorHandler` already converts Mongo duplicate-key `11000` into a client error, so
  little new code is needed (the message would be tuned to a 409).
- It permits an activity to be surveyed by more than one form, which `FeedbackForm` already allows
  (nothing prevents multiple forms per `activityId`).

**OPEN:** once-per-**form** vs once-per-**activity** is a product decision. If the team wants strict
once-per-activity, the key must be `{ respondentId, activityId }` and §2.7 must resolve first.

**The index must be agreed before any submissions are written** — creating a unique index after
duplicate rows exist fails.

---

## 4. Admin / Verification — **CONFIRMED (Phase 2)**

Implemented as `PATCH /api/admin/users/:id/verification` — see §1.5. Transitions `pending -> verified`
and `pending -> rejected`, admin-only, volunteers only, no arbitrary values.

### 4.1 Behaviour for `pending` / `rejected` volunteers — **RESOLVED in Phase 2**

Option C (split) was adopted and implemented:

- `pending` — may authenticate and read own profile/status; **403** on verified-only volunteer
  features.
- `rejected` — may authenticate and read own status; **403** on verified-only features, with a
  distinct message.
- `verified` — full volunteer access.

**Still OPEN:** if a `pending` volunteer submits feedback and is later `rejected`, does the stored
feedback remain valid? Decides snapshot-on-submission vs live join. Phase 3.

## 7. Admin feedback analysis — **IMPLEMENTED (ported)**

Ported from `origin/main` (`5f6a3fb`, shivatare17032006) and retargeted at `FeedbackResponse`.
All require `verifyJWT` + `authorizeRoles('admin')` (lowercase — main used `'ADMIN'`, which never
matched). None of these expose `respondentId`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/feedback` | list with filters: `activityId`, `corporatePartnerId`, `domain`, `rating`, `theme`, `startDate`, `endDate` |
| GET | `/api/admin/feedback/stats` | `totalSubmissions`, `domainStats`, `activityStats`, `questionStats`, `ratingDistribution` |
| GET | `/api/admin/feedback/themes` | free-text comments grouped by activity domain |
| POST | `/api/admin/feedback/:id/reclassify` | admin edit of `rating` / `suggestions` / `answers` |

Adaptations from main's original: reads `FeedbackResponse` (attributed) rather than the anonymous
`Feedback` model; `answers` is an array of `{ questionId, type, value }`, so numeric aggregation
selects answers whose question `type` is `rating` (main's Map-based loop silently produced **zero**
results against this shape); free-text search and grouping cover `suggestions`, `whatWentWell` and
`whatCouldBeImproved` rather than `suggestions` alone.

> ⚠️ **OPEN:** `reclassify` lets an admin overwrite volunteer-authored `rating`, `suggestions` and
> `answers`. Ported unchanged in capability, but the team should decide whether admins may rewrite a
> volunteer's own words, or whether classification belongs in a separate field.

## 8. Corporate SPOC endpoints — **IMPLEMENTED (adopted from origin/main), AUTHORIZATION OPEN**

Adopted from `origin/main` (`6718d3c`, Dev 5). Served under `/api/spoc`, reading `FeedbackResponse`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/spoc/dashboard` | totals across feedback forms and responses |
| GET | `/api/spoc/activities/:activityId/feedback` | forms + responses for an activity |
| GET | `/api/spoc/activities/:activityId/responses` | raw responses |
| GET | `/api/spoc/activities/:activityId/keywords` | keyword frequency |
| GET | `/api/spoc/activities/:activityId/sentiment` | positive/neutral/negative counts |
| GET | `/api/spoc/activities/:activityId/insights` | combined view |

**Authorization — RESOLVED.** Every `/api/spoc/*` route requires authentication and the `spoc` or
`admin` role, applied at the router level:

```js
router.use(verifyJWT, authorizeRoles('spoc', 'admin'));
```

`requireVerifiedVolunteer` is deliberately **not** used here — volunteer verification is a
volunteer-only workflow and does not apply to SPOC or admin accounts. Admin verification of
volunteers is unchanged.

Errors: `401` unauthenticated / invalid token · `403` role is not `spoc` or `admin`.

**De-identification — RESOLVED.** SPOC reporting never exposes volunteer identity. Every
`FeedbackResponse` query in `spocService` projects with `.select('-respondentId')`, so
`respondentId` is absent from all six SPOC routes.

The canonical relationship is unchanged: `FeedbackResponse.respondentId` remains a required
`ObjectId` ref to `User`, populated from `req.user._id`, and the unique
`(respondentId, feedbackFormId)` index still enforces one submission per volunteer per form. Only
the SPOC-facing projection hides it.

> **OPEN:** if the product contract later requires a SPOC to see volunteer identity, this projection
> is the single place to change.

**Compatibility note:** `spocService.extractText` originally assumed `answers` was `Mixed` and
returned `500` against the typed `FeedbackResponse.answers` array. It was fixed during the merge to
convert to plain objects, guard against cycles, and include the free-text fields.

## 5. Future — Corporate SPOC

Not implemented, no endpoints invented. The `User` model already accommodates it: `role: 'spoc'` is a
valid enum value, so SPOC accounts need no new model or migration.

Access will be **role-scoped** via the same `req.user.role` mechanism. Permissions, scoping rules
(e.g. a SPOC seeing only their own corporate partner's activities), and endpoints are Dev 5's to
define. **Phase 2 decision:** `corporatePartnerId` was **deferred** — not added to `User`.
`Activity.partner` is already an ObjectId ref to `User`, so a corporate partner is modelled as a
User and no second linkage is required by current code. The registration validator still rejects the
field defensively. **OPEN:** revisit if SPOC reporting needs volunteer-to-partner membership.

---

## 6. Exactly what Dev 3 must provide — **BLOCKING Phase 4 dynamic questions**

`FeedbackForm.questions` is `[Mixed]`. To support dynamic questionnaire answers, Dev 3 must publish a
question object contract containing at minimum:

1. **`id`** — a stable identifier that survives form edits (e.g. a generated ObjectId or slug).
   Without this, answers cannot be mapped back to questions and Dev 4 cannot classify them.
2. **`type`** — the enumerated set actually supported (e.g. `rating`, `text`, `single_choice`,
   `multi_choice`).
3. **`text`** — the question label shown to the volunteer.
4. **`options`** — for choice types: value + label, and whether multiple selection is allowed.
5. **`scale`** — for rating types: `min`, `max`, and step. This determines whether the `rating: 1..5`
   assumption in §2.2 is correct.
6. **`required`** — whether an answer is mandatory, so submission validation can enforce it.

Also needed from Dev 3:

7. Whether `FeedbackForm.activityId` will become `ObjectId` + `ref: 'Activity'` (see §2.7).
8. Whether more than one `FeedbackForm` may exist per activity (affects §3's duplicate key).
9. Whether a volunteer may submit to a form whose `status` is `inactive`.
   *(Phase 4 implements this as a `422` rejection; confirm that is the intended status code.)*
10. **"One active form per activity" is NOT enforced — OPEN.** `FeedbackForm` permits any number of
    forms per `activityId`, and adding that constraint means changing Dev 3's schema, which Phase 4
    deliberately did not do. This interacts with the duplicate-submission key: while multiple active
    forms per activity are possible, once-per-**form** is not the same as once-per-**activity**.

Until items 1–5 exist, **the fixed-field contract in §2.2 is the only implementable design**, and it
is what the frontend should build against.
