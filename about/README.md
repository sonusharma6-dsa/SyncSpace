# 🚀 SyncSpace — Project Documentation

> **Real-time collaborative workspace platform** — documents, tasks, files, and notifications, all in sync.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Pages & Screens](#pages--screens)
6. [API Reference](#api-reference)
7. [Socket Events](#socket-events)
8. [Data Models](#data-models)
9. [Security](#security)
10. [Offline Support (PWA)](#offline-support-pwa)
11. [Setup & Running Locally](#setup--running-locally)
12. [Project Structure](#project-structure)

---

## Overview

**SyncSpace** is a full-stack MERN (MongoDB, Express, React, Node.js) collaborative workspace application. Multiple team members can join the same workspace and collaborate in real time on:

- 📄 **Shared documents** with live cursor tracking
- 📋 **Kanban task boards** with drag-and-drop
- 📎 **File sharing** (upload, download, delete)
- 🔔 **Real-time notifications** for workspace activity
- 🟢 **Offline mode** — keep editing even without internet; changes sync when reconnected

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | LTS | Runtime |
| Express | ^4.18 | HTTP server / REST API |
| MongoDB | Atlas / Local | Database |
| Mongoose | ^7.6 | ODM |
| Socket.IO | ^4.6 | Real-time WebSocket events |
| Multer | ^2.1.1 | File upload handling |
| bcryptjs | ^2.4 | Password hashing |
| jsonwebtoken | ^9.0 | JWT authentication |
| express-rate-limit | ^8.3 | Rate limiting |
| dotenv | ^16.3 | Environment config |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | ^18.2 | UI framework |
| React Router DOM | ^6.20 | Client-side routing |
| Axios | ^1.6 | HTTP client |
| Socket.IO Client | ^4.6 | WebSocket client |
| IndexedDB (native) | — | Offline storage |
| Service Worker | — | PWA caching |

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Client               │
│  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │  Pages   │  │Context │  │ Hooks  │  │
│  │ Login    │  │ Auth   │  │useSocket│ │
│  │ Signup   │  │Workspace│ │useOffline│ │
│  │Dashboard │  └────────┘  │useDebounce│ │
│  │Workspace │              └────────┘  │
│  └──────────┘                          │
│  ┌─────────────────────────────────┐   │
│  │         Components              │   │
│  │ DocumentEditor  KanbanBoard     │   │
│  │ FileList        NotificationBell│   │
│  │ Sidebar         ConflictModal   │   │
│  └─────────────────────────────────┘   │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ IndexedDB    │  │ Service Worker │  │
│  │ (offline     │  │ (PWA cache)    │  │
│  │  queue)      │  │                │  │
│  └──────────────┘  └────────────────┘  │
└────────────────┬────────────────────────┘
                 │  HTTP + WebSocket
┌────────────────▼────────────────────────┐
│           Node.js / Express             │
│  ┌──────────────────────────────────┐   │
│  │         REST API Routes          │   │
│  │ /api/auth     /api/workspaces    │   │
│  │ /api/notifications               │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │       Socket.IO Handler          │   │
│  │ Workspace rooms + User rooms     │   │
│  └──────────────────────────────────┘   │
│  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │  Auth  │  │ Error  │  │  Multer  │  │
│  │Middleware│ │Middleware│ │(uploads) │ │
│  └────────┘  └────────┘  └──────────┘  │
└────────────────┬────────────────────────┘
                 │  Mongoose ODM
┌────────────────▼────────────────────────┐
│              MongoDB                    │
│  Users  Workspaces  Documents           │
│  Tasks  Files       Notifications       │
└─────────────────────────────────────────┘
```

---

## Features

### 🔐 Authentication
- **Sign Up** — create account with name, email, password (bcrypt hashed, 12 rounds)
- **Sign In** — JWT issued as HttpOnly cookie (7-day expiry)
- **Sign Out** — cookie cleared server-side
- **Protected routes** — React `ProtectedRoute` component redirects unauthenticated users

### 🏢 Workspace Management
- **Create workspace** — generates unique 6-character alphanumeric invite code
- **Join workspace** — enter invite code to become a member with "editor" role
- **Workspace roles** — `owner` | `editor` | `viewer`
- **Member list** — see all workspace members and their roles
- **Invite modal** — share invite code with teammates
- **Delete workspace** — owner-only action

### 📄 Real-time Document Editor
- **Create / rename documents** — per workspace, unlimited documents
- **Live collaborative editing** — edits broadcast to all workspace members via Socket.IO
- **Cursor presence** — see other users' cursor positions in real time
- **Auto-save** — debounced 500 ms save on every keystroke
- **Conflict detection** — if two users edit simultaneously within 2 s, a modal lets you choose "keep mine" or "keep theirs"
- **Offline editing** — edits stored in IndexedDB and synced when back online

### 📋 Kanban Task Board
- **Three columns** — To Do · In Progress · Done
- **Create tasks** — inline form per column (Enter to submit, Escape to cancel)
- **Drag & drop** — drag cards between columns
- **Delete tasks** — remove with a click
- **Real-time sync** — status changes broadcast to all members via Socket.IO
- **Offline queue** — task moves queued in IndexedDB and synced on reconnect
- **Task metadata** — title, description, assignee, due date, creator, created timestamp

### 📎 File Upload & Sharing
- **Upload files** — up to 10 MB per file
- **Supported types** — images (JPEG, PNG, GIF, WebP), PDF, text/CSV, Word/Excel docs, ZIP
- **File list** — shown in workspace sidebar with type icon, size, and uploader name
- **Download** — authenticated download endpoint
- **Delete** — uploader or workspace owner can delete; physically removed from disk
- **Permission control** — viewers cannot upload
- **Real-time broadcast** — `file:uploaded` event keeps all members' file list in sync

### 🔔 Notifications
- **Real-time delivery** — via Socket.IO personal room (`user:{id}`)
- **Notification types**:
  - 📎 `file_uploaded` — someone uploaded a file
  - ✅ `task_created` — a new task was created
  - 🔄 `task_updated` — a task status changed
  - 👋 `user_joined` — a member joined the workspace
- **Bell icon** — in top bar with unread count badge
- **Dropdown** — lists latest 50 notifications with timestamps
- **Mark as read** — click individual notification or "Mark all read"

### 🌐 Offline / PWA Support
- **Service Worker** — caches static assets; stale-while-revalidate strategy
- **Offline banner** — `OfflineBanner` component shown when network is unavailable
- **Status badge** — green/red indicator in header and sidebar
- **IndexedDB queue** — pending document edits and task updates stored locally
- **Auto-sync** — `syncQueue` flushes pending changes when connection is restored

---

## Pages & Screens

### `/login`
Purple gradient background, centred card. Email + password fields. Links to sign-up.

### `/signup`
Same style as login. Name, email, password (min 6 chars).

### `/dashboard`
White header with logo and logout. Two-panel action area:
- **Create Workspace** form (left)
- **Join Workspace** form (right, 6-char uppercase invite code input)

Below: grid of workspace cards, each showing name, member count, and invite code badge.

### `/workspace/:id`
Three-panel layout:
- **Sidebar (240 px)** — workspace name, document list, file list, member list, invite button
- **Document Editor (60%)** — editable title, textarea with live cursors, save status
- **Kanban Task Board (40%)** — three drag-and-drop columns

**Top bar** — breadcrumb, member avatars, 🔔 notification bell, status badge, logout.

---

## API Reference

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Sign in, set cookie |
| POST | `/logout` | Clear cookie |
| GET | `/me` | Get current user |

### Workspaces — `/api/workspaces`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List my workspaces |
| POST | `/` | Create workspace |
| POST | `/join` | Join by invite code |
| GET | `/:id` | Get workspace details |
| DELETE | `/:id` | Delete workspace (owner) |

### Documents — `/api/workspaces/:id/documents`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List workspace documents |
| POST | `/` | Create document |
| PUT | `/:docId` | Update title / content |
| DELETE | `/:docId` | Delete document |

### Tasks — `/api/workspaces/:id/tasks`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List workspace tasks |
| POST | `/` | Create task |
| PUT | `/:taskId` | Update task |
| DELETE | `/:taskId` | Delete task |

### Files — `/api/workspaces/:id/files`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List workspace files |
| POST | `/` | Upload file (multipart/form-data, field: `file`) |
| DELETE | `/:fileId` | Delete file |
| GET | `/serve/:filename` | Download file (auth required) |

### Notifications — `/api/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get my notifications (latest 50) |
| PUT | `/:id/read` | Mark notification as read |
| PUT | `/read-all` | Mark all as read |

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join:workspace` | `{ workspaceId }` | Join workspace room |
| `document:edit` | `{ docId, content, workspaceId, timestamp }` | Broadcast edit |
| `task:update` | `{ taskId, status, workspaceId, task }` | Broadcast task change |
| `cursor:move` | `{ docId, position, workspaceId }` | Broadcast cursor position |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `user:joined` | `{ userId, name }` | Member joined workspace |
| `user:left` | `{ userId, name }` | Member left workspace |
| `document:updated` | `{ docId, content, editedBy, timestamp }` | Remote edit received |
| `task:updated` | `{ taskId, newStatus, updatedBy, task }` | Remote task update |
| `cursor:updated` | `{ userId, position, name }` | Remote cursor moved |
| `file:uploaded` | `{ file }` | New file uploaded |
| `notification:new` | `{ _id, type, message, workspace, read, createdAt }` | New notification |

---

## Data Models

### User
```
_id, name, email, password (hashed), workspaces[], createdAt
```

### Workspace
```
_id, name, inviteCode (6-char), owner, members[{user, role}],
documents[], tasks[], files[], createdAt
```

### Document
```
_id, title, content, workspace, createdBy, updatedAt, createdAt
```

### Task
```
_id, title, description, status (todo|in-progress|done),
assignee, workspace, createdBy, dueDate, createdAt
```

### File
```
_id, filename (disk), originalName, mimetype, size,
workspace, uploadedBy, createdAt
```

### Notification
```
_id, user, workspace, type (file_uploaded|task_created|task_updated|user_joined),
message, read (bool), createdAt
```

---

## Security

| Measure | Detail |
|---|---|
| Password hashing | bcrypt, 12 rounds |
| JWT auth | HttpOnly cookie, 7-day expiry |
| Rate limiting | Auth: 20 req / 15 min · API: 200 req / min |
| CSRF protection | Origin/Referer header check on POST/PUT/PATCH/DELETE |
| NoSQL injection | Input type-checking before DB queries |
| File type allowlist | Only safe MIME types accepted |
| File size limit | 10 MB max |
| Path traversal | `path.basename()` + DB-stored filenames used for disk I/O |
| Workspace access | Membership verified before every resource operation |
| Role enforcement | Viewers cannot upload; only owner/uploader can delete files |

---

## Offline Support (PWA)

```
User goes offline
       │
       ▼
OfflineBanner shown ──── Status badge turns red
       │
       ▼
Document edits ──► IndexedDB `pending_edits` queue
Task moves     ──► IndexedDB `pending_tasks` queue
       │
       ▼
User comes back online
       │
       ▼
syncQueue.syncPendingEdits() flushes to server
syncQueue.syncPendingTasks() flushes to server
       │
       ▼
StatusBadge turns green
```

---

## Setup & Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas URI)

### 1. Clone & Install
```bash
git clone <repo-url>
cd SyncSpace

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

### 2. Environment Variables
Copy `.env.example` to `server/.env` and fill in:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start Development Servers
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm start
```

Open **http://localhost:3000** in your browser.

### 4. Production Build
```bash
cd client && npm run build
```
Serve the `client/build` folder as static files via Express or a CDN.

---

## Project Structure

```
SyncSpace/
├── .env.example
├── README.md
├── about/                          ← This folder
│   ├── README.md                   ← Full documentation (you are here)
│   ├── FEATURES.md                 ← Feature reference sheet
│   └── presentation.html           ← Standalone PPT-style slide deck
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── service-worker.js       ← PWA service worker
│   └── src/
│       ├── App.js                  ← Router setup
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Dashboard.jsx
│       │   └── WorkspacePage.jsx   ← Main 3-panel layout
│       ├── components/
│       │   ├── Editor/
│       │   │   ├── DocumentEditor.jsx
│       │   │   └── CursorPresence.jsx
│       │   ├── Tasks/
│       │   │   ├── KanbanBoard.jsx
│       │   │   └── TaskCard.jsx
│       │   ├── UI/
│       │   │   ├── NotificationBell.jsx
│       │   │   ├── ConflictModal.jsx
│       │   │   ├── OfflineBanner.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── StatusBadge.jsx
│       │   └── Workspace/
│       │       ├── Sidebar.jsx
│       │       ├── FileList.jsx
│       │       └── InviteModal.jsx
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── WorkspaceContext.js
│       ├── hooks/
│       │   ├── useSocket.js
│       │   ├── useOffline.js
│       │   └── useDebounce.js
│       └── utils/
│           ├── indexedDB.js        ← Offline storage
│           └── syncQueue.js        ← Sync pending changes
└── server/
    ├── index.js                    ← Entry point, middleware, routes
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── workspace.controller.js
    │   ├── document.controller.js
    │   ├── task.controller.js
    │   ├── file.controller.js
    │   └── notification.controller.js
    ├── models/
    │   ├── User.model.js
    │   ├── Workspace.model.js
    │   ├── Document.model.js
    │   ├── Task.model.js
    │   ├── File.model.js
    │   └── Notification.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── workspace.routes.js
    │   ├── document.routes.js
    │   ├── task.routes.js
    │   ├── file.routes.js
    │   └── notification.routes.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   └── error.middleware.js
    ├── socket/
    │   └── socket.handler.js       ← All real-time event logic
    └── uploads/                    ← Uploaded files stored here
```
