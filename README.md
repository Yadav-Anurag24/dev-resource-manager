# Developer Resource Manager (DRM)

A full-stack web application for developers to store, manage, categorize, and analyze learning resources — built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB.

> **Phase 1 (CA1)** delivered core CRUD, search/filter, file uploads, and a polished frontend.  
> **Phase 2 (CA2)** added JWT authentication, role-based access control, resource ownership, security hardening, analytics dashboard, bookmarks, export, pagination, audit logging, automated tests, and several UI upgrades.

---

## Features

### Core (Phase 1)
- Full CRUD operations for learning resources
- Category and difficulty filtering
- Keyword search across title, description, and tags
- Resource rating support (0–5)
- Tag support (comma-separated input)
- Optional file upload for resources (PDF, DOC, DOCX, EPUB, TXT)
- Dark / Light theme toggle (sun/moon pill — CSS only, OS preference detection)
- Centralized validation and error handling
- Request logging middleware

### Authentication & Authorization (Phase 2)
- User registration and login with **JWT** (JSON Web Tokens, 30-day expiry)
- Password hashing with **bcrypt** (salt rounds = 10)
- `protect` middleware — verifies Bearer token on every protected route
- `admin` middleware — restricts specific actions to admin role
- Role-based access: `user` (default) and `admin`
- Frontend auth module (`Auth.js`) — token storage, auto-logout on 401, conditional navbar

### Resource Ownership (Phase 2)
- Every resource is linked to its creator via an `owner` field
- Only the owner or an admin can update / delete a resource
- Non-owners receive `403 Forbidden`
- Owner username populated in list and detail responses

### Security Hardening (Phase 2)
- **Helmet** — secure HTTP headers (CSP, X-Frame-Options, etc.)
- **CORS** — configurable allowed origins
- **express-rate-limit** — auth endpoints limited to 10 requests / 15 min
- **express-mongo-sanitize** — blocks NoSQL injection in query params
- `.env` validation on startup (crashes early if `JWT_SECRET` is missing)
- Request body size limit (`1 MB`)
- XSS-safe frontend rendering with `escapeHtml()`

### Dashboard & Analytics (Phase 2)
- Dedicated dashboard page with Chart.js visualizations
- Backend `GET /api/resources/stats` uses MongoDB aggregation pipeline
- Stats: total count, by category, by difficulty, average rating, resources over time (30 days), top 5 tags, source type distribution

### Bookmarks (Phase 2)
- Toggle bookmark on any resource (per-user)
- `POST /api/resources/:id/bookmark` — toggle on/off
- `GET /api/resources/bookmarks` — list bookmarked resources
- Bookmark icon (★ / ☆) on resource cards

### Export (Phase 2)
- `GET /api/resources/export?format=csv` — download filtered resources as CSV
- `GET /api/resources/export?format=json` — download as JSON
- Respects active search/filter params
- CSV includes metadata header (exported by, date, filters, count)

### Pagination & Sorting (Phase 2)
- `page`, `limit`, `sortBy`, `sortOrder` query params
- Paginated response: `{ data, currentPage, totalPages, totalResources }`
- Sortable table columns on the frontend
- Filters + pagination preserved in URL params

### Audit Log (Phase 2)
- `AuditLog` model tracks CREATE, UPDATE, DELETE, LOGIN, REGISTER actions
- `GET /api/audit-log` — admin-only, filterable by action, user, date range, paginated
- Dedicated Activity Log page for admins

### Automated Tests (Phase 2)
- **Jest** + **Supertest** with **mongodb-memory-server** (in-memory DB per test run)
- `tests/auth.test.js` — registration & login (success, duplicate, validation)
- `tests/resources.test.js` — full CRUD cycle, pagination, filtering, search
- `tests/ownership.test.js` — owner vs non-owner enforcement, admin override, 401/403 checks
- `npm test` and `npm run test:coverage` scripts

### UI Enhancements (Phase 2)
- Sun / moon pill theme toggle (CSS-only animation)
- Confirm modal replacing `window.confirm()`
- Toast notification system (success, error, warning, info) with auto-dismiss
- Collapsible sidebar with mobile-responsive backdrop
- Profile page with stats (resource count, bookmark count, join date)
- Conditional UI — edit/delete buttons visible only to owner or admin

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express.js | Backend framework and routing |
| MongoDB Atlas | Cloud NoSQL database |
| Mongoose | ODM for schemas and DB operations |
| JSON Web Token | Stateless authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Helmet | Secure HTTP headers |
| CORS | Cross-origin configuration |
| express-rate-limit | Rate limiting |
| express-mongo-sanitize | NoSQL injection prevention |
| express-validator | Input validation |
| Chart.js (CDN) | Dashboard visualizations |
| Jest + Supertest | Automated testing |
| mongodb-memory-server | In-memory test database |
| HTML/CSS/JavaScript | Frontend UI and client-side logic |
| dotenv | Environment variables |
| nodemon | Auto-restart during development |

## Project Structure

```
DRM/
├── controllers/
│   ├── authController.js          # Register, login, profile, password change
│   └── resourceController.js      # CRUD, stats, bookmarks, export
├── middlewares/
│   ├── authMiddleware.js           # protect (JWT verify) + admin (role check)
│   ├── errorHandler.js             # Centralized error responses
│   ├── logger.js                   # Request logging
│   ├── uploadResourceFile.js       # Multer file upload config
│   └── validateResource.js         # express-validator rules
├── models/
│   ├── AuditLog.js                 # Action tracking schema
│   ├── Resource.js                 # Resource schema (with owner ref)
│   └── User.js                     # User schema (bcrypt, roles, bookmarks)
├── public/
│   ├── index.html                  # Resource list (home)
│   ├── add.html                    # Create resource form
│   ├── edit.html                   # Edit resource form
│   ├── details.html                # Single resource view
│   ├── dashboard.html              # Analytics dashboard
│   ├── audit.html                  # Activity log (admin)
│   ├── profile.html                # User profile & settings
│   ├── login.html                  # Login page
│   ├── register.html               # Registration page
│   ├── css/
│   │   └── style.css               # Full stylesheet (light + dark themes)
│   └── js/
│       ├── auth.js                 # Shared auth module (token, headers, navbar)
│       ├── login.js                # Login form handler
│       ├── register.js             # Register form handler
│       ├── index.js                # Resource list logic
│       ├── add.js                  # Create resource logic
│       ├── edit.js                 # Edit resource logic
│       ├── details.js              # Detail page logic
│       ├── dashboard.js            # Chart.js dashboard
│       ├── audit.js                # Audit log page
│       ├── profile.js              # Profile page
│       ├── sidebar.js              # Collapsible sidebar
│       ├── theme.js                # Theme toggle (sun/moon pill)
│       ├── toast.js                # Toast notification system
│       └── confirm.js              # Confirm modal utility
├── routes/
│   ├── authRoutes.js               # /api/auth/*
│   ├── resourceRoutes.js           # /api/resources/*
│   └── auditRoutes.js              # /api/audit-log
├── tests/
│   ├── setup.js                    # Jest setup (in-memory MongoDB)
│   ├── auth.test.js                # Auth endpoint tests
│   ├── resources.test.js           # Resource CRUD tests
│   └── ownership.test.js           # Ownership & permission tests
├── uploads/                        # Uploaded resource files
├── server.js                       # Express app entry point
├── jest.config.js                  # Jest configuration
├── package.json
├── .env
└── .gitignore
```

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Steps

1. Clone the repository

```bash
git clone https://github.com/Yadav-Anurag24/dev-resource-manager.git
cd dev-resource-manager
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables in `.env`

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/developer-resource-manager?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

4. Run the app

```bash
npm run dev
```

For production:

```bash
npm start
```

5. Open in browser

http://localhost:3000

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register a new user |
| POST | /api/auth/login | Public | Login and receive JWT |
| GET | /api/auth/profile | Private | Get user profile with stats |
| PUT | /api/auth/profile | Private | Update username |
| PUT | /api/auth/change-password | Private | Change password |

### Resources

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/resources | Public | List resources (paginated, filterable, sortable) |
| POST | /api/resources | Private | Create resource (with optional file upload) |
| GET | /api/resources/stats | Public | Dashboard analytics (aggregation) |
| GET | /api/resources/bookmarks | Private | Get user's bookmarked resources |
| GET | /api/resources/export | Private | Export resources as CSV or JSON |
| POST | /api/resources/:id/bookmark | Private | Toggle bookmark on a resource |
| GET | /api/resources/:id | Public | Get single resource by ID |
| PUT | /api/resources/:id | Private | Update resource (owner or admin) |
| DELETE | /api/resources/:id | Private | Delete resource (owner or admin) |

### Audit Log

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/audit-log | Admin | List audit entries (filterable, paginated) |

### Query Parameters (Resources)

| Param | Values | Example |
|---|---|---|
| category | DSA, Backend, DevOps, AI | `?category=DSA` |
| difficulty | Beginner, Intermediate, Advanced | `?difficulty=Beginner` |
| search | any keyword | `?search=graph` |
| page | number (default 1) | `?page=2` |
| limit | 1–100 (default 10) | `?limit=20` |
| sortBy | title, category, difficulty, rating, createdAt | `?sortBy=rating` |
| sortOrder | asc, desc | `?sortOrder=desc` |

## Frontend Routes

| Page | Path | Description |
|---|---|---|
| Home | `/` or `/index.html` | Resource list with search, filters, pagination |
| Add Resource | `/add.html` | Create new resource (auth required) |
| Edit Resource | `/edit.html?id=<id>` | Edit existing resource (owner/admin) |
| Resource Details | `/details.html?id=<id>` | Full resource view |
| Dashboard | `/dashboard.html` | Analytics with charts |
| Activity Log | `/audit.html` | Audit trail (admin only) |
| Profile | `/profile.html` | User profile & settings |
| Login | `/login.html` | Login form |
| Register | `/register.html` | Registration form |

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| username | String | Required, unique, trimmed |
| email | String | Required, unique, lowercase |
| password | String | Required — stored as bcrypt hash |
| role | String | `user` (default) or `admin` |
| bookmarks | [ObjectId] | References to bookmarked Resources |

### Resource

| Field | Type | Notes |
|---|---|---|
| owner | ObjectId | Ref to User (required) |
| title | String | Required, trimmed, min/max length |
| description | String | Required, trimmed |
| category | String | Enum: DSA, Backend, DevOps, AI |
| difficulty | String | Enum: Beginner, Intermediate, Advanced |
| link | String | Optional external URL |
| fileName | String | Uploaded file original name |
| filePath | String | Server path under /uploads |
| fileMimeType | String | MIME type of uploaded file |
| fileSize | Number | Size in bytes |
| tags | [String] | Optional tags |
| rating | Number | 0 to 5 |
| createdAt | Date | Auto-generated |
| updatedAt | Date | Auto-generated |

### AuditLog

| Field | Type | Notes |
|---|---|---|
| action | String | CREATE, UPDATE, DELETE, LOGIN, REGISTER |
| resourceId | ObjectId | Ref to Resource (optional) |
| resourceTitle | String | Snapshot of resource title |
| userId | ObjectId | Ref to User |
| username | String | Snapshot of username |
| details | String | Extra context |
| timestamp | Date | Auto-generated, indexed |

## Available Scripts

| Script | Command | Description |
|---|---|---|
| start | `npm start` | Start server |
| dev | `npm run dev` | Start with nodemon (auto-restart) |
| test | `npm test` | Run Jest test suite |
| test:coverage | `npm run test:coverage` | Run tests with coverage report |

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Tests use `mongodb-memory-server` so no external database is needed. The test environment is isolated and auto-cleaned between runs.

## Notes

- The server exposes uploads via `/uploads` static route.
- API responses are JSON with a `success` flag and `data` or `error` payload.
- Validation failures return HTTP 400 with detailed errors.
- Auth failures return 401 (unauthenticated) or 403 (unauthorized).
- Rate limiting is disabled in the test environment.

## License

ISC
