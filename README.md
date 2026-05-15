# NoteMesh

NoteMesh is a markdown-first personal knowledge app for fast capture, editing, search, and tag-based organization.

## MVP highlights

- Email/password authentication with cookie sessions
- Demo guest mode and protected app routes
- Fast notes dashboard with search, tags, archive, and trash
- Markdown editor with edit / preview / split modes
- Autosave, pin, duplicate, restore, share link, and attachment uploads
- Responsive light/dark/system themes with keyboard shortcuts
- Seed data, Docker setup, and self-hosted MongoDB architecture

## Package choices

### Client
- `react` / `react-dom` — app shell and component rendering
- `react-router-dom` — page routing
- `axios` — API calls with cookie credentials
- `react-markdown` + `remark-gfm` — markdown preview with tables/checklists
- `rehype-highlight` — syntax-highlighted code blocks
- `lucide-react` — polished iconography

### Server
- `express` — REST API
- `mongoose` — MongoDB models
- `jsonwebtoken` + `cookie-parser` — session cookies and refresh flow
- `bcryptjs` — password hashing
- `multer` — attachment uploads
- `express-rate-limit` + origin checks — basic hardening

## Folder structure

```text
SyncSpace/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Notes/
│   │   │   └── UI/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── Dockerfile
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/seed.js
│   ├── uploads/
│   ├── index.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Schema

### User
| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | required |
| `email` | String | unique, lowercase |
| `password` | String | hashed before save |
| `themePreference` | String | `light`, `dark`, or `system` |
| `lastLoginAt` | Date | optional |
| `createdAt` / `updatedAt` | Date | managed by Mongoose |

### Note
| Field | Type | Notes |
| --- | --- | --- |
| `user` | ObjectId | owner |
| `title` | String | defaults to `Untitled note` |
| `slug` | String | title slug |
| `content` | String | markdown body |
| `excerpt` | String | search/list preview |
| `tags` | String[] | normalized lowercase tags |
| `isPinned` | Boolean | quick access |
| `isArchived` | Boolean | archive lifecycle |
| `isDeleted` | Boolean | trash lifecycle |
| `isFavorite` | Boolean | reserved for future expansion |
| `deletedAt` | Date | soft delete timestamp |
| `lastEditedAt` | Date | editor metadata |
| `createdAt` / `updatedAt` | Date | managed by Mongoose |

### Tag
| Field | Type | Notes |
| --- | --- | --- |
| `user` | ObjectId | owner |
| `name` | String | unique per user |
| `color` | String | stable accent chip color |
| `noteCount` | Number | derived count |

### Attachment
| Field | Type | Notes |
| --- | --- | --- |
| `note` | ObjectId | owning note |
| `user` | ObjectId | owner |
| `fileName` | String | stored filename |
| `originalName` | String | upload label |
| `fileUrl` | String | download endpoint |
| `fileType` | String | mime type |
| `fileSize` | Number | bytes |
| `createdAt` / `updatedAt` | Date | managed by Mongoose |

### ShareLink
| Field | Type | Notes |
| --- | --- | --- |
| `note` | ObjectId | one active share link per note |
| `token` | String | public URL token |
| `isActive` | Boolean | enables/disables link |
| `expiresAt` | Date | optional expiry |
| `createdAt` / `updatedAt` | Date | managed by Mongoose |

## API routes

### Auth
| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | register and start session |
| `POST` | `/api/auth/login` | sign in |
| `POST` | `/api/auth/demo` | launch demo guest account |
| `POST` | `/api/auth/logout` | clear cookies |
| `GET` | `/api/auth/me` | current user |
| `POST` | `/api/auth/refresh` | refresh session |
| `POST` | `/api/auth/forgot-password` | placeholder reset request |
| `PATCH` | `/api/auth/preferences` | save theme preference |

### Notes
| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/notes` | list notes by status/search/tag/sort |
| `POST` | `/api/notes` | create a note |
| `GET` | `/api/notes/:id` | note detail + attachments + share state |
| `PATCH` | `/api/notes/:id` | autosave note changes |
| `DELETE` | `/api/notes/:id` | move note to trash |
| `POST` | `/api/notes/:id/restore` | restore from trash |
| `POST` | `/api/notes/:id/duplicate` | duplicate note |
| `POST` | `/api/notes/:id/share` | create/enable share link |
| `DELETE` | `/api/notes/:id/share` | disable share link |
| `GET` | `/api/notes/:id/attachments` | list attachments |
| `POST` | `/api/notes/:id/attachments` | upload attachment |
| `GET` | `/api/notes/:id/attachments/:attachmentId/download` | download attachment |
| `DELETE` | `/api/notes/:id/attachments/:attachmentId` | remove attachment |
| `GET` | `/api/tags` | tag suggestions |
| `GET` | `/api/shares/:token` | public shared note view |

## Reusable components

- `components/Auth/AuthShell` — shared auth layout and messaging
- `components/Notes/NoteSidebar` — search, tags, note list, navigation
- `components/Notes/NoteEditorPane` — toolbar, editor, preview, metadata, attachments
- `components/Notes/MarkdownPreview` — markdown rendering
- `components/Notes/CommandPalette` — keyboard command launcher
- `components/UI/ProtectedRoute` — auth gate
- `components/UI/ThemeToggle` — light/dark/system switcher
- `context/ToastContext` — toast notifications
- `context/ThemeContext` — persistent theme state
- `context/AuthContext` — auth/session state

## Page-by-page implementation

### `/login`
- email/password form
- demo mode CTA
- forgot password link
- polished product intro copy

### `/signup`
- account creation form
- same premium auth shell
- direct handoff into notes dashboard

### `/forgot-password`
- production-style reset request placeholder
- ready for future email integration

### `/dashboard`
- main notes workspace
- sidebar note index, search, tags, recent notes
- editor with live markdown preview
- create, save, pin, archive, duplicate, trash, share, attachment flows

### `/archive`
- same workspace shell filtered to archived notes

### `/trash`
- same workspace shell filtered to deleted notes with restore

### `/settings`
- theme preference management
- keyboard shortcut reference
- UI copy reference block

### `/share/:token`
- public read-only shared note page
- markdown rendering and SEO-friendly title

### `*`
- lightweight 404 page with recovery links

## Sample UI copy

- “Write clearly.”
- “A calmer place for markdown notes.”
- “No folders. No clutter. Just notes, tags, and momentum.”
- “Your ideas stay one search away.”
- “Trash keeps mistakes reversible, not permanent.”

## Local setup

### 1. Install dependencies
```bash
cd /home/runner/work/SyncSpace/SyncSpace/server && npm install
cd /home/runner/work/SyncSpace/SyncSpace/client && npm install
```

### 2. Configure environment
```bash
cd /home/runner/work/SyncSpace/SyncSpace
cp .env.example server/.env
```

### 3. Start MongoDB, seed demo data, and run the app
```bash
cd /home/runner/work/SyncSpace/SyncSpace/server
npm run seed
npm run dev

cd /home/runner/work/SyncSpace/SyncSpace/client
npm start
```

## Validation

```bash
cd /home/runner/work/SyncSpace/SyncSpace/client && npm run build
cd /home/runner/work/SyncSpace/SyncSpace/client && CI=true npm test -- --watchAll=false --passWithNoTests
cd /home/runner/work/SyncSpace/SyncSpace/server && node --check index.js && node --check controllers/auth.controller.js && node --check controllers/note.controller.js && node --check controllers/share.controller.js && node --check routes/auth.routes.js && node --check routes/note.routes.js && node --check routes/share.routes.js && node --check scripts/seed.js
```

## Docker

```bash
cd /home/runner/work/SyncSpace/SyncSpace
docker compose up --build
```

Services:
- `mongo` → MongoDB
- `server` → Express API on `http://localhost:5000`
- `client` → React app on `http://localhost:3000`

## Demo credentials

After running `npm run seed`:
- Email: `demo@notemesh.local`
- Password: `demopass123`

You can also use the **Try demo mode** button from the login page.
