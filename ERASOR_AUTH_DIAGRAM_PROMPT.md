# Erasor.io Prompt — DRM Auth System Flow Diagram

> Copy the text inside the code block below and paste it into [erasor.io](https://www.erasor.io) diagram-from-prompt feature.

```
Create a detailed flow diagram for the Authentication System of a Developer Resource Manager (DRM) web application. Use clear swim lanes, color-coded boxes, and arrows. Include the following flows and components:

---

ACTORS / SWIM LANES:
1. Browser (Frontend — HTML/JS)
2. Express Server (Backend — Node.js)
3. MongoDB Database

---

FLOW 1 — USER REGISTRATION:
1. User fills the Register form (username, email, password, confirm password).
2. Frontend (register.js) performs client-side validation: username required, valid email, password ≥ 6 chars, passwords match.
3. Frontend sends POST /api/auth/register with JSON body { username, email, password }.
4. Express Router passes request through express-validator middleware (checks username not empty, email valid, password ≥ 6 chars).
5. authController.registerUser checks if a user with the same email already exists in MongoDB.
6. If duplicate → return 400 "User already exists".
7. If new → create User document. The Mongoose pre-save hook automatically hashes the password using bcrypt (salt rounds = 10) before storing.
8. Server calls generateToken(userId, role) → jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' }) to create a JWT.
9. Server creates an AuditLog entry with action "REGISTER".
10. Server responds 201 with { success: true, token, user: { id, username, email, role } }.
11. Frontend receives the response, stores the token in localStorage (key: "drm-token") and user object in localStorage (key: "drm-user"), then redirects to home page.

---

FLOW 2 — USER LOGIN:
1. User fills the Login form (email, password).
2. Frontend (login.js) validates: email required, password required.
3. Frontend sends POST /api/auth/login with JSON body { email, password }.
4. Express Router passes request through express-validator middleware.
5. authController.loginUser looks up the user by email in MongoDB.
6. If not found → return 400 "Invalid credentials".
7. If found → call user.comparePassword(enteredPassword) which uses bcrypt.compare() against the stored hash.
8. If password mismatch → return 400 "Invalid credentials" (same message to prevent email enumeration).
9. If match → generate JWT with generateToken(userId, role) → jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' }).
10. Server creates an AuditLog entry with action "LOGIN".
11. Server responds 200 with { success: true, token, user: { id, username, email, role } }.
12. Frontend stores token and user in localStorage, shows a welcome toast, redirects to home.

---

FLOW 3 — ACCESSING A PROTECTED ROUTE (JWT Verification):
1. User performs an action that requires auth (e.g. create resource, view profile, delete resource).
2. Frontend reads the token from localStorage and attaches header: Authorization: Bearer <token>.
3. Request hits the "protect" middleware on the server.
4. Middleware extracts the token from the Authorization header (splits "Bearer <token>").
5. Middleware calls jwt.verify(token, JWT_SECRET) to decode and validate the token.
6. If token is expired or invalid → return 401 "Not authorized, token failed".
7. If no token at all → return 401 "Not authorized, no token".
8. If valid → decoded payload contains { id, role }. Middleware queries MongoDB: User.findById(decoded.id).select('-password') to attach full user object to req.user.
9. Calls next() → request proceeds to the route controller.

---

FLOW 4 — ADMIN ROLE CHECK:
1. After the "protect" middleware attaches req.user, the "admin" middleware runs.
2. It checks if req.user.role === 'admin'.
3. If yes → next() → proceeds to the admin-only controller.
4. If no → return 403 "Not authorized as an admin".

---

FLOW 5 — FRONTEND AUTH STATE MANAGEMENT:
1. Auth.js module provides: getToken(), getUser(), saveAuth(), clearAuth(), isLoggedIn(), isAdmin(), authHeaders(), logout(), handleUnauthorized(), requireAuth(), updateNavbar().
2. On every page load, updateNavbar() checks isLoggedIn() and renders login/register links OR username + logout button.
3. Protected pages call Auth.requireAuth() which redirects to /login.html if no token exists.
4. If any API response returns 401, handleUnauthorized() clears stored auth and redirects to login.
5. logout() clears localStorage and redirects to /login.html.

---

DATA MODEL — USER:
- username (String, required, unique)
- email (String, required, unique, lowercase)
- password (String, required — stored as bcrypt hash)
- role (String, enum: ['user', 'admin'], default: 'user')
- bookmarks (Array of ObjectId refs to Resource)

---

JWT TOKEN STRUCTURE:
- Header: { alg: "HS256", typ: "JWT" }
- Payload: { id: <MongoDB ObjectId>, role: "user" | "admin", iat: <issued-at>, exp: <30 days from issue> }
- Signature: HMACSHA256(header + payload, JWT_SECRET)

---

STYLE NOTES:
- Use green for success paths, red for error/rejection paths, blue for data flow arrows.
- Show the JWT token as a badge/label moving between frontend and backend.
- Highlight the bcrypt hashing step and the jwt.verify step with distinct icons.
- Group the protect and admin middlewares inside a "Middleware Layer" box on the server side.
```
