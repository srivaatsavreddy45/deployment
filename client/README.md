# Seva Sahayog Volunteer Experience Platform — Frontend

## Run

```bash
npm install
npm run dev
```

## Backend connection

Set `VITE_API_URL` in `.env`.

The frontend expects:

### POST `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password",
  "role": "volunteer"
}
```

### POST `/auth/register`

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "role": "volunteer",
  "company": ""
}
```

Expected successful response:

```json
{
  "user": {
    "id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "role": "volunteer"
  },
  "token": "..."
}
```

Roles used by the frontend:

- `volunteer`
- `corporate`
- `admin`

Admin registration is intentionally disabled in the UI. Admin accounts should be provisioned by Seva Sahayog.

## Local demo fallback

If the backend is not running, the login screen can still be demonstrated with:

- Volunteer: `volunteer@demo.com` / `volunteer123`
- Corporate SPOC: `corporate@demo.com` / `corporate123`
- Admin: `admin@demo.com` / `admin123`

These are frontend-only demo credentials and are not production credentials.
