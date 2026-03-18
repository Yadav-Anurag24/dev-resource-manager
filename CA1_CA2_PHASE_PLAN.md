# Developer Resource Manager (DRM) - Two-Phase Delivery Plan for CA1 and CA2

This plan splits your project into two strong academic submissions:
- CA1 (Phase 1): Solid engineering fundamentals and clean CRUD product.
- CA2 (Phase 2): Security, ownership, and production-ready improvements.

The split is designed so CA1 is complete and demoable on its own, while CA2 clearly shows advanced progression instead of repeating the same work.

## 1) Current Baseline (What you already have)

Current project already includes:
- REST API for create/read/update/delete resources.
- MongoDB + Mongoose model and validation.
- Search and filtering.
- Static frontend pages for list/add/edit/details.
- Middleware for logging, validation, and centralized error handling.

Gap to address in CA2:
- No user identity or ownership checks yet (anyone can edit/delete any resource).

## 2) Phase 1 (CA1) Scope - Foundation Build

## Goal
Deliver a clean, complete Resource Manager with strong backend fundamentals and a polished CRUD flow.

## Features to include
1. Resource CRUD
- Create resource
- List resources
- View single resource
- Edit resource
- Delete resource

2. Data validation and quality
- Required fields, enums, rating bounds, title/description lengths
- Friendly validation messages

3. Search and filter
- Search by title
- Filter by category and difficulty

4. Error handling and middleware
- Logger middleware
- Centralized JSON error responses
- 404 handling for unknown API endpoints

5. Frontend usability
- Working forms and navigation across list/add/edit/details
- Basic XSS-safe rendering and input handling

## CA1 Deliverables
- Running app with MongoDB connection.
- Postman collection with all API endpoints.
- Architecture explanation (MVC-style layering used in this codebase).
- Short demo video or live walkthrough.
- Basic test evidence (manual test checklist at minimum).

## CA1 Viva talking points
- Why Mongoose schema validation matters.
- How middleware chain works in Express.
- Difference between 400, 404, and 500 responses.
- Why indexes were added for search/filter performance.

## CA1 Definition of Done
- All CRUD routes work from UI and API.
- Invalid data is blocked with readable errors.
- Filtering and search work consistently.
- No server crashes on malformed requests.

## 3) Phase 2 (CA2) Scope - Security + Advanced Features

## Goal
Upgrade CA1 into a multi-user, secure, and resume-worthy application.

## Must-have CA2 features
1. Authentication and authorization
- User registration and login (JWT).
- Protect create/update/delete endpoints.
- Role model: user and admin.

2. Ownership enforcement (critical)
- Add ownerId to each resource.
- Only owner (or admin) can edit/delete.
- Return 403 on unauthorized write attempts.

3. Frontend access control
- Show Edit/Delete buttons only for owner/admin.
- Show login/register/logout states.

4. Security hardening
- Password hashing (bcrypt).
- JWT verification middleware.
- Rate limiting for auth endpoints.
- CORS and Helmet configuration.

## High-value CA2 enhancements (pick 2-4 based on time)
- Soft delete + restore option.
- Pagination and sorting.
- Bookmark/favorite resources per user.
- Resource comments or notes.
- Audit log for update/delete actions.
- Basic automated tests (Jest + Supertest) for auth and permissions.
- Docker setup for one-command run.

## CA2 Deliverables
- Updated ER/data model with User and Resource ownership.
- Auth flow diagrams (login -> token -> protected routes).
- Security checklist and threat notes.
- Test report proving unauthorized users cannot edit/delete others' resources.
- Comparison section: what evolved from CA1 to CA2.

## CA2 Definition of Done
- Unauthenticated users cannot create/update/delete.
- Authenticated user A cannot edit/delete user B resource.
- Admin override works.
- Permission behavior is reflected both in UI and backend.

## 4) Suggested Timeline

## Week plan
1. Week 1-2 (CA1)
- Stabilize CRUD, validations, and filters.
- Polish UI and error handling.
- Prepare CA1 demo and viva notes.

2. Week 3-4 (CA2 Core)
- Add User model, auth routes, JWT middleware.
- Add ownerId on resource creation.
- Enforce owner/admin checks on update/delete.

3. Week 5 (CA2 Hardening)
- Add security middleware and rate limits.
- Add 1-2 advanced features (pagination/bookmarks/soft delete).
- Add automated tests for auth + permissions.

4. Week 6 (Submission prep)
- Final documentation, architecture diagrams, and demo script.
- Dry run viva with expected Q&A.

## 5) Evaluation-Ready Demo Script

## CA1 demo order (6-8 min)
1. Create a new resource.
2. Show resource in list and details page.
3. Edit and delete the resource.
4. Show validation error handling.
5. Show search and filter.

## CA2 demo order (8-10 min)
1. Register/login as User A.
2. Create a resource as User A.
3. Login as User B and attempt edit/delete on User A resource -> blocked (403).
4. Login as Admin and show allowed moderation action.
5. Show UI hiding unauthorized buttons.

## 6) What to Say in Report (Short Structure)

1. Problem statement and motivation.
2. CA1 architecture and implementation.
3. CA2 enhancements (security + ownership + advanced features).
4. Testing strategy and outcomes.
5. Limitations and future work.

## 7) Risk Control

- Keep CA1 frozen once accepted; avoid major refactors before CA2 starts.
- Build CA2 in small milestones: auth first, ownership second, enhancements third.
- Maintain a demo seed dataset for reliable presentations.

---

This two-phase structure gives clear academic progression:
- CA1 proves implementation fundamentals.
- CA2 proves professional-grade software engineering and security maturity.
