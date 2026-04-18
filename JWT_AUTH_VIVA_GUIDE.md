# How JWT Authentication Works in DRM — VIVA Preparation Guide

## 1. What is JWT?

JWT stands for **JSON Web Token**. It is an open standard (RFC 7519) for securely transmitting information between two parties as a compact, URL-safe JSON object. In this project it is used to **authenticate users** after login without needing server-side sessions.

> **Key VIVA point:** JWT is *stateless* — the server does not store any session. All the info needed to verify a user is inside the token itself.

---

## 2. Structure of a JWT

A JWT has **three parts** separated by dots: `xxxxx.yyyyy.zzzzz`

| Part | Contains | In Our Project |
|------|----------|----------------|
| **Header** | Algorithm & token type | `{ "alg": "HS256", "typ": "JWT" }` |
| **Payload** | Claims (data) | `{ "id": "<MongoDB ObjectId>", "role": "user", "iat": 1713400000, "exp": 1715992000 }` |
| **Signature** | Verification hash | `HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)` |

- `id` — the user's MongoDB `_id`, used to look them up on protected routes.
- `role` — `"user"` or `"admin"`, used for authorization checks.
- `iat` — "issued at" timestamp (auto-added by jsonwebtoken library).
- `exp` — expiry timestamp, set to **30 days** from issue.

### How the signature works

The server takes the header + payload, encodes them in Base64, and signs them with the **JWT_SECRET** (a private string stored in `.env`). When a token comes back on a later request, the server re-computes the signature. If it matches, the token is valid and hasn't been tampered with.

> **VIVA Q:** "What happens if someone changes the payload of a JWT?"  
> **A:** The signature won't match because it was computed with the original payload. `jwt.verify()` will throw an error and return 401 Unauthorized.

---

## 3. Registration Flow — Step by Step

```
Browser                          Server                          MongoDB
  |                                |                                |
  |-- POST /api/auth/register ---->|                                |
  |   { username, email, password }|                                |
  |                                |-- findOne({ email }) --------->|
  |                                |<-- null (no duplicate) --------|
  |                                |                                |
  |                                |-- new User({ ... }).save() --->|
  |                                |   (pre-save hook hashes pwd    |
  |                                |    with bcrypt, salt=10)       |
  |                                |<-- saved user doc -------------|
  |                                |                                |
  |                                |-- generateToken(id, role)      |
  |                                |   jwt.sign({ id, role },       |
  |                                |     JWT_SECRET, { expiresIn:   |
  |                                |     '30d' })                   |
  |                                |                                |
  |<-- 201 { token, user } --------|                                |
  |                                |                                |
  | localStorage.setItem(          |                                |
  |   'drm-token', token)          |                                |
  | localStorage.setItem(          |                                |
  |   'drm-user', user)            |                                |
  | redirect to '/'                |                                |
```

**What happens to the password?**

1. User types plain-text password in the form.
2. It gets sent to the server over HTTPS.
3. In the Mongoose `User` model, there is a **pre-save hook**:
   ```js
   userSchema.pre('save', async function () {
       if (!this.isModified('password')) return;
       const salt = await bcrypt.genSalt(10);
       this.password = await bcrypt.hash(this.password, salt);
   });
   ```
4. The plain password is **never stored**. Only the bcrypt hash goes into MongoDB.

> **VIVA Q:** "Why do you hash passwords? Why not encrypt them?"  
> **A:** Hashing is one-way — you can't reverse it to get the original password. Encryption is two-way, so if someone gets the key they can decrypt all passwords. Bcrypt also includes a salt to prevent rainbow-table attacks.

---

## 4. Login Flow — Step by Step

```
Browser                          Server                          MongoDB
  |                                |                                |
  |-- POST /api/auth/login ------->|                                |
  |   { email, password }          |                                |
  |                                |-- findOne({ email }) --------->|
  |                                |<-- user document (with hash) --|
  |                                |                                |
  |                                |-- user.comparePassword(pwd)    |
  |                                |   bcrypt.compare(plain, hash)  |
  |                                |   returns true / false         |
  |                                |                                |
  |                                |-- if match: generateToken()    |
  |                                |-- if no match: 400 error       |
  |                                |                                |
  |<-- 200 { token, user } --------|                                |
  |                                |                                |
  | Save token & user to           |                                |
  | localStorage, redirect to '/'  |                                |
```

### Why the same error message for "user not found" and "wrong password"?

Both return `"Invalid credentials"`. This prevents **user enumeration** — an attacker can't tell whether an email is registered or not.

---

## 5. How Protected Routes Work (the `protect` middleware)

When the frontend wants to access something that requires login (e.g. create a resource, view profile), it sends the token in the HTTP header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Here's what the `protect` middleware does:

```
Request arrives
     |
     v
Does the Authorization header exist and start with "Bearer"?
     |                        |
    YES                       NO
     |                        |
     v                        v
Extract token after "Bearer " Return 401 "no token"
     |
     v
jwt.verify(token, JWT_SECRET)
     |                        |
  SUCCESS                   FAIL (expired / tampered)
     |                        |
     v                        v
decoded = { id, role }     Return 401 "token failed"
     |
     v
User.findById(decoded.id).select('-password')
     |
     v
Attach user to req.user
     |
     v
next() → controller runs
```

### The actual code:

```js
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        return next();
    }
    return res.status(401).json({ error: 'Not authorized, no token' });
};
```

> **VIVA Q:** "Why do you use `.select('-password')` when fetching the user?"  
> **A:** Because `req.user` is used throughout the app. We exclude the password hash so it never accidentally gets sent back in a response.

---

## 6. User Roles & the `admin` Middleware

### How roles are defined

In the User model:

```js
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
}
```

- Every new user gets `role: 'user'` by default.
- Admin role is assigned manually in the database (there's no public "make me admin" route).

### How admin-only access works

The `admin` middleware runs **after** `protect`:

```js
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};
```

Route example: `router.delete('/:id', protect, admin, deleteResource)`  
This means: first verify the JWT (`protect`), then check if the user is admin (`admin`), then run the controller.

> **VIVA Q:** "What's the difference between 401 and 403?"  
> **A:** 401 means "not authenticated" (who are you?). 403 means "not authorized" (I know who you are, but you don't have permission).

---

## 7. Frontend Auth State (`Auth` module in auth.js)

The `Auth` module is an IIFE (Immediately Invoked Function Expression) that exposes these functions:

| Function | Purpose |
|----------|---------|
| `getToken()` | Reads `drm-token` from localStorage |
| `getUser()` | Reads & parses `drm-user` from localStorage |
| `saveAuth(token, user)` | Stores both after login/register |
| `clearAuth()` | Removes both (logout) |
| `isLoggedIn()` | Returns `true` if a token exists |
| `isAdmin()` | Returns `true` if stored user has `role: 'admin'` |
| `authHeaders()` | Returns `{ Authorization: 'Bearer <token>' }` for fetch calls |
| `logout()` | Clears storage + redirects to `/login.html` |
| `handleUnauthorized(res)` | If response is 401, auto-logout |
| `requireAuth()` | Redirects to login if not logged in |
| `updateNavbar()` | Shows login/register links or user menu based on auth state |

### Token lifecycle on the frontend

1. **Login/Register** → `Auth.saveAuth(token, user)` → stored in localStorage.
2. **Every API call** → `Auth.authHeaders()` adds Bearer token to request.
3. **401 response** → `Auth.handleUnauthorized()` clears token, redirects to login.
4. **Logout click** → `Auth.logout()` clears token, redirects to login.
5. **Token expires** (after 30 days) → next API call gets 401 → auto-logout.

---

## 8. Security Features Summary

| Feature | Implementation | Why |
|---------|---------------|-----|
| Password hashing | bcrypt with salt rounds = 10 | Passwords can't be reversed if DB is leaked |
| JWT signature | HMAC-SHA256 with server secret | Token can't be forged without the secret |
| Token expiry | 30 days | Limits damage if token is stolen |
| No password in responses | `.select('-password')` | Hash never leaves the server |
| Same error for login failures | "Invalid credentials" for both cases | Prevents email enumeration |
| Input validation | express-validator on routes | Rejects malformed data before it reaches the controller |
| XSS prevention | `escapeHtml()` in frontend | User content is escaped before rendering |

---

## 9. Common VIVA Questions & Answers

**Q: What is JWT and why did you use it instead of sessions?**  
A: JWT is a stateless authentication token. Unlike sessions, the server doesn't need to store anything — all information is encoded in the token itself. This makes it simpler for our REST API and works well with localStorage on the frontend.

**Q: Where is the JWT secret stored?**  
A: In the `.env` file as `JWT_SECRET`. It is never committed to version control. The server reads it via `process.env.JWT_SECRET`.

**Q: What happens when the token expires?**  
A: The `jwt.verify()` call in the protect middleware will throw a `TokenExpiredError`. The server responds with 401. The frontend catches this and redirects the user to the login page.

**Q: Can a user change their role to admin by modifying the JWT?**  
A: No. If they change the payload, the signature won't match because they don't have the JWT_SECRET. The server will reject the modified token.

**Q: What is bcrypt salt and why is it needed?**  
A: A salt is a random value added to the password before hashing. It ensures that two users with the same password get different hashes. This prevents pre-computed dictionary (rainbow table) attacks.

**Q: What happens if localStorage is cleared?**  
A: The user will be treated as logged out. The token is gone from the browser, so no API calls can be authenticated. They need to log in again.

**Q: How do you protect routes that only admins should access?**  
A: We chain two middlewares — first `protect` (verifies JWT and attaches user), then `admin` (checks `req.user.role === 'admin'`). If either fails, the request is rejected.

**Q: What is the `Authorization: Bearer` header format?**  
A: It's an HTTP standard. The word "Bearer" indicates that whoever "bears" (carries) this token should be granted access. The actual token follows after a space.

---

## 10. Quick Code Reference

| File | What it does |
|------|-------------|
| `models/User.js` | Defines User schema, bcrypt pre-save hook, `comparePassword` method |
| `controllers/authController.js` | `registerUser`, `loginUser`, `getProfile`, `updateProfile`, `changePassword` |
| `middlewares/authMiddleware.js` | `protect` (JWT verification), `admin` (role check) |
| `routes/authRoutes.js` | Maps HTTP routes to controller functions with validation |
| `public/js/auth.js` | Frontend auth module — token storage, headers, logout, navbar |
| `public/js/login.js` | Login form handler — sends credentials, saves token |
| `public/js/register.js` | Register form handler — sends data, saves token |
