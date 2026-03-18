# Developer Resource Manager - Phase 1: Concepts & Viva Preparation Guide

Note:
- For CA planning, use CA1/CA2 roadmap in CA1_CA2_PHASE_PLAN.md.
- This project currently uses static HTML/CSS/JS pages in public/ with API endpoints, not EJS views.

---

## 1. Project Overview

**Developer Resource Manager (DRM)** is a full-stack web application built with Node.js, Express, MongoDB, and a static frontend (HTML/CSS/JavaScript). It allows developers to store, manage, categorize, and search learning resources like DSA sheets, backend tutorials, DevOps docs, and AI papers.

**Phase 1** covers: CRUD operations, MongoDB integration, filtering/search, middleware, and layered architecture.

---

## 2. Tech Stack Used

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for server-side execution |
| **Express.js** | Web framework for routing, middleware, and HTTP handling |
| **MongoDB** | NoSQL document database for storing resources |
| **Mongoose** | ODM (Object Data Modeling) library for MongoDB |
| **dotenv** | Load environment variables from `.env` file |
| **method-override** | Support PUT and DELETE methods in HTML forms |
| **nodemon** | Auto-restart server during development |

---

## 3. Architecture Pattern: MVC

We follow the **Model-View-Controller (MVC)** architecture:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Views     │◄─────│ Controllers  │◄─────│   Models     │
│   (EJS)      │      │  (Logic)     │      │  (Mongoose)  │
└──────────────┘      └──────────────┘      └──────────────┘
       ▲                     ▲
       │                     │
   Renders HTML         Routes call
       │                controllers
       │                     │
┌──────────────┐      ┌──────────────┐
│   Browser    │─────►│   Routes     │
│  (Client)    │      │  (Express)   │
└──────────────┘      └──────────────┘
```

- **Model** (`models/Resource.js`): Defines the data structure and schema using Mongoose.
- **View** (`views/*.ejs`): EJS templates that render HTML pages to the user.
- **Controller** (`controllers/resourceController.js`): Contains business logic for each route.
- **Routes** (`routes/resourceRoutes.js`): Maps URLs to controller functions.

### Why MVC?
- **Separation of concerns** – each layer has a single responsibility
- **Maintainability** – easy to modify one layer without affecting others
- **Scalability** – can add features without rewriting existing code
- **Testability** – controllers can be unit tested independently

---

## 4. Folder Structure Explained

```
/project-root
│
├── /models
│     Resource.js           → Mongoose schema & model definition
│
├── /routes
│     resourceRoutes.js     → URL-to-controller mapping
│
├── /controllers
│     resourceController.js → Business logic (CRUD operations)
│
├── /middlewares
│     logger.js             → Request logging middleware
│     errorHandler.js       → Centralized error handling
│     validateResource.js   → Form validation middleware
│
├── /views
│     layout.ejs            → Base HTML layout (header, footer, navbar)
│     index.ejs             → Resource listing page
│     add.ejs               → Add resource form
│     edit.ejs              → Edit resource form
│     details.ejs           → Resource detail page
│     error.ejs             → Error display page
│
├── /public
│     /css/style.css        → Stylesheet
│
├── server.js               → Application entry point
├── package.json            → Project metadata & dependencies
├── .env                    → Environment variables (DB URI, PORT)
└── .gitignore              → Files to exclude from Git
```

---

## 5. Step-by-Step: What We Did From Scratch

### Step 1: Project Initialization
```bash
npm init -y                  # Creates package.json
npm install express mongoose ejs dotenv method-override ejs-mate
npm install --save-dev nodemon
```

**Concepts:**
- `npm init -y` initializes a Node.js project with default settings
- `package.json` tracks project metadata, scripts, and dependencies
- `--save-dev` installs a package as a development dependency (not needed in production)

### Step 2: Environment Configuration (`.env`)
```env
PORT=3000
MONGODB_URI=mongodb+srv://...@cluster.mongodb.net/developer-resource-manager
NODE_ENV=development
```

**Concepts:**
- **Environment variables** keep sensitive data (DB credentials) out of source code
- `dotenv` reads `.env` file and injects values into `process.env`
- `.env` is listed in `.gitignore` so it's never pushed to version control

### Step 3: Express Server Setup (`server.js`)
```js
const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
```

**Concepts:**
- `express()` creates an Express application instance
- `app.set('view engine', 'ejs')` tells Express to use EJS for rendering
- `express.json()` parses JSON request bodies
- `express.urlencoded({ extended: true })` parses URL-encoded form data
- `methodOverride('_method')` enables PUT/DELETE via `?_method=PUT` in form actions
- `express.static()` serves static files (CSS, images) from the `public/` folder

### Step 4: MongoDB Connection
```js
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => process.exit(1));
```

**Concepts:**
- **Mongoose** is an ODM that provides schema-based data modeling for MongoDB
- `mongoose.connect()` returns a **Promise** – we use `.then()/.catch()` for handling
- If the DB connection fails, `process.exit(1)` terminates the server

### Step 5: Mongoose Schema & Model (`models/Resource.js`)
```js
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['DSA', 'Backend', 'DevOps', 'AI'] },
  ...
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
```

**Concepts Applied:**

| Concept | Explanation |
|---|---|
| **Schema** | Defines the shape/structure of documents in a MongoDB collection |
| **`required`** | Built-in validator – field must be provided |
| **`trim`** | Removes whitespace from start/end of strings |
| **`enum`** | Restricts field to specific allowed values only |
| **`minlength` / `maxlength`** | String length validators |
| **`min` / `max`** | Number range validators |
| **`default`** | Sets a default value if none is provided |
| **`type: [String]`** | Defines an array of strings (for tags) |
| **`timestamps: true`** | Auto-adds `createdAt` and `updatedAt` fields |
| **Custom error messages** | `required: [true, 'Title is required']` – shown when validation fails |
| **Indexing** | `resourceSchema.index({...})` improves query performance |
| **`mongoose.model()`** | Compiles the schema into a Model (used to create/query documents) |

### Step 6: Controller with CRUD Operations (`controllers/resourceController.js`)

| Operation | HTTP Method | Route | Mongoose Method | Description |
|---|---|---|---|---|
| **List all** | GET | `/resources` | `Resource.find(filter)` | Get all resources with optional filters |
| **Show form** | GET | `/resources/new` | — | Render the add form |
| **Create** | POST | `/resources` | `resource.save()` | Save a new resource to DB |
| **View one** | GET | `/resources/:id` | `Resource.findById(id)` | Get a single resource by ID |
| **Edit form** | GET | `/resources/:id/edit` | `Resource.findById(id)` | Render edit form with existing data |
| **Update** | PUT | `/resources/:id` | `Resource.findByIdAndUpdate()` | Update an existing resource |
| **Delete** | DELETE | `/resources/:id` | `Resource.findByIdAndDelete()` | Remove a resource |

**Key Mongoose Methods Used:**
- `Model.find(filter)` – find all documents matching the filter
- `Model.findById(id)` – find a single document by its `_id`
- `Model.findByIdAndUpdate(id, data, options)` – find and update in one operation
- `Model.findByIdAndDelete(id)` – find and delete in one operation
- `document.save()` – save a new document to the database

**`findByIdAndUpdate` options:**
- `{ new: true }` – return the updated document (not the old one)
- `{ runValidators: true }` – apply schema validators during update

### Step 7: Routing (`routes/resourceRoutes.js`)
```js
router.get('/', getAllResources);
router.get('/new', renderAddForm);
router.post('/', validateResource, createResource);
router.get('/:id', getResourceById);
router.get('/:id/edit', renderEditForm);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
```

**Concepts:**
- **`express.Router()`** creates a modular, mountable route handler
- Routes are mounted on `/resources` in `server.js` via `app.use('/resources', resourceRoutes)`
- **Route parameters** (`:id`) capture dynamic values from the URL → accessed via `req.params.id`
- **Middleware chaining** – `router.post('/', validateResource, createResource)` runs validation before the controller
- **RESTful routing** – follows REST conventions (GET for read, POST for create, PUT for update, DELETE for delete)

### Step 8: Middleware

#### a) Logger Middleware (`middlewares/logger.js`)
```js
const logger = (req, res, next) => {
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};
```
- Runs on **every request** (registered with `app.use(logger)`)
- Logs the HTTP method, URL, and timestamp
- **`next()`** passes control to the next middleware/route handler
- Without calling `next()`, the request would hang

#### b) Error Handler Middleware (`middlewares/errorHandler.js`)
```js
const errorHandler = (err, req, res, next) => { ... };
```
- Has **4 parameters** (`err, req, res, next`) – this is how Express identifies it as an error handler
- Catches all errors passed via `next(err)` from controllers
- Renders an error page or sends JSON based on the request's `Accept` header
- Must be registered **after all routes** in `server.js`

#### c) Validation Middleware (`middlewares/validateResource.js`)
- Validates form data **before** it reaches the controller
- Checks required fields, string lengths, and valid enum values
- If validation fails, re-renders the form with error messages
- If validation passes, calls `next()` to continue to the controller

**Viva Tip – Middleware Execution Order:**
```
Request → Logger → Route Match → Validation → Controller → Response
                                                    ↓ (if error)
                                              Error Handler
```

### Step 9: Filtering & Search

```js
// In controller: getAllResources()
if (category) filter.category = category;
if (difficulty) filter.difficulty = difficulty;
if (search) filter.title = { $regex: search, $options: 'i' };
```

**Concepts:**
- **Query parameters** – `req.query` captures `?category=DSA&difficulty=Beginner`
- **MongoDB `$regex`** – pattern matching for searching within strings
- **`$options: 'i'`** – makes the regex case-insensitive
- Filter object is built dynamically – only adds conditions that are provided
- Example URLs:
  - `/resources?category=DSA`
  - `/resources?difficulty=Beginner`
  - `/resources?search=graph`

### Step 10: EJS Templating

```ejs
<%= variable %>       ← Output escaped HTML (safe from XSS)
<%- body %>           ← Output unescaped HTML (used for layout body)
<% if (condition) { %> ← JavaScript logic (no output)
<% } %>
```

**Concepts:**
- **Server-side rendering (SSR)** – HTML is generated on the server and sent to the browser
- **`ejs-mate`** – adds layout support; views declare `<% layout('layout') %>` to wrap in the base layout
- **`layout.ejs`** contains the common HTML shell (head, navbar, footer) with `<%- body %>` placeholder
- **Passing data to views** – `res.render('index', { title, resources, query })` makes variables available in the template
- **Iteration** – `<% resources.forEach(r => { %>` to loop over data
- **Conditionals** – `<% if (errors.length > 0) { %>` to show/hide elements

---

## 6. Key Concepts for Viva Q&A

### What is Node.js?
Node.js is a JavaScript runtime built on Chrome's V8 engine. It allows running JavaScript on the server side. It uses an **event-driven, non-blocking I/O model** making it efficient for data-intensive real-time applications.

### What is Express.js?
Express is a minimal, flexible Node.js web framework that provides a set of features for building web applications and APIs. It simplifies routing, middleware handling, and HTTP request/response management.

### What is MongoDB?
MongoDB is a **NoSQL document-oriented database**. It stores data in flexible, JSON-like documents (BSON). Unlike SQL databases, it doesn't require a fixed schema and supports horizontal scaling.

### SQL vs MongoDB

| Feature | SQL (MySQL, PostgreSQL) | MongoDB |
|---|---|---|
| Data Model | Tables with rows & columns | Collections with documents |
| Schema | Fixed schema (must define columns) | Flexible schema (dynamic) |
| Query Language | SQL | MongoDB Query Language (MQL) |
| Relationships | JOINs | Embedding or referencing |
| Scaling | Vertical (bigger server) | Horizontal (more servers) |

### What is Mongoose?
Mongoose is an **ODM (Object Data Modeling)** library for MongoDB and Node.js. It provides:
- Schema definitions with type casting
- Built-in validation
- Query building methods
- Middleware (pre/post hooks)

### What is Middleware in Express?
Middleware functions have access to the **request object (`req`)**, **response object (`res`)**, and **`next` function**. They can:
- Execute any code
- Modify `req` and `res` objects
- End the request-response cycle
- Call `next()` to pass to the next middleware

**Types of middleware used in this project:**
1. **Application-level** – `app.use(logger)` – runs on every request
2. **Router-level** – `router.post('/', validateResource, createResource)` – runs on specific routes
3. **Error-handling** – `app.use(errorHandler)` – has 4 parameters, catches errors
4. **Built-in** – `express.json()`, `express.urlencoded()`, `express.static()`
5. **Third-party** – `methodOverride`, `ejsMate`

### What is `async/await`?
`async/await` is syntactic sugar over Promises that makes asynchronous code look synchronous.
```js
// Without async/await (Promise chain)
Resource.find().then(data => res.send(data)).catch(err => next(err));

// With async/await (cleaner)
const data = await Resource.find();
res.send(data);
```
- `async` function always returns a Promise
- `await` pauses execution until the Promise resolves
- Must wrap in `try/catch` for error handling

### What are HTTP Methods?

| Method | Purpose | Idempotent? | Example |
|---|---|---|---|
| **GET** | Retrieve data | Yes | Get list of resources |
| **POST** | Create new data | No | Submit a new resource |
| **PUT** | Update existing data | Yes | Update a resource |
| **DELETE** | Remove data | Yes | Delete a resource |

### What is `method-override` and why do we need it?
HTML forms only support **GET** and **POST** methods. To use PUT and DELETE, we use `method-override`:
```html
<form action="/resources/123?_method=DELETE" method="POST">
```
This tells Express to treat the POST request as a DELETE request.

### What is `dotenv`?
`dotenv` loads environment variables from a `.env` file into `process.env`. This keeps sensitive configuration (database URIs, API keys) out of the codebase and allows different settings per environment (development, production).

### What is `req.params` vs `req.query` vs `req.body`?

| Property | Source | Example |
|---|---|---|
| `req.params` | URL path parameters | `/resources/:id` → `req.params.id` |
| `req.query` | URL query string | `/resources?category=DSA` → `req.query.category` |
| `req.body` | POST/PUT request body | Form data → `req.body.title` |

### What is a Mongoose Schema vs Model?
- **Schema** defines the structure, types, validators, and defaults for documents
- **Model** is a compiled version of the schema that provides an interface to the database (CRUD methods)
```js
const schema = new mongoose.Schema({...});        // Schema
const Resource = mongoose.model('Resource', schema); // Model
```

### What are Mongoose Validators?
Validators are rules applied to schema fields:
- `required` – field must be present
- `enum` – field must be one of specified values
- `min` / `max` – number range
- `minlength` / `maxlength` – string length
- Custom validators can also be written

### What is the difference between `findByIdAndUpdate` and `save`?
- `save()` – creates a new document OR updates an existing one (runs all validators and middleware)
- `findByIdAndUpdate()` – directly updates in the database (faster, but needs `runValidators: true` option to apply validators)

### What is MongoDB Indexing?
Indexes improve query performance by creating efficient lookup structures:
```js
resourceSchema.index({ title: 'text' });         // Text index for search
resourceSchema.index({ category: 1, difficulty: 1 }); // Compound index for filtering
```
- Without indexes, MongoDB does a **collection scan** (checks every document)
- With indexes, MongoDB uses the index for faster lookups
- `1` = ascending order, `-1` = descending order

---

## 7. Common Viva Questions & Answers

**Q: What is the entry point of your application?**
A: `server.js` – it initializes Express, connects to MongoDB, configures middleware, mounts routes, and starts the HTTP server.

**Q: How does your app connect to the database?**
A: Using `mongoose.connect(MONGODB_URI)` where `MONGODB_URI` is loaded from the `.env` file via `dotenv`. We use MongoDB Atlas (cloud-hosted MongoDB).

**Q: How do you handle errors in your application?**
A: We use a centralized error handling middleware (`errorHandler.js`) with 4 parameters `(err, req, res, next)`. Controllers use `try/catch` blocks and call `next(err)` to forward errors to this handler.

**Q: Why did you use EJS instead of React?**
A: EJS is a server-side templating engine suitable for traditional web apps. For Phase 1, we needed server-rendered pages with forms. React would be overkill and adds client-side complexity not required by the project scope.

**Q: What happens when a user submits the add resource form?**
A: 
1. Browser sends a POST request to `/resources` with form data in the body
2. `express.urlencoded()` middleware parses the form data into `req.body`
3. `validateResource` middleware checks for required fields
4. If valid, `createResource` controller creates a new Mongoose document and calls `save()`
5. On success, redirects to `/resources` (listing page)
6. On failure, re-renders the form with error messages

**Q: How does filtering work?**
A: The filter bar sends GET requests with query parameters (e.g., `?category=DSA&difficulty=Beginner`). The controller builds a MongoDB filter object dynamically from `req.query` and passes it to `Resource.find(filter)`.

**Q: What is the purpose of `{ new: true }` in `findByIdAndUpdate`?**
A: By default, `findByIdAndUpdate` returns the document **before** the update. `{ new: true }` makes it return the **updated** document instead.

**Q: Why do you use `module.exports`?**
A: Node.js uses the CommonJS module system. `module.exports` makes functions, objects, or values available to other files that `require()` them. This enables modular code organization.

**Q: What is the role of `next()` in middleware?**
A: `next()` passes control to the next middleware function in the stack. Without calling `next()`, the request-response cycle would stop and the client would receive no response (request hangs/times out).

---

## 8. Request-Response Flow (Complete)

```
Browser Request (GET /resources?category=DSA)
       │
       ▼
┌─────────────────────┐
│     server.js        │  express.json(), urlencoded(), static, logger
│   (Middleware Stack)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   logger.js          │  Logs: [2026-03-03T...] GET /resources?category=DSA
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   resourceRoutes.js  │  Matches: router.get('/', getAllResources)
└─────────┬───────────┘
          │
          ▼
┌──────────────────────────┐
│   resourceController.js   │  Builds filter: { category: 'DSA' }
│   getAllResources()        │  Calls: Resource.find({ category: 'DSA' })
└─────────┬────────────────┘
          │
          ▼
┌─────────────────────┐
│     MongoDB Atlas     │  Returns matching documents
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   index.ejs           │  Renders HTML with resource data
│   (via layout.ejs)    │
└─────────┬───────────┘
          │
          ▼
    Browser receives HTML
```

---

## 9. npm Scripts

```json
"scripts": {
  "start": "node server.js",     // Production start
  "dev": "nodemon server.js"     // Development with auto-restart
}
```

- `npm start` – runs the server once (for production)
- `npm run dev` – uses nodemon to watch for file changes and auto-restart

---

## 10. Key Takeaways

1. **MVC pattern** separates data (Model), presentation (View), and logic (Controller)
2. **Mongoose schemas** provide structure and validation for MongoDB's flexible documents
3. **Middleware** is the backbone of Express – everything from parsing to error handling
4. **RESTful routing** maps HTTP methods to CRUD operations
5. **Environment variables** protect sensitive config from source code exposure
6. **Server-side rendering** with EJS generates HTML on the server before sending to client
7. **async/await with try/catch** is the standard pattern for handling asynchronous database operations
8. **method-override** bridges the gap between HTML form limitations and RESTful HTTP methods
