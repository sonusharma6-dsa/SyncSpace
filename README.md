# 🚀 SyncSpace

A production-ready, real-time collaboration web application built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) featuring offline-first capabilities.

## ✨ Features

- **Real-Time Multi-User Collaboration** — Multiple users edit documents and tasks simultaneously with live cursor presence
- **Offline-First Functionality** — Full offline support via Service Worker + IndexedDB; auto-syncs on reconnect
- **Automatic Saving** — Every keystroke auto-saved with 500ms debounce; zero data loss
- **Unified Team Workspace** — Document editor + Kanban task board + team presence in one dashboard
- **JWT Authentication** — Secure HTTP-only cookie based auth with refresh tokens
- **Role-Based Access** — Owner, Editor, Viewer roles per workspace
- **Invite System** — Join workspaces via unique 6-character alphanumeric invite codes
- **Conflict Resolution** — ConflictModal with diff view for simultaneous offline edits

## 📋 Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm v9+

## 🛠 Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd SyncSpace

# 2. Install server dependencies
cd server
npm install

# 3. Install client dependencies
cd ../client
npm install

# 4. Configure environment variables
cd ..
cp .env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secrets

# 5. Start MongoDB (if running locally)
mongod

# 6. Start the backend server (from /server)
cd server
npm run dev

# 7. Start the frontend (from /client, in a new terminal)
cd client
npm start
```

The app will be available at **http://localhost:3000**, API at **http://localhost:5000**.

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React)                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Auth Pages│  │  Dashboard   │  │   WorkspacePage      │  │
│  │Login/    │  │Create/Join   │  │ Editor + KanbanBoard │  │
│  │Signup    │  │Workspaces    │  │ + Sidebar + Presence │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                              │
│  ┌──────────────────┐   ┌────────────────────────────────┐  │
│  │  Service Worker  │   │         IndexedDB              │  │
│  │  (cache-first)   │   │  pending_edits | cached_docs  │  │
│  └──────────────────┘   │  pending_tasks                │  │
│                          └────────────────────────────────┘  │
└─────────────────────────┬───────────────────┬───────────────┘
                          │ REST API          │ Socket.io
                          ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js / Express Server                   │
│  ┌────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │Auth Routes │  │Workspace/Doc    │  │  Socket.io      │  │
│  │JWT Cookies │  │Task Routes      │  │  Room-based     │  │
│  └────────────┘  └─────────────────┘  │  Broadcasting   │  │
│                                        └─────────────────┘  │
└────────────────────────────────┬────────────────────────────┘
                                 │ Mongoose ODM
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                         MongoDB                              │
│  Users | Workspaces | Documents (+ history) | Tasks         │
└─────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoint Reference

### Auth (`/api/auth`)

| Method | Endpoint        | Description              | Auth Required |
|--------|-----------------|--------------------------|---------------|
| POST   | `/signup`       | Register new user        | No            |
| POST   | `/login`        | Login, set JWT cookie    | No            |
| POST   | `/logout`       | Clear JWT cookies        | No            |
| GET    | `/me`           | Get current user         | Yes           |
| POST   | `/refresh`      | Refresh JWT token        | No (cookie)   |

### Workspaces (`/api/workspaces`)

| Method | Endpoint        | Description                    | Auth Required |
|--------|-----------------|--------------------------------|---------------|
| POST   | `/`             | Create new workspace           | Yes           |
| GET    | `/`             | Get all user workspaces        | Yes           |
| POST   | `/join`         | Join workspace by invite code  | Yes           |
| GET    | `/:id`          | Get workspace details          | Yes           |
| DELETE | `/:id`          | Delete workspace (owner only)  | Yes           |

### Documents (`/api/workspaces/:id/documents`)

| Method | Endpoint          | Description              | Auth Required |
|--------|-------------------|--------------------------|---------------|
| POST   | `/`               | Create document          | Yes           |
| GET    | `/`               | List all documents       | Yes           |
| GET    | `/:docId`         | Get single document      | Yes           |
| PUT    | `/:docId`         | Update document content  | Yes (editor+) |
| DELETE | `/:docId`         | Delete document          | Yes (editor+) |

### Tasks (`/api/workspaces/:id/tasks`)

| Method | Endpoint          | Description              | Auth Required |
|--------|-------------------|--------------------------|---------------|
| POST   | `/`               | Create task              | Yes           |
| GET    | `/`               | Get all tasks            | Yes           |
| PUT    | `/:taskId`        | Update task              | Yes (editor+) |
| DELETE | `/:taskId`        | Delete task              | Yes (editor+) |

## ⚡ Socket.io Events

### Client Emits

| Event              | Payload                                          | Description               |
|--------------------|--------------------------------------------------|---------------------------|
| `join:workspace`   | `{ workspaceId }`                               | Join workspace room       |
| `document:edit`    | `{ docId, content, userId, workspaceId, timestamp }` | Broadcast edit       |
| `task:update`      | `{ taskId, status, workspaceId, task }`         | Broadcast task change     |
| `cursor:move`      | `{ docId, position, userId, workspaceId, name }` | Broadcast cursor position |

### Server Broadcasts (to room)

| Event              | Payload                                          | Description               |
|--------------------|--------------------------------------------------|---------------------------|
| `document:updated` | `{ docId, content, editedBy, timestamp }`       | Live document sync        |
| `task:updated`     | `{ taskId, newStatus, updatedBy, task }`        | Live task sync            |
| `cursor:updated`   | `{ userId, position, name }`                    | Cursor presence           |
| `user:joined`      | `{ userId, name }`                              | User presence             |
| `user:left`        | `{ userId, name }`                              | User left workspace       |

## 📴 Offline Sync Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      ONLINE STATE                            │
│  User edits → 500ms debounce → REST API + Socket.io emit    │
└──────────────────────────────────────────────────────────────┘
                           ↓ disconnect
┌──────────────────────────────────────────────────────────────┐
│                     OFFLINE STATE                            │
│  User edits → saveDocEdit() → IndexedDB pending_edits       │
│  User moves tasks → saveTaskUpdate() → IndexedDB            │
│  OfflineBanner visible → red banner slides down             │
└──────────────────────────────────────────────────────────────┘
                           ↓ reconnect
┌──────────────────────────────────────────────────────────────┐
│                    RECONNECT SYNC                            │
│  window 'online' event fires in React                       │
│  → syncPendingEdits(workspaceId) reads IndexedDB            │
│  → Sorts by timestamp (oldest first)                        │
│  → Conflict check: if 2 edits within 2s → ConflictModal     │
│  → Else Last-Write-Wins → PUT /api/workspaces/:id/docs/:id  │
│  → Mark as synced:true in IndexedDB                         │
│  → Emit document:edit via Socket.io to notify others        │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
syncspace/
├── client/                        ← React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── service-worker.js      ← PWA cache-first SW
│   └── src/
│       ├── components/
│       │   ├── Editor/            DocumentEditor, CursorPresence
│       │   ├── Tasks/             KanbanBoard, TaskCard
│       │   ├── Workspace/         Sidebar, InviteModal
│       │   └── UI/                OfflineBanner, StatusBadge,
│       │                          ProtectedRoute, ConflictModal
│       ├── pages/                 Login, Signup, Dashboard, WorkspacePage
│       ├── hooks/                 useSocket, useOffline, useDebounce
│       ├── context/               AuthContext, WorkspaceContext
│       └── utils/                 indexedDB.js, syncQueue.js
│
├── server/                        ← Node/Express Backend
│   ├── routes/                    auth, workspace, document, task
│   ├── controllers/               auth, workspace, document, task
│   ├── models/                    User, Workspace, Document, Task
│   ├── middleware/                auth, error
│   ├── socket/                    socket.handler.js
│   └── index.js
│
├── .env.example
└── README.md
```

## ⚠️ Known Limitations & Future Roadmap

### Current Limitations
- Document editor is plain-text only (no rich text formatting)
- Cursor presence uses basic x/y coordinates, not character-level tracking
- No rate limiting or CSRF protection (add `express-rate-limit` + `helmet` for production)
- Service worker caches static filenames from CRA build output (may need update after eject)

### Future Roadmap
- [ ] Rich text editor (Quill.js or ProseMirror) with operational transforms
- [ ] Real-time comments and inline annotations
- [ ] File attachments and image embedding
- [ ] Email notifications for workspace activity
- [ ] Full-text document search
- [ ] Workspace analytics dashboard
- [ ] Mobile app (React Native)
- [ ] E2E encryption for sensitive documents

## 🔐 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_very_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## 📄 License

MIT