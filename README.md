# 📚 Developer Resource Manager (DRM)

A full-stack web application built with **Node.js, Express, MongoDB, and EJS** that allows developers to store, manage, categorize, and search learning resources such as DSA sheets, backend tutorials, DevOps documentation, and AI research papers.

---

## 🚀 Features

- **Full CRUD Operations** – Create, Read, Update, and Delete resources
- **Category-based Filtering** – Filter by DSA, Backend, DevOps, or AI
- **Difficulty Filtering** – Filter by Beginner, Intermediate, or Advanced
- **Keyword Search** – Case-insensitive search by resource title
- **Rating System** – Rate resources from 0 to 5 stars
- **Tagging** – Add comma-separated tags to organize resources
- **Form Validation** – Server-side validation with user-friendly error messages
- **Request Logging** – Logs every HTTP request with method, URL, and timestamp
- **Centralized Error Handling** – Clean error pages for all failure scenarios
- **Responsive UI** – Clean, minimalist design that works on all screen sizes

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express.js | Web application framework |
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Mongoose | MongoDB object data modeling (ODM) |
| EJS + ejs-mate | Server-side templating with layout support |
| dotenv | Environment variable management |
| method-override | HTTP method support (PUT/DELETE) in forms |
| nodemon | Auto-restart during development |

---

## 📁 Project Structure

```
DRM/
├── controllers/
│   └── resourceController.js   # CRUD business logic
├── middlewares/
│   ├── logger.js               # Request logging middleware
│   ├── errorHandler.js         # Centralized error handling
│   └── validateResource.js     # Form validation middleware
├── models/
│   └── Resource.js             # Mongoose schema & model
├── routes/
│   └── resourceRoutes.js       # Express route definitions
├── views/
│   ├── layout.ejs              # Base HTML layout
│   ├── index.ejs               # Resource listing page
│   ├── add.ejs                 # Add resource form
│   ├── edit.ejs                # Edit resource form
│   ├── details.ejs             # Resource detail view
│   └── error.ejs               # Error page
├── public/
│   └── css/
│       └── style.css           # Application styles
├── server.js                   # Application entry point
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables
└── .gitignore                  # Git ignore rules
```

---

## ⚙️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yadav-Anurag24/dev-resource-manager.git
   cd developer-resource-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/developer-resource-manager?retryWrites=true&w=majority
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Development (with auto-restart)
   npm run dev

   # Production
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📡 Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/resources` | List all resources (with filtering & search) |
| `GET` | `/resources/new` | Render add resource form |
| `POST` | `/resources` | Create a new resource |
| `GET` | `/resources/:id` | View resource details |
| `GET` | `/resources/:id/edit` | Render edit resource form |
| `PUT` | `/resources/:id` | Update a resource |
| `DELETE` | `/resources/:id` | Delete a resource |

### Filtering & Search Examples

```
GET /resources?category=DSA
GET /resources?difficulty=Beginner
GET /resources?search=graph
GET /resources?category=Backend&difficulty=Advanced
```

---

## 📋 Resource Schema

| Field | Type | Constraints |
|---|---|---|
| `title` | String | Required, 3–150 chars, trimmed |
| `description` | String | Required, min 10 chars |
| `category` | String | Enum: DSA, Backend, DevOps, AI |
| `difficulty` | String | Enum: Beginner, Intermediate, Advanced |
| `link` | String | Required |
| `tags` | [String] | Optional, array of tags |
| `rating` | Number | 0–5, default: 0 |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated (timestamps) |

---

## 🏗️ Architecture

This project follows the **MVC (Model-View-Controller)** pattern:

- **Model** – Mongoose schema with built-in validation
- **View** – EJS templates with layout support
- **Controller** – Async request handlers with error forwarding
- **Middleware** – Logger, validator, and centralized error handler

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `npm start` | Start the server |
| `dev` | `npm run dev` | Start with nodemon (auto-restart) |

---

## 🔮 Phase 2 Roadmap

- [ ] JWT-based Authentication (Register/Login)
- [ ] Role-based Authorization (Admin vs User)
- [ ] REST API endpoints (`/api/resources`)
- [ ] Analytics Dashboard with MongoDB Aggregation
- [ ] Advanced Search (tag-based filtering, sorting, pagination)
- [ ] Deployment to Render/Railway

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.
