# TaskFlow

TaskFlow is a Jira-lite kanban board application for managing tasks across boards with realtime collaboration. Built with React, TypeScript, and Supabase (Postgres, Auth, Realtime, Storage).

## Live demo

- **Deployed app:** https://taskflow-mauve-one-63.vercel.app/login
- **Repository:** https://github.com/Matthhe/taskflow

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Matthhe/taskflow
cd taskflow
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full contents of `schema.sql` from this repo. It creates all tables, RLS policies, helper functions, triggers, the `create_board_with_defaults` RPC, and the `task-attachments` storage bucket with its policies.
3. Go to **Database → Replication** and confirm `tasks`, `columns`, and `activity_log` are enabled for Realtime (the schema script also does this via `alter publication supabase_realtime add table ...`, but it's worth double-checking in the UI).
4. (Optional) Enable **Google OAuth**: go to **Authentication → Providers → Google**, add your Google Cloud OAuth Client ID/Secret, and copy the **Callback URL** shown there into your Google Cloud Console project under **Authorized redirect URIs**.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings (Settings → API).

### 4. Run

```bash
npm run dev
```

## Tech stack

| Category | Technology |
|---|---|
| Framework | React 18+ (Vite) |
| Language | TypeScript |
| Backend / DB | Supabase (Postgres, Auth, Realtime, Storage) |
| Styling | MUI (Material UI) |
| Drag & Drop | @dnd-kit |
| Routing | React Router v6 |
| State management | React Query + Context API |

## Database & security notes

- All tables have Row Level Security enabled; every read/write is enforced by Postgres policies, not just hidden in the UI (see `schema.sql`).
- **RLS policy model:**
  - `boards` — a user can select rows where they are the owner or a member (via `board_members`); only the owner can insert/update/delete.
  - `board_members` — a user can always see their own membership row; only the board owner can insert new members or remove existing ones.
  - `columns` — any board member can select; only the owner can insert/update/delete.
  - `tasks` — any board member can select/update (this is what lets `member` view + edit tasks); only the owner can insert/delete.
  - `comments` — any board member can select/insert their own comment; a comment can be deleted by its author or the board owner.
  - `task_attachments` — any board member can select/insert; only the uploader can delete.
  - `activity_log` — any board member can select; there is no direct insert policy for regular clients, rows are only ever written by `SECURITY DEFINER` triggers.
  - `profiles` — readable by any authenticated user (needed to show names/avatars across the app), but a user can only update their own row.
- `member` role can view and edit tasks (including drag-and-drop) but cannot create/delete tasks or columns, invite/remove members, or delete the board — enforced both by RLS and mirrored in the UI via a single `getBoardPermissions` source of truth.
- Board creation (board + owner membership + 3 default columns) runs atomically through the `create_board_with_defaults` Postgres function, avoiding partially-created boards.
- Activity log entries for task creation, deletion, moves, and column deletion are written by database triggers, not by the client, so they can't be forged or lost due to a client-side error.

## Implemented levels

### Level 1 — MVP 
- Email/password authentication, protected routes
- Boards: list, create, delete, open
- Columns: create, rename, delete, 3 default columns on board creation
- Tasks: create, delete, drag-and-drop between columns, reordering within a column
- Responsive UI, loading states, error handling with toast notifications

### Level 2 — Full functionality 
- **Task details** — modal with title, description, priority, due date, and assignee (selected from board members)
- **Comments** — add/delete comments on tasks, with author and timestamp
- **Realtime** — live updates via Supabase Realtime on `tasks` and `columns` tables (no reload needed)
- **Shared access** — invite registered users to a board by email, owner/member roles, member management
- **User profile** — name and avatar (via URL), shown on task cards and comments

### Level 3 — Bonus 
- Task filtering by priority, assignee, and deadline, plus search by title/description
- Server-side activity log (e.g. "moved a task")
- File attachments on tasks via Supabase Storage (with MIME/size validation and orphan cleanup)
- Dark mode
- Google OAuth sign-in
- Hotkeys — `N` to create a task in the first column, `Esc` to close dialogs (native MUI behavior)

## Testing

Run the test suite:

```bash
npm test
```

Covered by unit/integration tests (Vitest):
- Permission rules (`getBoardPermissions`)
- Task reordering and cross-column move logic
- Task filtering (search, priority, assignee, deadline)
- File attachment validation (size limit, MIME allowlist, filename sanitization)
- Board creation flow, via a mocked Supabase RPC call

Not covered (would require a dedicated test Supabase project and/or a browser automation tool, out of scope for this submission):
- RLS policy tests against a live Postgres instance
- End-to-end smoke test (login → create board → create task → drag)

## What I'd improve with more time

- Invitations for users who aren't registered yet (currently only registered users with an existing profile can be invited)
- Server-side activity logging for column create/rename (currently only task events and column deletion go through DB triggers)
- Smoother drag-and-drop visuals using `DragOverlay` from `@dnd-kit`
- RLS policy tests and an end-to-end smoke test (see Testing section above)