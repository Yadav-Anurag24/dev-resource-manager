# VIVA REVISION GUIDE: Developer Resource Manager (DRM)

This document is tailored for your Viva preparation. It breaks down the technical terms, features, and how the different moving parts of your application interact.

---

## 1. Project Snapshot
**What is DRM?** 
A full-stack, API-driven web application to manage, categorize, and search developer learning resources (like links and file uploads). 

**How does it work at a high level?**
It uses a **Client-Server Architecture**. 
- The **Frontend** consists of static HTML, CSS, and vanilla JavaScript. It runs in the browser and uses the `fetch()` API to talk to the backend.
- The **Backend** is a RESTful API built with **Node.js** and **Express**. It handles data processing, file uploads, authentication, and communicates with a **MongoDB** database.

---

## 2. Core Architecture & Inter-relations

The backend follows an **MVC-inspired (Model-View-Controller) / API pattern**.

### 1. **Models (`/models`)**
*What they do*: Define the structure of your database collections.
- **`Resource.js`**: Defines strings, enums (e.g., Difficulty: Beginner/Intermediate/Advanced), and arrays (Tags). Uses **Mongoose** to enforce this schema. It also defines indexes (e.g., text index on title) to make searches blazing fast.
- **`User.js`**: Stores User credentials. Uses `bcryptjs` in a `pre('save')` hook to automatically encrypt (hash) passwords before saving them to the database.

### 2. **Controllers (`/controllers`)**
*What they do*: Hold the "Business Logic". They receive the request from the route, interact with the Model (DB), and send back JSON responses.
- **`resourceController.js`**: Handles the CRUD operations (Create, Read, Update, Delete) for resources. Includes logic for filtering by category/difficulty and searching using regex (`$regex`).
- **`authController.js`**: Handles user registration and login. Compares passwords and issues JSON Web Tokens (JWT).

### 3. **Routes (`/routes`)**
*What they do*: Act as the traffic cops. They map a specific URL and HTTP Method (like `GET /api/resources`) to a specific Controller function.
- They also chain **Middlewares** before hitting the controller.

### 4. **Middlewares (`/middlewares`)**
*What they do*: Functions that run *in the middle* of the request-response cycle. They have access to `req`, `res`, and the `next()` function.
- **`logger.js`**: Logs every incoming HTTP request (Method + URL) to the console.
- **`authMiddleware.js` (`protect`, `admin`)**: Checks if the request has a valid JWT token. If so, it attaches the `user` to the request. If missing or invalid, it rejects with a `401 Unauthorized`.
- **`uploadResourceFile.js` (Multer)**: Intercepts `multipart/form-data` requests, grabs uploaded files (PDF, DOCX, TXT), saves them to `/uploads`, and attaches the file info to `req.file`.
- **`validateResource.js`**: Checks if the required fields (title, description, links) are valid *before* letting the request reach the controller. If invalid, returns a `400 Bad Request`.
- **`errorHandler.js`**: A centralized place to catch errors (like Multer file size errors or general server crashes) and return a clean JSON error response, ensuring the server doesn't just crash.

### 5. **Frontend (`/public`)**
*What they do*: The UI layer.
- Uses `index.html`, `add.html`, `edit.html` etc. 
- The `.js` files listen to form submissions or page loads, collect data, and use `fetch()` to call the API.
- Implements **DOM Manipulation** to dynamically inject resources into the page (e.g., `resources-container.innerHTML`).
- Includes security measures like an `escapeHtml()` function to prevent **XSS (Cross-Site Scripting)** attacks when rendering user-submitted text.

---

## 3. Key Technical Terms for Viva

### **RESTful API**
An architectural style for APIs. It means we use standard HTTP methods appropriately:
- `GET` to retrieve data (e.g., Fetch resources)
- `POST` to create data (e.g., Add a resource)
- `PUT` to completely update data (e.g., Edit a resource)
- `DELETE` to remove data

### **Mongoose & ODM**
**ODM** stands for Object Data Modeling. MongoDB stores data as raw JSON-like documents (BSON). Mongoose acts as a wrapper that allows us to interact with MongoDB collections using JavaScript objects and provides strict schema validation, which MongoDB natively lacks.

### **JWT (JSON Web Token)**
A method for **stateless authentication**. 
1. User logs in.
2. Server verifies password and creates a base64-encoded string (Token) containing the User's ID and Role.
3. Server signs this token with a secret key (`JWT_SECRET`) so it cannot be tampered with.
4. Client stores the token and sends it in the `Authorization: Bearer <token>` header for subsequent requests.

### **Bcrypt.js (Salting & Hashing)**
We never store plain-text passwords. `bcrypt.js` converts the password into an irreversible hash. A "salt" (random data) is added before hashing to protect against dictionary attacks and rainbow tables.

### **Multer**
A Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files. Express cannot parse file uploads natively; Multer reads the incoming stream and saves it to the disk.

### **Debouncing (Frontend concept)**
In `index.js`, when searching, you use a `searchDebounceTimer`. 
*What it means:* We delay the API call until the user stops typing for 280ms. This prevents sending an HTTP request for every single keystroke, saving server resources and bandwidth.

---

## 4. Flow Examples: "How things are Interrelated"

### Flow A: Creating a Resource with a File
**Step 1:** User fills the form on `add.html` and selects a PDF file. Clicks "Create".
**Step 2:** `add.js` intercepts the form submit (`e.preventDefault()`), creates a `FormData` object, and sends a `POST` request using `fetch()` to `/api/resources`.
**Step 3:** The request hits `server.js` and is routed through `resourceRoutes.js`.
**Step 4:** **Middleware Chain Executed:**
   1. `protect`: Validates the user's JWT. (Throws error if unauthorized).
   2. `uploadResourceFile.single('resourceFile')`: **Multer** grabs the PDF, saves it to `/uploads`, and adds info to `req.file`.
   3. `validateResource`: Checks if Title, Description, Category etc., are present.
**Step 5:** The request reaches `resourceController.js` (`createResource`). It creates a new `Resource` Mongoose object, including `req.file.filename`, and calls `.save()`.
**Step 6:** The database successfully saves. The Controller responds with `res.status(201).json(...)`.
**Step 7:** `add.js` receives the success response and redirects the browser to `index.html`.

### Flow B: Filtering and Searching
**Step 1:** User types "API" in the search box on `index.html`.
**Step 2:** `index.js` debounces the input, builds query parameters (`?search=API`), and `fetch`es GET `/api/resources?search=API`.
**Step 3:** `resourceController` reads `req.query.search`. It builds a MongoDB `$or` filter to check if "API" exists in the `title`, `description`, or `tags` array using a case-insensitive Regular Expression (`$regex`).
**Step 4:** Mongoose returns the specific resources, skipping the rest. Array passed back to the frontend.

---

## 5. Potential Viva Questions & "Cheat Sheet" Answers

**Q: Why use Express.js instead of just native Node.js?**
**A:** Native Node `http` module requires manually parsing URLs, body chunks, and headers. Express provides a robust, standardized way to set up routes, handle JSON parsing with `express.json()`, and manage request flows via middleware.

**Q: How did you secure your API?**
**A:** By using **JWT (JSON Web Tokens)** for stateless protection of sensitive routes (POST, PUT, DELETE), hashing passwords with **bcryptjs**, and applying strict backend schemas via **Mongoose** to prevent bad data injection. We also sanitize HTML output on the frontend using `escapeHtml()` to prevent XSS.

**Q: What happens if a user uploads a 50MB file?**
**A:** Our Multer configuration has a `limits: { fileSize: 15 * 1024 * 1024 }` (15MB) check. If exceeded, it throws a `LIMIT_FILE_SIZE` error. The request falls into our centralized `errorHandler.js` which catches it and sends a clean 400 Bad Request error back to the user without crashing the server.

**Q: Explain the role of `dotenv`?**
**A:** It loads environment variables from a `.env` file into `process.env`. This keeps sensitive details like our `MONGODB_URI` and `JWT_SECRET` off of GitHub and allows us to easily switch configurations between development and production.

**Q: What is the difference between `req.body`, `req.query`, and `req.params`?**
**A:** 
- `req.body`: Contains data sent in a POST/PUT request (like form data or JSON payloads).
- `req.query`: Contains the URL query string parameters (e.g., `?category=DSA`).
- `req.params`: Contains routing parameters embedded in the URL path (e.g., the `123` in `/api/resources/123`).
