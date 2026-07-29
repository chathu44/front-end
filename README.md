# Angular Template (Student Edition) — Institute Web

Angular 16 frontend paired with **SpringBoot-Template** (JWT + privilege groups).

## Requirements

- Node.js 18+
- Backend running at `http://localhost:8010`

## Setup

```bash
npm install
npm start
```

App: `http://localhost:4200`

## Auth (matches Spring Boot)

| Action | Endpoint | Body |
|--------|----------|------|
| Login | `POST /login` | `{ login, password }` |
| Register | `POST /register` | `{ firstName, lastName, login, password }` |

Response stores:

- `localStorage.token` — JWT
- `localStorage.currentUser` — includes numeric **`id`**
- `localStorage.authIds` — from `GET /get-auth-ids/{id}`

Default seed user: **admin** / **password**

## Privilege page

Route: `/privilege`

- Create / soft-delete privilege groups
- Dual-list: privileges ↔ group
- Dual-list: users ↔ group (uses `app_user.id`)

## Config

`src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:8010'
```

## Notes for students

- User identity is numeric **`id`**, not a serial string
- Login field name is **`login`** (not username/email)
- Student/Teacher/Course CRUD still point at old `/api/v1/*` demo APIs — use them as UI practice, or rewire later to new backend endpoints
