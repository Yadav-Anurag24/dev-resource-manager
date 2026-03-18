# Developer Resource Manager (DRM)

A full-stack application built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB.

The frontend is now static pages in the public folder, and the backend exposes REST APIs under /api/resources.

## Features

- Full CRUD operations for learning resources
- Category and difficulty filtering
- Keyword search across title, description, and tags
- Resource rating support (0-5)
- Tag support (comma-separated input)
- Optional file upload for resources (PDF, DOC, DOCX, EPUB, TXT)
- Centralized validation and error handling
- Request logging middleware

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express.js | Backend framework and routing |
| MongoDB Atlas | Cloud NoSQL database |
| Mongoose | ODM for schemas and DB operations |
| Multer | File upload handling |
| HTML/CSS/JavaScript | Frontend UI and client-side logic |
| dotenv | Environment variables |
| nodemon | Auto-restart during development |

## Project Structure

```
DRM/
├── controllers/
│   └── resourceController.js
├── middlewares/
│   ├── errorHandler.js
│   ├── logger.js
│   ├── uploadResourceFile.js
│   └── validateResource.js
├── models/
│   └── Resource.js
├── public/
│   ├── add.html
│   ├── details.html
│   ├── edit.html
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── add.js
│       ├── details.js
│       ├── edit.js
│       ├── index.js
│       └── theme.js
├── routes/
│   └── resourceRoutes.js
├── uploads/
├── server.js
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

3. Configure environment variables in .env

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/developer-resource-manager?retryWrites=true&w=majority
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

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/resources | List resources with optional query filters |
| POST | /api/resources | Create resource (supports optional file upload) |
| GET | /api/resources/:id | Get one resource by id |
| PUT | /api/resources/:id | Update resource (supports optional file upload) |
| DELETE | /api/resources/:id | Delete resource |

### Query Filters

- category=DSA|Backend|DevOps|AI
- difficulty=Beginner|Intermediate|Advanced
- search=<keyword>

Examples:

```http
GET /api/resources?category=DSA
GET /api/resources?difficulty=Beginner
GET /api/resources?search=graph
```

## Frontend Routes

- /
- /index.html
- /add.html
- /edit.html?id=<resourceId>
- /details.html?id=<resourceId>

These pages use fetch() to call /api/resources and render data in the browser.

## Resource Schema

| Field | Type | Notes |
|---|---|---|
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

## Available Scripts

| Script | Command | Description |
|---|---|---|
| start | npm start | Start server |
| dev | npm run dev | Start with nodemon |

## Notes

- The server exposes uploads via /uploads static route.
- API responses are JSON with a success flag and data or error payload.
- Validation failures return HTTP 400 with detailed errors.

## License

ISC
