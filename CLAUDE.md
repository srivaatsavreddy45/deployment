# CLAUDE.md — Team-2 Backend Development Guide

Persistent project guide for Claude Code. **Update this file whenever a durable architectural,
schema, API-contract, ownership, or repository-convention decision is made.** Do not rewrite it
for trivial changes; update it when a meaningful project decision changes.

Last meaningful update: Phase 5 (reconciliation with origin/main's feedback analysis).

---

## 1. Project purpose

Volunteer Feedback Collection & Experience Tracking System — a MERN application where volunteers
submit feedback about activities they participated in, admins define feedback questionnaires and
review insights, and corporate SPOCs consume reporting.

> ⚠️ **The formal written requirements document has not yet been supplied to Claude in-session.**
> Everything below that is not directly observable in the code is marked PROPOSED or OPEN QUESTION.
> Do not treat proposals in this file as confirmed requirements.

## 2. Backend architecture

Express 5 + Mongoose 9, CommonJS (`require` / `module.exports`). Server lives in `server/`.

Boot sequence (`server/server.js`):
`dotenv.config()` → `connectDB()` (not awaited) → `express()` → `cors()` → `express.json()` →
`express.urlencoded()` → `GET /api/health` → route mounts → `notFound` → `errorHandler` → `listen()`.

MongoDB via `server/config/db.js`, `process.env.MONGO_URI`, falling back to
`mongodb://127.0.0.1:27017/admin_panel` (fallback DB name is a template leftover).

### Request pattern — route → controller → service → model

```
routes/xRoutes.js      thin; router.route('/').get().post() chaining
controllers/xController.js   asyncHandler-wrapped; no try/catch; HTTP concerns only
services/xServices.js  data access + business logic
models/X.js            mongoose schema
```

Controllers must be wrapped in `asyncHandler` (`server/middleware/asyncHandler.js`) and signal
errors by `res.status(n); throw new Error('msg');` — never by inline `try/catch` + `res.status(500)`.

## 3. Folder structure

```
server/
  server.js                entry point + route mounting
  config/db.js             mongo connection
  models/User.js           OWNED BY DEV 2 (me)
  models/FeedbackResponse.js  OWNED BY DEV 2 (me) — volunteer submissions
  models/FeedbackForm.js   OWNED BY DEV 3
  models/Activity.js       OWNED BY DEV 3 / activity author
  controllers/userController.js, adminController.js,
              authController.js, feedbackFormController.js, activityController.js
  routes/userRoutes.js, adminRoutes.js, authRoutes.js, activityRoutes.js
  services/userServices.js, authService.js
  middleware/asyncHandler.js, errorHandler.js, authMiddleware.js,
             roleMiddleware.js, requireVerified.js,
             validateMiddleware.js, validateRequest.js
  validators/authValidator.js, activityValidator.js
  utils/ApiError.js
client/                    Vite + React 19 + Tailwind 4 + shadcn
docs/api-contract.md       cross-team API contract (living document)
CLAUDE.md                  this file
```

## 4. Coding conventions

- CommonJS only. 2-space indent, single quotes, semicolons.
- Arrow-function handlers; named exports collected in one `module.exports` object at file end.
- Filenames: `models/PascalCase.js` (new), `controllers/xController.js`, `routes/xRoutes.js`,
  `services/xServices.js` (note: services are pluralised — existing precedent).
- Never pass raw `req.body` into a model write on a route a non-admin can reach; allow-list fields.

## 5. Response envelope

```
success  200/201  { success: true, data: {...} }
list     200      { success: true, count: n, data: [...] }
delete   200      { success: true, data: {} }
error    4xx/5xx  { success: false, message: "...", stack?: "..." }
```

`stack` is suppressed only when `NODE_ENV === 'production'` — nothing currently sets it.

## 6. Error handling

`server/middleware/errorHandler.js` is mounted last and maps:

| Condition | Status |
|---|---|
| `CastError` on ObjectId | 404 "Resource not found" |
| Mongoose `ValidationError` | 400, messages joined into one string |
| Mongo duplicate key (`11000`) | 400 "Duplicate field value: <field>" |
| `ApiError.statusCode` (>= 400) | that status — **added in Phase 2**, previously every `ApiError` became 500 |
| otherwise | `res.statusCode` if already set, else 500 |

`notFound` handles unmatched routes. Responses may also carry `errors[]` (field-level detail from
express-validator). Treat this file as shared territory — Phase 2 changed it by agreement.

**Do not add a second error architecture.** `ApiError` + the central `errorHandler` is the one path.

## 7. Ownership boundaries (5 backend developers)

| Dev | Owns |
|---|---|
| 1 | Authentication only — login/register, JWT, password hashing, `protect` middleware, populating `req.user`. Also de-facto owner of `errorHandler.js` and `config/db.js`. |
| **2 (me)** | **`server/models/User.js`**, the volunteer/user domain, and the volunteer-facing feedback submission flow (submission, ratings, comments, suggestions, duplicate prevention, confirmation, volunteer-side retrieval). |
| 3 | `server/models/feedbackmodel.js` (`FeedbackForm`), `server/controllers/feedbackadmin.js`, all Activity-side code, admin activity management. |
| 4 | Admin feedback insights / classification / theme analysis — reads what Dev 2 writes. |
| 5 | Corporate SPOC reporting. |

### Files I must NOT modify
- `server/models/feedbackmodel.js` (Dev 3)
- `server/controllers/feedbackadmin.js` (Dev 3)
- Anything Activity-related (Dev 3)
- Auth implementation files when they land (Dev 1)
- `server/middleware/errorHandler.js`, `server/config/db.js` (shared/Dev 1) — coordinate first

### Teammate-owned files changed in Phase 2 (reconciliation only)

| File | Owner | Why it had to change |
|---|---|---|
| `services/authService.js` | Dev 1 | `isVerified` -> `verificationStatus`; lowercase roles; JWT signing moved in from the model; verification no longer blocks login |
| `middleware/authMiddleware.js` | Dev 1 | lean `req.user`; verification gate moved out |
| `validators/authValidator.js` | Dev 1 | block `verificationStatus` at registration; validate the verify body |
| `routes/authRoutes.js` | Dev 1 | `authorizeRoles("ADMIN")` -> `("admin")` |
| `controllers/authController.js` | Dev 1 | pass `verificationStatus` through to the service |
| `routes/adminRoutes.js` | Dev 3 | 6 x `authorizeRoles('ADMIN')` -> `('admin')` |
| `controllers/feedbackFormController.js` | Dev 3 | `req.user.id` -> `req.user._id` (lean `req.user` has no `.id`) |
| `middleware/errorHandler.js` | shared | honour `ApiError.statusCode` |
| `server.js` | shared | mount `cookie-parser` + `/api/auth` |

### Shared conflict hotspot
`server/server.js` — all five devs must add a mount line. Agree on ordering or introduce a
`routes/index.js` aggregator before the branches diverge further.

## 8. User model (Phase 2 — current)

`server/models/User.js`. Single model for all roles. **Owned by Dev 2.**

| Field | Type | Notes |
|---|---|---|
| `name` | String, required, trim | |
| `email` | String, required, **unique**, **lowercase**, trim, regex | login identifier |
| `password` | String, required, min 8, **`select: false`** | bcryptjs hash, `SALT_ROUNDS = 10` |
| `refreshToken` | String, **`select: false`** | rotated on login/refresh; never sent to clients |
| `role` | String, enum `['volunteer','admin','spoc']`, default `'volunteer'` | **lowercase only** |
| `verificationStatus` | String, enum `['pending','verified','rejected']`, default `'pending'` | mentor-mandated |
| `status` | String, enum `['active','inactive','pending']`, default `'active'` | account lifecycle |
| `createdAt` / `updatedAt` | Date | `{ timestamps: true }` |
| `isVerified` | **virtual** | derived: `verificationStatus === 'verified'`. Never stored. |

Statics `User.ROLES` / `User.VERIFICATION_STATUSES`. Instance method `comparePassword()`.
A `pre('save')` hook hashes `password` when modified — **Mongoose 9 async hooks take no `next`
argument**; the hook returns instead. `toJSON`/`toObject` use `virtuals: true` plus a transform that
deletes `password` and `refreshToken`.

**JWT signing is NOT on the model.** Token generation lives in `authService` so crypto stays inside
the authentication ownership boundary.

### Verification states — authoritative

```
pending    default for every newly created user
verified   set by an authorized Admin
rejected   set by an authorized Admin
```

Rules:
- **`verificationStatus` is the single source of truth.** Never introduce a stored `isVerified`
  boolean — two independent sources of truth produce contradictory states.
- A volunteer must **never** set or modify their own `verificationStatus`.
- Only an authorized Admin transitions it, via `PATCH /api/auth/users/:userId/verify`, which accepts
  only `verified` or `rejected` and only targets users with `role: 'volunteer'`.
- Applies to **volunteers**. Admin and SPOC accounts do not use this workflow.

### Verification access policy (Phase 2 decision)

| State | May authenticate | May read own profile | May use verified-only volunteer features |
|---|---|---|---|
| `pending` | yes | yes | **no** — 403 "waiting for Admin verification" |
| `verified` | yes | yes | yes |
| `rejected` | yes | yes | **no** — 403 "rejected by an Admin" |

Enforcement is **per-route**, not in `verifyJWT`: authentication and verification are separate
concerns, so a pending user can still log in and see why they are blocked. The gate is
`server/middleware/requireVerified.js`.

## 8b. Authentication contract (Phase 2)

**`req.user` is a minimal identity, never the full Mongoose document:**

```js
req.user = { _id, role, verificationStatus }
```

`_id` is the canonical identifier (an ObjectId). `verificationStatus` is re-read from the database on
every request by `verifyJWT`, so an admin's decision takes effect immediately instead of when the
token expires. **Do not use `req.user.id`** — it does not exist on the lean object.

**Middleware boundaries:**

| Middleware | File | Responsibility |
|---|---|---|
| `verifyJWT` | `middleware/authMiddleware.js` | authenticates, populates `req.user`, rejects inactive accounts |
| `authorizeRoles(...roles)` | `middleware/roleMiddleware.js` | role check against `req.user.role` |
| `requireVerifiedVolunteer` | `middleware/requireVerified.js` | requires `verificationStatus === 'verified'` |

**Tokens:** JWT access token (15m default) + refresh token (7d default), both delivered as
`httpOnly` cookies; `verifyJWT` also accepts `Authorization: Bearer <token>`. The refresh token is
persisted on the user and rotated, so logout revokes it. Secrets come from `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET`; expiries from `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY`.

**Registration** always creates `role: 'volunteer'`, `verificationStatus: 'pending'`. Client-supplied
`role`, `verificationStatus`, `isVerified`, `status`, `corporatePartnerId` are **rejected with 422**
by `registerValidation`.

**corporatePartnerId — deferred (Phase 2 decision).** Not added to `User`. `Activity.partner` is
already an ObjectId ref to `User`, so the corporate partner is modelled as a User, and no second
linkage is required by any code on main today. The registration validator still rejects the field
defensively. Revisit if Dev 5's SPOC reporting needs volunteer-to-partner membership.

## 8c. Security rules (Phase 2)

- **Allow-lists, not raw `req.body`.** `services/userServices.js` defines `CREATE_ALLOWED_FIELDS`
  (`name`, `email`, `password`) and `UPDATE_ALLOWED_FIELDS` (`name`, `email`). Everything else —
  `role`, `verificationStatus`, `isVerified`, `refreshToken`, `status` — is silently dropped.
  Enforced in the **service layer** so every caller is covered.
- Role changes and verification transitions are admin-only operations in `authService`, never
  reachable through generic user endpoints.
- `password` and `refreshToken` are `select: false` and additionally stripped in `toJSON`.
- Error responses honour `ApiError.statusCode` — see §6.

## 9. Unresolved cross-team contracts

Resolved in Phase 2: `req.user` shape, role casing, verification model, `password`/`refreshToken`
ownership, `corporatePartnerId` (deferred), `ApiError`/`errorHandler` compatibility.

Settled as PROPOSED in Phase 3 (see `docs/api-contract.md` §2): the volunteer feedback endpoints,
their auth/role/verification gating, the response envelope, the fixed feedback fields, and the
duplicate-submission key. **Frontend-ready, not yet team-confirmed.**

Still OPEN:

1. **Dev 3: `questions[]` object structure** — stable IDs, types, text, options, scale, required.
   Full list in `docs/api-contract.md` §6. **Blocks dynamic-question support.**
2. **`activityId` type** — String today, but `origin/amolika` `903655d` `$convert`s it to an ObjectId
   to `$lookup` into `activities`, which is evidence it already means `Activity._id`. Dev 3's call.
3. Once per **form** vs once per **activity** (decides the unique index).
4. Whether feedback is editable after submission.
5. Whether verification state is snapshotted onto a submission or joined live.
6. Whether `GET /api/feedback/mine` requires `verified` (recommendation: no).
7. Whether submitting to an `inactive` form is an error.
8. Volunteer contact information — `User.email` exists; nothing in the repo requires duplicating it.
9. Corporate-partner mapping for SPOC reporting.
10. Whether `/api/users/*` should require authentication (see §10).
11. Whether "submission confirmation" means email/notification or just the `201`.

## 10. Known defects / blockers (do not silently fix teammate-owned code)

Fixed in Phase 2: the `feedbackadmin.js` require-path crash (file replaced by
`feedbackFormController.js`), missing auth dependencies, unmounted auth routes, `ApiError` statuses
collapsing to 500, and mass assignment via `userServices`.

Still outstanding:

- 🔴 **`/api/users` and `/api/users/:id` are completely unauthenticated.** Anyone can list, read,
  create, update and delete users. Phase 2 closed the privilege-escalation hole (allow-lists), but
  the routes themselves still need `verifyJWT` + an ownership/role check. Dev 2 scope, needs a
  decision on who may call them.
- 🔴 **`POST /api/admin/activities` cannot work.** `activityController.createActivity` sets
  `createdBy: req.user?._id`, but `activityRoutes` mounts **no** `verifyJWT`, so `req.user` is
  undefined and the required field fails validation. Activity author's bug, pre-dates Phase 2.
- 🟠 **`adminController.js` is dead code.** `adminRoutes.js` was rewritten to serve only
  feedback-form routes, so admin user CRUD and `getDashboardStats` are no longer mounted. The
  dashboard endpoint the client may expect no longer exists. Dev 3 scope.
- 🟠 **Two competing validation middlewares**: `validateMiddleware.js` (422 + `ApiError`, used by
  auth) and `validateRequest.js` (400 + raw `errors[]`, used by activities). Converge on the former.
- 🟠 `feedbackFormController.js` uses inline `try/catch` + raw 500s instead of `asyncHandler` +
  `ApiError`, so its failures bypass the central error contract. Dev 3 scope.
- 🟠 **`origin/amolika` `903655d` regresses the feedback module**: it reintroduces the deleted
  `server/models/feedbackmodel.js` and `server/controllers/feedbackadmin.js`, and adds a second
  `server/routes/feedbackRoutes.js` mounted at `/api/admin/feedback-forms`, duplicating Dev 3's
  routes in `adminRoutes.js`. If merged, two files would register the same `FeedbackForm` model.
  Note: that file is mounted under `/api/admin/...`, so it does **not** collide with Dev 2's
  `/api/feedback` namespace — but the duplication must be resolved before it reaches main.
- 🟠 **`origin/rujuta-spoc` contains `server/models/FeedbackResponse.js`** — Dev 2's module, authored
  on a branch that predates Phase 1. Its `respondentId` is an optional `String` and it has no unique
  index. Must not reach main in that shape (see §12c.4).
- 🟡 Stray empty `package-lock.json` (85 bytes) at repo root from an accidental root `npm install`.
- 🟡 `connectDB()` is not awaited — the app serves requests before Mongo is ready.
- 🟡 `cors()` is fully open with no origin restriction; cookie auth across origins will need
  `credentials: true` and an explicit origin.
- 🟡 No tests, no test script, no linting, no CI.

## 11. Decisions made in Phase 1

1. `User` is a **single model for all roles**, discriminated by `role`, rather than separate
   Volunteer/Admin/SPOC collections.
2. `role` enum is `['volunteer','admin','spoc']`, default `'volunteer'`.
3. `verificationStatus` enum `['pending','verified','rejected']`, default `'pending'`; `isVerified`
   is a **virtual**, never a stored field.
4. `email` is required, unique, lowercased, regex-validated.
5. Legacy template fields `description` / `category` removed from `User`.
6. Legacy `status` kept (account lifecycle).
7. `toJSON: { virtuals: true }` so `isVerified` is visible to clients.

## 12. Decisions made in Phase 2

1. **Dev 1's auth was reconciled to Phase 1, not the reverse.** Their implementation read and wrote a
   stored `isVerified` boolean — a `$set` on a virtual, which Mongoose strict mode silently drops, so
   admin verification would have been a no-op that locked every user out permanently. Now uses
   `verificationStatus`.
2. **Roles lowercased everywhere.** `role: "USER"` would have failed enum validation, breaking
   registration; `authorizeRoles("ADMIN")` never matched. 7 call sites changed.
3. **`req.user` = `{ _id, role, verificationStatus }`**, not the full document. `_id` is canonical.
4. **JWT signing moved from the User model into `authService`** — clean ownership over blind
   preservation of the original implementation.
5. **Password hashing on the model** (`pre('save')` + `comparePassword`), `bcryptjs`, 10 rounds.
   `bcryptjs` chosen over `bcrypt` to avoid a native build step.
6. **Verification enforced per-route, not in `verifyJWT`** — pending/rejected users can authenticate
   and read their own status but not use verified-only features.
7. **Admin verification accepts only `verified` / `rejected`** and only targets volunteers.
8. **`corporatePartnerId` deferred** — `Activity.partner` already refs `User`.
9. **`errorHandler` honours `ApiError.statusCode`** rather than introducing a second error system.
10. **Allow-lists in the service layer** for user create/update.
11. Dependencies added: `jsonwebtoken`, `bcryptjs`, `cookie-parser`.
12. `server/.env.example` added (tracked, no values); `server/.env` remains gitignored.

## 12b. Decisions still pending

Everything in §9. None may be resolved by guessing; all require team confirmation.

## 12c. Decisions made in Phase 3 (contract only — no backend written)

1. **Contract-first.** The volunteer feedback API contract is published in `docs/api-contract.md` §2
   as **PROPOSED / FRONTEND-READY** so the frontend can start. No model, route, controller, service
   or validator was created.
2. **Fixed-field submission** (`rating`, `whatWentWell`, `whatCouldBeImproved`, `suggestions`) is the
   proposed shape, because `FeedbackForm.questions` is still `[Mixed]` with no stable question IDs
   and therefore cannot be implemented against. Evidence: `client/src/components/ssf/FeedbackDemo.jsx`
   (5-star rating, the three labels, an "Average Rating" panel). That prototype is explicitly labelled
   an illustrative mockup, so the fields are **PROPOSED, not CONFIRMED**.
3. **Additive escape hatch.** A dynamic `answers[]` array can be added later as an optional field
   without breaking the §2.2 contract — which is why the outer contract is safe to build against now.
4. **`respondentId` must be `ObjectId` + `ref: 'User'`, required**, always taken from `req.user._id`.
   A String or optional respondent breaks `.populate()` for Dev 4/5 and makes duplicate prevention
   impossible. This explicitly rejects the shape on `origin/rujuta-spoc`.
5. **Duplicate key: unique compound index `{ respondentId, feedbackFormId }`** — the only key whose
   components are both real validated ObjectIds, and it enforces the rule in the database rather than
   in application code. Must be agreed before any submissions are written.
6. **Endpoints** `POST /api/feedback` and `GET /api/feedback/mine`, gated by
   `verifyJWT` + `authorizeRoles('volunteer')` + `requireVerifiedVolunteer` (submission only).
7. Validation errors use **422 + `errors[]`**, matching the Phase 2 convention.
8. **`docs/openapi.yaml` (OpenAPI 3.0.3) is published** alongside the prose contract so the frontend
   can generate a client. It carries the same CONFIRMED / PROPOSED / OPEN labelling, defines both
   `bearerAuth` and `cookieAuth`, and deliberately leaves `FeedbackForm.questions[]` as an untyped
   array flagged OPEN — no question schema is invented. Keep it in sync with
   `docs/api-contract.md` §2 whenever that contract changes.

## 12d. Decisions made in Phase 4 (volunteer feedback API — implemented)

1. **Implemented** `server/models/FeedbackResponse.js`, `services/feedbackService.js`,
   `controllers/feedbackController.js`, `validators/feedbackValidator.js`,
   `routes/feedbackResponseRoutes.js`, mounted at `/api/feedback`.
2. **Route file is `feedbackResponseRoutes.js`, not `feedbackRoutes.js`** — `origin/amolika`
   (`903655d`) already adds a different `server/routes/feedbackRoutes.js` mounted at
   `/api/admin/feedback-forms`. A distinct filename lets both survive a merge.
3. **`respondentId` always comes from `req.user._id`.** A client-supplied `respondentId` or `_id` is
   rejected with `422`, not silently ignored. It is never echoed back in responses.
4. **`activityId` on responses is `ObjectId` + `ref: 'Activity'`** and must match the referenced
   form's activity. `FeedbackForm.activityId` is still a String (Dev 3's model), so the service
   reconciles them.
5. **Unique compound index `uniq_respondent_form`** on `{ respondentId, feedbackFormId }`, verified
   under concurrency (5 simultaneous submissions -> one 201, four 409).
6. **Question types** `rating` (1-5), `text`, `single_choice`, `multi_choice`, `boolean`, keyed by a
   stable `questionId`, `required` enforced, options as `{ value, label }`. Questions are normalised
   defensively because `FeedbackForm.questions` is still `[Mixed]`.
7. **`POST /api/feedback` requires a verified volunteer; `GET /api/feedback/mine` does not** —
   pending/rejected volunteers can read their own history.
8. **Inactive forms reject submissions with `422`.**
9. Existing `express-validator` + `validateMiddleware` + `ApiError` convention reused; no second
   validation or error system introduced.
10. **NOT implemented, left OPEN:** "one active form per activity". Enforcing it requires changing
    Dev 3's `FeedbackForm` schema, which Phase 4 deliberately avoided. Note that while multiple
    active forms per activity remain possible, once-per-form is not once-per-activity.

## 12e. Decisions made in Phase 5 (reconciliation with origin/main)

Reconciled **without a blind merge**. `origin/main` (`5f6a3fb`) had introduced an *anonymous*
`Feedback` model with an unauthenticated `POST /api/feedback`. The confirmed product requirement is
that feedback is linked to the logged-in volunteer, so:

1. **`FeedbackResponse` remains the single submission model.** Main's `Feedback` model and its
   `routes/feedbackRoutes.js` were **not** imported — no second model, no second `/api/feedback`
   mount, no anonymous submission path.
2. **`feedbackController.js` remains the Phase 4 submission controller.** Main-derived analysis lives
   in `controllers/feedbackAnalysisController.js`, so the filename conflict is resolved by
   restructuring rather than overwriting.
3. **Ported and retargeted:** main's feedback analysis (list/stats/themes/reclassify) now reads
   `FeedbackResponse`. Main's Map-based answer aggregation silently yielded zero results against the
   array-shaped `answers`; it was rewritten to select `type === 'rating'`.
4. **Adopted:** `FeedbackForm.activityId` -> `ObjectId` + `ref: 'Activity'` — **`createdBy` retained**
   (main dropped it, which would have silently discarded form authorship).
5. **Secured and ported:** `GET /api/feedback/:id/confirmation` is authenticated, volunteer-only, and
   ownership-scoped, returning `404` (not `403`) for someone else's submission so ids are not
   enumerable. Main's version was public.
6. **Rejected:** main's `authorizeRoles('ADMIN')` uppercase (never matches), and its `Feedback`
   model/routes.
7. Main's two boot failures (missing `jsonwebtoken`/`bcryptjs`/`cookie-parser`; `adminRoutes`
   importing `archiveFeedbackForm` while the controller exports `deleteFeedbackForm`) **do not exist
   on this branch** — keeping the Phase 2 baseline avoided both. No fix was needed.

## 12g. Decisions made in the origin/main reconciliation merge

Merged `origin/main` (`6718d3c`, which had merged PR #6 `rujuta-spoc`) into this branch, resolving
7 conflicts. Product decision confirmed: **every feedback submission is linked to the authenticated
volunteer**, so `FeedbackResponse` is canonical.

1. **Kept mine:** `models/FeedbackResponse.js` (required `respondentId` ObjectId ref User,
   `activityId` ObjectId ref Activity, validated answers, fixed fields, unique
   `(respondentId, feedbackFormId)` index), `feedbackController.js`, `feedbackService.js`,
   `feedbackAnalysisController.js`, `feedbackFormController.js`, `FeedbackForm.js`
   (ObjectId `activityId` **and** `createdBy`), and the whole Phase 2 auth stack.
2. **Removed from main:** `models/Feedback.js` (competing anonymous submission model) and
   `routes/feedbackRoutes.js` (anonymous, unauthenticated `POST /api/feedback`). Exactly one
   submission model and one `/api/feedback` mount remain.
3. **Adopted from main:** Dev 5's `spocService.js`, `spocController.js`, `spocRoutes.js`, plus all
   client work.
4. **`adminRoutes.js` merge trap:** git auto-merged the import block outside the conflict markers,
   swapping `archiveFeedbackForm` for main's `deleteFeedbackForm` while the delete route still called
   the former. Taking either side wholesale would have reproduced main's boot crash. The file was
   rewritten to import this branch's real export names.
5. **`spocService.extractText` compatibility fix (approved).** Dev 5's implementation assumed
   `answers` was `Mixed` and recursed through `Object.values()`. Against the typed Mongoose
   DocumentArray it followed `$parent` back-references and died with
   `RangeError: Maximum call stack size exceeded` — `/spoc/.../keywords`, `/sentiment` and
   `/insights` all returned 500. Fixed by converting to plain objects via `toObject()`, adding a
   `WeakSet` cycle guard, and including the free-text fields (`whatWentWell`,
   `whatCouldBeImproved`, `suggestions`) where the real comments live on this schema.
6. **`authRoutes` mounted.** On `origin/main` it was neither required nor mounted, so
   `POST /api/auth/register` returned 404 and the whole API was effectively public.

### `/api/spoc/*` security — RESOLVED in this merge

`origin/main` shipped `/api/spoc/*` with **no guard at all** (`GET /api/spoc/dashboard` returned
`200` with no token) and with `respondentId` in two payloads, so volunteer identity was publicly
readable. Both were fixed before concluding the merge.

**Authorization:** `router.use(verifyJWT, authorizeRoles('spoc', 'admin'))` at the router level in
`server/routes/spocRoutes.js`. `requireVerifiedVolunteer` is deliberately **not** applied — volunteer
verification is a volunteer-only workflow and does not apply to SPOC or admin accounts. Admin
verification of volunteers is unchanged.

**De-identification:** every `FeedbackResponse` query in `spocService.js` projects with
`.select('-respondentId')` via the `DEIDENTIFIED` constant. Verified: `respondentId` is absent from
all six SPOC routes.

**The canonical relationship is untouched** — `FeedbackResponse.respondentId` is still a required
`ObjectId` ref to `User` populated from `req.user._id`, and the unique
`(respondentId, feedbackFormId)` index still enforces one submission per volunteer per form. Only
the SPOC projection hides it. If the product contract ever requires SPOC to see volunteer identity,
`DEIDENTIFIED` is the single place to change.

## 12h. Auth reconciliation with origin/main PR #7 (f493577)

Deliberate reconciliation, not a blind merge. 13 auth-layer conflicts resolved individually.

1. **`req.user` stays `{ _id, role, verificationStatus }`.** PR #7's middleware set `{ id, ... }`.
   Six call sites depend on `_id` (feedback controller x3, feedbackFormController, authController x2),
   and `activityController` uses `req.user?._id`. Verified empirically that the mismatch would fail
   loudly rather than leak: `find({respondentId: undefined})` returns **0** rows and
   `create({respondentId: undefined})` is rejected by validation — a functional break, not a data
   exposure. Adapted at the auth boundary; the published contract is unchanged.
2. **Canonical verification endpoint moved to `PATCH /api/admin/users/:id/verification`**
   (from `PATCH /api/auth/users/:userId/verify`). Deliberate contract change — see
   `docs/api-contract.md` §1.5. Exactly one implementation exists; the auth router now handles
   session concerns only.
3. **`bcryptjs` kept over PR #7's `bcrypt`.** Pure JS, no native toolchain, already proven by the
   existing suite. Hash format (`$2b$`) is interchangeable, so no migration is needed.
4. **Both `toJSON` and `toObject` keep the sanitising transform.** PR #7's `User.js` stripped
   `password`/`refreshToken` in `toJSON` only, leaking them through any `.toObject()` path.
5. **`description` / `category` NOT reintroduced.** PR #7 restored these Phase 1 template fields and
   allow-listed them for update; no contract requires them.
6. **Mass-assignment allow-lists kept** (create *and* update). PR #7's `createUser` still accepted
   raw `req.body`.
7. **Adopted from PR #7:** the email-verification stack (`config/mailer.js`, `utils/sendEmail.js`,
   `services/emailService.js`, `templates/emailTemplates.js`), `scripts/seedAdmin.js` +
   `npm run seed:admin`, `validators/userValidator.js`, the fuller `.env.example`, `nodemailer`,
   `dotenv.config()` before local requires, `cors({ origin, credentials: true })`, and the structural
   `router.use(verifyJWT, authorizeRoles('admin'))` guard on the admin router.
8. **Email is best-effort.** Both send sites are wrapped in try/catch with `console.error`, so
   registration and admin verification still succeed when SMTP is unconfigured.
9. **Feedback/SPOC architecture untouched** — the merge produced no conflicts there. No
   `models/Feedback.js`, no `routes/feedbackRoutes.js`, one `/api/feedback` mount, SPOC still
   `verifyJWT + authorizeRoles('spoc','admin')` and de-identified.
10. A duplicate `authRoutes` require that git's auto-merge introduced into `server.js` was removed.

## 12i. Decisions made in Phase 6a (user profile + admin provisioning)

1. **Fixed silent SPOC provisioning failure.** `adminController` already passed an admin allow-list
   as a third argument to `userServices.updateUserById`, but the Phase 2 rewrite of that service
   dropped the parameter, so `POST/PUT /api/admin/users {role:'spoc'}` returned `success: true`
   while persisting `volunteer`. `userServices` now takes an explicit `allowedFields` policy:
   `CREATE_ALLOWED_FIELDS` / `UPDATE_ALLOWED_FIELDS` (self: name, email, password) and
   `ADMIN_CREATE_ALLOWED_FIELDS` / `ADMIN_UPDATE_ALLOWED_FIELDS` (+ role, status). Restrictive by
   default.
2. **No more silent drops of privileged fields.** A privileged field supplied without permission now
   throws `ApiError(422)` from the service layer, in addition to the validator's rejection —
   defence in depth, verified by calling the service directly.
3. **`/api/users/*` is authenticated and ownership-scoped.** `verifyJWT` at the router level;
   `requireSelfOrAdmin` on read, `requireSelf` on write. A non-matching id returns **404** so ids
   are not enumerable.
4. **Removed `GET /api/users`, `POST /api/users`, `DELETE /api/users/:id`.** The list was an
   unauthenticated user directory duplicating `GET /api/admin/users`; deletion is administrative and
   already exists at `DELETE /api/admin/users/:id`. `userController` now holds only the two
   self-service handlers.
5. **Verification state for provisioned privileged roles (approved).** An admin-created or
   admin-promoted `spoc`/`admin` is created `verificationStatus: 'verified'`; `volunteer` stays
   `'pending'`. Derived server-side in `userServices.applyPrivilegedRoleVerification` — clients can
   still never supply `verificationStatus` on any path (422).

   Evidence for the rule: `scripts/seedAdmin.js` already overrides the `pending` default to
   `'verified'` for the admin it seeds; verification is documented as volunteer-only (§8);
   and `authService.updateVerificationByAdmin` filters `{ role: 'volunteer' }`, so a non-volunteer
   left `pending` could **never** be verified through the API — verified live, it returns
   `404 "Volunteer not found"`. Leaving privileged accounts pending was therefore a permanent,
   unfixable state and a latent lockout if the (currently unused) role-agnostic
   `verificationMiddleware.js` were ever applied to a SPOC or admin route.

   **Demotion (approved separately):** `admin`/`spoc` -> `volunteer` resets `verificationStatus`
   to `'pending'`. A demoted account must pass the volunteer verification workflow rather than carry
   over the verified state it held while privileged. Only an *actual* transition changes verification
   state — re-writing a user's existing role (`volunteer` -> `volunteer`) is not a demotion and must
   not silently un-verify someone who already passed verification, so the service compares the stored
   role before deciding. A name-only edit never touches verification.

6. **Ownership is checked before body validation** on `PUT /api/users/:id`, so a non-owner receives a
   uniform `404` regardless of the body. Previously a malformed body answered `422` and a well-formed
   one `404` — the same information either way, but an inconsistent surface.

7. **Unchanged, deliberately:** `User.ROLES`, `scripts/seedAdmin.js`, the public-registration role
   rejection, volunteer verification semantics, `FeedbackResponse`, feedback routes, SPOC
   authorization and de-identification, and the `req.user._id` contract. No `company` field was
   added to `User`.

**Open, needs the team:** the client sends `role` and `company` on registration and uses
`corporate` where the backend enum says `spoc`. Registration therefore fails with 422 from the
current UI. Backend security was deliberately not weakened to accommodate it; the fix is a frontend
change plus a naming decision.

## 12f. What a later phase could cover

Authentication on `/api/users/*` (still open), SPOC reporting (`origin/rujuta-spoc` already codes
against `FeedbackResponse`), and the `reclassify` mutation decision.

## 13. Repository rules

- Do not commit, reset, checkout, or change branches unless explicitly instructed.
- Do not install dependencies without discussion; keep the dependency set minimal.
- Do not refactor unrelated code or "fix" teammate defects — report them instead.
- Work proceeds in explicit phases: inspection → requirements/architecture → API contract →
  implementation. Do not jump ahead a phase.
