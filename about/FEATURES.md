# SyncSpace — Feature Reference Sheet

## 🔐 Authentication & User Management

| Feature | Details |
|---|---|
| Sign Up | Name + Email + Password (min 6 chars), bcrypt-hashed |
| Sign In | Returns JWT as HttpOnly cookie (7-day) |
| Sign Out | Cookie cleared, client state reset |
| Protected Routes | Unauthenticated users redirected to `/login` |
| Persistent Sessions | Cookie survives page refresh |

---

## 🏢 Workspace

| Feature | Details |
|---|---|
| Create Workspace | Any authenticated user; generates unique 6-char invite code |
| Join Workspace | Enter invite code → added as "editor" |
| Roles | `owner` / `editor` / `viewer` |
| Invite Code | Shown on workspace card (dashboard) and in Invite Modal |
| Member List | In sidebar; shows name and role for each member |
| Member Avatars | Top bar shows up to 5 member initials |
| Delete Workspace | Owner only; cascades to member records |
| Workspace Limit | No enforced limit |

---

## 📄 Document Editor

| Feature | Details |
|---|---|
| Multiple Documents | Create as many as needed per workspace |
| Rename Documents | Click title, type, change saved immediately |
| Real-time Co-editing | All editors see changes within ~100 ms via Socket.IO |
| Live Cursor Tracking | Other users' cursor positions shown as coloured overlays |
| Auto-Save | Debounced, triggers 500 ms after last keystroke |
| Save Status Indicator | Shows "⏳ Saving…" / "✓ Saved" |
| Conflict Detection | 2-second window: modal prompts "Keep mine" / "Keep theirs" |
| Offline Editing | Changes buffered in IndexedDB, flushed on reconnect |
| Document Cache | Last-known content stored in IndexedDB for offline read |

---

## 📋 Kanban Task Board

| Feature | Details |
|---|---|
| Columns | **To Do** · **In Progress** · **Done** |
| Add Task | Inline form per column; Enter = save, Escape = cancel |
| Drag & Drop | Native HTML5 drag API; visual dashed border on hover column |
| Delete Task | Button on each card |
| Optimistic UI | State updated immediately; reverted on API error |
| Real-time Sync | Task moves broadcast to all workspace members |
| Offline Queue | Status changes stored in IndexedDB, synced on reconnect |
| Task Counter | Badge on each column header |
| Task Fields | Title, description, assignee, due date, created by, timestamp |

---

## 📎 File Upload & Sharing

| Feature | Details |
|---|---|
| Upload | Max 10 MB; MIME allowlist enforced server-side |
| Allowed Types | JPEG, PNG, GIF, WebP, PDF, TXT, CSV, DOC, DOCX, XLS, XLSX, ZIP |
| File Icons | Emoji icons mapped to MIME type (🖼️ 📕 📝 🗜️ 📊 📎) |
| File Size Display | Human-readable (B / KB / MB) |
| Download | Auth-gated; Content-Disposition attachment header |
| Delete | Uploader or workspace owner; physically removed from disk |
| Permission | Viewers blocked from uploading |
| Real-time Broadcast | `file:uploaded` Socket event keeps all lists in sync |
| Security | `path.basename()` prevents path traversal; DB filename used for I/O |
| Storage | `server/uploads/` directory; ignored by git |

---

## 🔔 Notifications

| Feature | Details |
|---|---|
| Delivery | Socket.IO personal room (`user:{id}`) for instant delivery |
| Storage | Persisted in MongoDB `notifications` collection |
| History | Latest 50 per user |
| Types | `file_uploaded` · `task_created` · `task_updated` · `user_joined` |
| Triggers | File upload, task create, workspace join |
| Bell Icon | 🔔 in top bar; red badge with unread count |
| Dropdown | Click bell → shows list with icon, message, timestamp |
| Mark Read | Click individual item to mark read; "Mark all read" button |
| Unread Highlight | Unread items shown with purple background + dot |

---

## 🌐 Offline / PWA

| Feature | Details |
|---|---|
| Service Worker | Caches static assets; stale-while-revalidate for non-API GET |
| Offline Detection | `useOffline` hook via `window` online/offline events |
| Offline Banner | Yellow `OfflineBanner` component across full width when offline |
| Status Badge | 🟢 Online / 🔴 Offline badge in header and sidebar |
| Pending Doc Edits | Stored in IndexedDB `pending_edits` store |
| Pending Task Moves | Stored in IndexedDB `pending_tasks` store |
| Auto Sync | `syncPendingEdits` + `syncPendingTasks` run on reconnect |
| Cached Docs | Last document content cached for offline read-only access |

---

## 🔒 Security

| Measure | Implementation |
|---|---|
| Password storage | bcrypt, 12 salt rounds |
| Session tokens | JWT in HttpOnly cookie (not accessible to JS) |
| API rate limiting | `express-rate-limit`: auth 20 req/15 min, API 200 req/min |
| CSRF protection | Origin/Referer header verified on all state-changing requests |
| NoSQL injection | Input type-checking before DB queries |
| File type control | Server-side MIME type allowlist in `multer` `fileFilter` |
| Path traversal | `path.basename()` + only DB-stored filenames used on disk |
| Access control | Workspace membership checked on every resource endpoint |
| Role enforcement | Viewer upload blocked; file delete restricted to owner/uploader |
| Socket auth | JWT verified on every Socket.IO connection |

---

## 🗄️ REST API Summary

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/workspaces
POST   /api/workspaces
POST   /api/workspaces/join
GET    /api/workspaces/:id
DELETE /api/workspaces/:id

GET    /api/workspaces/:id/documents
POST   /api/workspaces/:id/documents
PUT    /api/workspaces/:id/documents/:docId
DELETE /api/workspaces/:id/documents/:docId

GET    /api/workspaces/:id/tasks
POST   /api/workspaces/:id/tasks
PUT    /api/workspaces/:id/tasks/:taskId
DELETE /api/workspaces/:id/tasks/:taskId

GET    /api/workspaces/:id/files
POST   /api/workspaces/:id/files        (multipart, field: "file")
DELETE /api/workspaces/:id/files/:fileId
GET    /api/workspaces/serve/:filename

GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

GET    /api/health
```

---

## 📡 Socket.IO Events

```
Client emits:
  join:workspace    { workspaceId }
  document:edit     { docId, content, workspaceId, timestamp }
  task:update       { taskId, status, workspaceId, task }
  cursor:move       { docId, position, workspaceId }

Server emits (workspace room):
  user:joined       { userId, name }
  user:left         { userId, name }
  document:updated  { docId, content, editedBy, timestamp }
  task:updated      { taskId, newStatus, updatedBy, task }
  cursor:updated    { userId, position, name }
  file:uploaded     { file }

Server emits (personal room user:{id}):
  notification:new  { _id, type, message, workspace, read, createdAt }
```
