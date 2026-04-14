# CA2 Phase 2 — Standout Improvement Plan

## Current State Summary (What CA1 Delivers)

| Area | Status |
|---|---|
| Resource CRUD (Create, Read, Update, Delete) | Done |
| MongoDB + Mongoose with schema validation | Done |
| Search (title, description, tags) + Category/Difficulty filters | Done |
| File upload (PDF, DOC, DOCX, EPUB, TXT) with Multer | Done |
| Dark/Light theme toggle with OS detection | Done |
| Centralized error handler + logger middleware | Done |
| XSS-safe rendering on frontend | Done |
| User model + Auth routes + JWT middleware | Scaffolded (not integrated) |

---

## Phase 2 Improvement Tiers

Features are organized into three tiers based on impact and impressiveness:

- **Tier 1 — Must-Have (Core CA2)**: Complete the security/auth story. Without these, CA2 is incomplete.
- **Tier 2 — High-Impact Standout**: Features that elevate this from a student project to a portfolio-grade app.
- **Tier 3 — Wow Factor**: Cherry-on-top features that show advanced engineering maturity.

---

## TIER 1 — Must-Have (Core CA2 Requirements)

### 1.1 Complete Auth Integration & Protected Routes
**Why**: Auth routes and middleware exist but aren't wired into the app flow.

- [ ] Wire `protect` middleware on POST, PUT, DELETE resource routes
- [ ] Wire `admin` middleware on DELETE resource route
- [ ] Create `register.html` page with registration form
- [ ] Update `login.html` with working login form and JS
- [ ] Store JWT in `localStorage` on login/register
- [ ] Attach `Authorization: Bearer <token>` header on all protected API calls
- [ ] Add Logout button (clears token, redirects to login)
- [ ] Redirect unauthenticated users to login page when accessing protected actions
- [ ] Show username in navbar when logged in

**Files to modify**: `resourceRoutes.js`, `login.html`, `public/js/login.js` (create), `public/js/add.js`, `public/js/edit.js`, `public/js/details.js`, `public/js/index.js`, all HTML nav sections

### 1.2 Resource Ownership (ownerId)
**Why**: Critical for multi-user — prevents User A from editing/deleting User B's resources.

- [ ] Add `owner` field to Resource schema (`type: mongoose.Schema.Types.ObjectId, ref: 'User'`)
- [ ] Auto-set `owner` from `req.user.id` on resource creation
- [ ] On UPDATE: verify `req.user.id === resource.owner` OR `req.user.role === 'admin'`
- [ ] On DELETE: verify `req.user.id === resource.owner` OR `req.user.role === 'admin'`
- [ ] Return `403 Forbidden` with message on unauthorized write attempts
- [ ] Populate owner username in resource list/details responses

**Files to modify**: `models/Resource.js`, `controllers/resourceController.js`

### 1.3 Frontend Access Control (Conditional UI)
**Why**: Buttons should reflect what the user is actually allowed to do.

- [x] Show Edit/Delete buttons ONLY if user owns the resource (or is admin)
- [x] Show "Add Resource" button only for authenticated users
- [x] Show Login/Register links when logged out
- [x] Show username + Logout when logged in
- [x] Decode JWT on frontend to extract user ID and role (without verification — backend still verifies)

**Files to modify**: `public/js/index.js`, `public/js/details.js`, all HTML navbars

### 1.4 Security Hardening
**Why**: Shows security awareness — evaluators notice this.

- [x] Add `helmet` package — sets secure HTTP headers (CSP, X-Frame-Options, etc.)
- [x] Add `cors` package — configure allowed origins
- [x] Add `express-rate-limit` — rate limit auth endpoints (e.g., 10 login attempts per 15 min)
- [x] Add `mongoSanitize` (express-mongo-sanitize) — prevent NoSQL injection in query params
- [x] Sanitize file names more aggressively on upload
- [x] Add `.env` validation on startup (crash early if JWT_SECRET missing)

**New dependencies**: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`
**Files to modify**: `server.js`

---

## TIER 2 — High-Impact Standout Features

### 2.1 Dashboard Analytics Page
**Why**: Visual analytics instantly impress — shows data-driven thinking.

- [x] Create `dashboard.html` with charts/stats
- [x] Backend endpoint: `GET /api/resources/stats` — uses MongoDB aggregation pipeline
- [x] Stats to show:
  - Total resources count
  - Resources by category (bar chart or donut)
  - Resources by difficulty (pie chart)
  - Average rating across all resources
  - Resources created over time (line chart — last 30 days)
  - Top 5 most-used tags (word cloud or horizontal bar)
  - File vs Link vs Both source distribution
- [x] Use **Chart.js** (CDN) for visualizations — lightweight, no build step
- [x] Make dashboard responsive with card grid layout

**New files**: `public/dashboard.html`, `public/js/dashboard.js`
**Backend**: New aggregation endpoint in `resourceController.js`

### 2.2 Pagination & Sorting
**Why**: Essential for production apps. Shows you understand scalability.

- [x] Backend: Accept `page`, `limit`, `sortBy`, `sortOrder` query params
- [x] Return paginated response: `{ data: [], currentPage, totalPages, totalResources }`
- [x] Default: 10 resources per page, sorted by newest
- [x] Frontend: Page navigation controls (Previous / 1 2 3 ... / Next)
- [x] Sortable table columns (click column header to sort by title, rating, date, etc.)
- [x] Preserve filters + pagination in URL params

**Files to modify**: `controllers/resourceController.js`, `public/js/index.js`, `public/index.html`

### 2.3 Bookmark / Favorites System
**Why**: Personalization feature — shows user-centric design thinking.

- [x] Add `bookmarks` array field to User model: `[{ type: ObjectId, ref: 'Resource' }]`
- [x] API endpoints:
  - `POST /api/resources/:id/bookmark` — toggle bookmark
  - `GET /api/resources/bookmarks` — get user's bookmarked resources
- [x] Frontend: Bookmark icon (★ filled / ☆ empty) on each resource card/row
- [x] "My Bookmarks" page or filter toggle on main list
- [ ] Bookmark count displayed per resource

**New files**: `public/bookmarks.html` (optional), bookmark routes
**Files to modify**: `models/User.js`, `resourceController.js`, frontend JS files

### 2.4 Toast Notification System (Replace Alerts)
**Why**: Alert boxes are jarring. Toasts show UI/UX polish.

- [x] Create a toast notification component (pure CSS + JS, no library)
- [x] Types: Success (green), Error (red), Warning (yellow), Info (blue)
- [x] Auto-dismiss after 4 seconds with smooth slide-out animation
- [x] Stack multiple toasts vertically
- [x] Replace ALL `alert()` calls with toast notifications
- [x] Show toasts for: CRUD success, validation errors, auth errors, network failures

**New files**: Toast CSS in `style.css`, toast utility in `public/js/toast.js`
**Files to modify**: All frontend JS files

### 2.5 Soft Delete & Trash/Restore
**Why**: Professional apps never hard-delete. Shows production thinking.

- [ ] Add `isDeleted` (Boolean, default false) and `deletedAt` (Date) fields to Resource schema
- [ ] "Delete" sets `isDeleted: true` + `deletedAt: new Date()` instead of removing
- [ ] All GET queries filter `isDeleted: false` by default
- [ ] New endpoints:
  - `GET /api/resources/trash` — list deleted resources (owner/admin only)
  - `PATCH /api/resources/:id/restore` — restore from trash (owner/admin only)
  - `DELETE /api/resources/:id/permanent` — permanently delete (admin only)
- [ ] Auto-purge: resources in trash > 30 days are permanently deleted (optional cron)
- [ ] Frontend: "Trash" page accessible from navbar for viewing and restoring

**Files to modify**: `models/Resource.js`, `controllers/resourceController.js`, `routes/resourceRoutes.js`
**New files**: `public/trash.html`, `public/js/trash.js`

---

## TIER 3 — Wow Factor Features

### 3.1 Automated Testing Suite (Jest + Supertest)
**Why**: Testing is the #1 thing that separates student code from professional code.

- [ ] Install `jest` and `supertest` as dev dependencies
- [ ] Create test structure: `tests/auth.test.js`, `tests/resources.test.js`, `tests/ownership.test.js`
- [ ] Test cases to write:
  - Auth: Register success, duplicate email rejected, login success, wrong password rejected
  - Resources: CRUD operations with valid auth token
  - Ownership: User A cannot edit/delete User B's resource (403)
  - Admin: Admin can delete any resource
  - Validation: Invalid data returns 400 with correct error messages
  - Edge cases: Invalid ObjectId, non-existent resource
- [ ] Use separate test database (in-memory mongodb with `mongodb-memory-server` or separate Atlas DB)
- [ ] Add `npm test` script to `package.json`
- [ ] Generate coverage report with `--coverage` flag

**New files**: `tests/` directory with test files, `jest.config.js`
**Files to modify**: `package.json` (add test script)

### 3.2 Activity / Audit Log
**Why**: Tracks who did what — enterprise-grade feature.

- [ ] Create `AuditLog` model: `{ action, resourceId, resourceTitle, userId, username, timestamp, details }`
- [ ] Log actions: CREATE, UPDATE, DELETE, RESTORE, LOGIN
- [ ] Middleware or controller-level logging after each mutation
- [ ] Admin endpoint: `GET /api/audit-log` — filterable by action, user, date range
- [ ] Admin-only "Activity Log" page showing recent actions in timeline format

**New files**: `models/AuditLog.js`, `public/audit.html`, `public/js/audit.js`

### 3.3 Resource Export (CSV & JSON)
**Why**: Data portability — practical and impressive.

- [ ] `GET /api/resources/export?format=csv` — returns CSV download
- [ ] `GET /api/resources/export?format=json` — returns formatted JSON download
- [ ] Respects current filters (category, difficulty, search) in export
- [ ] Frontend: "Export" button on resource list page with format dropdown
- [ ] Include metadata: exported by, date, filter criteria

**Files to modify**: `controllers/resourceController.js`, `routes/resourceRoutes.js`, frontend

### 3.4 User Profile & Settings Page
**Why**: Completes the user experience.

- [ ] `GET /api/auth/profile` — return user info (username, email, role, resource count, join date)
- [ ] `PUT /api/auth/profile` — update username
- [ ] `PUT /api/auth/change-password` — change password (requires current password)
- [ ] Frontend: Profile page showing user stats (resources created, bookmarks, join date)
- [ ] Avatar with initials (CSS-generated, no upload needed)

**New files**: `public/profile.html`, `public/js/profile.js`
**Files to modify**: `controllers/authController.js`, `routes/authRoutes.js`

### 3.5 Loading Skeletons & UX Polish
**Why**: Small details that show you care about user experience.

- [ ] Add skeleton loading placeholders (pulsing gray blocks) for table rows while data loads
- [ ] Add loading spinner for form submissions
- [ ] Add empty state illustrations (no resources found, no bookmarks, etc.)
- [ ] Add confirmation modals instead of `window.confirm()` for delete actions
- [ ] Add keyboard shortcuts (Ctrl+K for search focus, Escape to close modals)
- [ ] Add breadcrumb navigation on details/edit pages

**Files to modify**: `style.css`, all frontend JS files

---

## Implementation Order (Recommended Sequence)

```
Week 1: Foundation Security
├── 1.1 Complete Auth Integration (login/register flow)
├── 1.2 Resource Ownership (ownerId enforcement)
├── 1.3 Frontend Access Control (conditional buttons)
└── 1.4 Security Hardening (helmet, cors, rate limit)

Week 2: High-Impact Features
├── 2.4 Toast Notification System (improves all subsequent work)
├── 2.2 Pagination & Sorting
├── 2.1 Dashboard Analytics Page
└── 2.5 Soft Delete & Trash

Week 3: Wow Factor
├── 2.3 Bookmark / Favorites System
├── 3.3 Resource Export (CSV/JSON)
├── 3.4 User Profile Page
└── 3.5 Loading Skeletons & UX Polish

Week 4: Testing & Documentation
├── 3.1 Automated Testing Suite
├── 3.2 Activity / Audit Log
├── Update README with full CA2 documentation
└── Prepare demo script & viva talking points
```

---

## New Dependencies Summary

| Package | Purpose | Tier |
|---|---|---|
| `helmet` | Secure HTTP headers | Tier 1 |
| `cors` | Cross-Origin Resource Sharing | Tier 1 |
| `express-rate-limit` | Rate limiting for auth routes | Tier 1 |
| `express-mongo-sanitize` | NoSQL injection prevention | Tier 1 |
| `jest` | Testing framework | Tier 3 |
| `supertest` | HTTP testing for Express | Tier 3 |
| `mongodb-memory-server` | In-memory MongoDB for tests | Tier 3 |
| **Chart.js** (CDN) | Dashboard charts | Tier 2 |

---

## Updated Project Structure After CA2

```
DRM/
├── controllers/
│   ├── authController.js          (updated: profile, change password)
│   └── resourceController.js      (updated: ownership, pagination, stats, export, soft delete)
├── middlewares/
│   ├── authMiddleware.js           (existing: protect, admin)
│   ├── errorHandler.js             (existing)
│   ├── logger.js                   (existing)
│   ├── uploadResourceFile.js       (existing)
│   └── validateResource.js         (existing)
├── models/
│   ├── AuditLog.js                 ★ NEW
│   ├── Resource.js                 (updated: owner, isDeleted, deletedAt)
│   └── User.js                     (updated: bookmarks array)
├── public/
│   ├── add.html                    (updated: auth-aware nav)
│   ├── dashboard.html              ★ NEW
│   ├── details.html                (updated: conditional buttons, bookmarks)
│   ├── edit.html                   (updated: auth-aware)
│   ├── index.html                  (updated: pagination, export, auth nav)
│   ├── login.html                  (updated: working form)
│   ├── profile.html                ★ NEW
│   ├── register.html               ★ NEW
│   ├── trash.html                  ★ NEW
│   ├── css/
│   │   └── style.css               (updated: toasts, skeletons, new pages)
│   └── js/
│       ├── add.js                  (updated: auth headers, toasts)
│       ├── auth.js                 ★ NEW (shared auth utilities)
│       ├── dashboard.js            ★ NEW
│       ├── details.js              (updated: ownership checks, bookmarks)
│       ├── edit.js                 (updated: auth headers)
│       ├── index.js                (updated: pagination, export, ownership)
│       ├── login.js                ★ NEW
│       ├── profile.js              ★ NEW
│       ├── register.js             ★ NEW
│       ├── theme.js                (existing)
│       ├── toast.js                ★ NEW
│       └── trash.js                ★ NEW
├── routes/
│   ├── authRoutes.js               (updated: profile, password routes)
│   └── resourceRoutes.js           (updated: stats, export, bookmark, trash, restore)
├── tests/                          ★ NEW
│   ├── auth.test.js
│   ├── resources.test.js
│   └── ownership.test.js
├── uploads/
├── server.js                       (updated: helmet, cors, rate limit, mongo-sanitize)
├── jest.config.js                  ★ NEW
├── package.json                    (updated: test script, new deps)
└── README.md                       (updated: full CA2 documentation)
```

---

## Viva Standout Talking Points (CA2)

1. **Ownership enforcement**: "I implemented resource-level access control. The backend returns 403 if a non-owner non-admin tries to modify a resource, AND the frontend hides buttons preemptively. Security is enforced at both layers."

2. **MongoDB Aggregation**: "The dashboard uses `$group`, `$match`, and `$project` stages in an aggregation pipeline to compute stats server-side instead of fetching all data to the client."

3. **Soft Delete Pattern**: "Resources aren't permanently deleted — they're marked as deleted with a timestamp. This is a production pattern used by Slack, Gmail, and GitHub."

4. **Testing Strategy**: "I wrote integration tests using Jest and Supertest that test the full HTTP request/response cycle, including auth flows and ownership permissions."

5. **Security Layers**: "I applied defense-in-depth: Helmet for headers, CORS for origin control, rate limiting for brute-force prevention, mongo-sanitize for injection attacks, and bcrypt for passwords."

6. **Toast Notifications**: "I replaced all browser alert() calls with a custom toast system that supports multiple concurrent notifications with auto-dismiss — no external library, just vanilla JS."

---

## Success Metrics (What "Best Project" Looks Like)

| Criteria | Target |
|---|---|
| All Tier 1 features working | 100% |
| At least 3 Tier 2 features working | 3-4 of 5 |
| At least 2 Tier 3 features working | 2-3 of 5 |
| Zero `alert()` calls remaining | 0 |
| Automated test pass rate | >90% |
| Mobile responsive on all pages | Yes |
| Demo runs without errors | Yes |
| Can explain every feature in viva | Yes |

---

## Let's Build This. Start with Tier 1.1 (Auth Integration) when ready.
