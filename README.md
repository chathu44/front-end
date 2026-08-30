# Angular Template (Student Edition)

Angular 16 frontend paired with **SpringBoot-Template** (JWT + privilege groups + sample CRUD).

Use this as a **starting point** — students replace sample modules (Student, Course, Teacher, etc.) with their own project screens.

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
| Logout | `POST /logout` | (Bearer token) |
| Register | `POST /register` | `{ firstName, lastName, login, password }` |

Stored in browser:

- `localStorage.token` — JWT
- `localStorage.currentUser` — includes numeric **`id`**
- `localStorage.authIds` — from `GET /get-auth-ids/{id}`

Default seed user: **admin** / **password**

## Sample pages (copy these patterns)

| Route | Purpose |
|-------|---------|
| `/student` | CRUD list + form + permissions on buttons |
| `/course`, `/teacher`, `/qualification` | More CRUD examples |
| `/class` | Modal form + grid |
| `/privilege` | Assign privileges and users to groups |
| `/dashboard` | Summary / charts placeholder |

Rename components and services for the student’s domain (e.g. Hotel Booking, Pet Management).

## Privilege / button permissions

Use `PermissionHelperService` and `AuthIds` to show or hide Create / Update / Delete buttons. See `student.component.ts`.

## Config

`src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:8010'
```

## Notes

- User id is numeric **`id`** from JWT (not a serial string).
- Login field is **`login`** (not username/email).
- Copy one full module (service + component + backend entity) when adding a new feature.
