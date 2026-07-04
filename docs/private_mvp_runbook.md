# Private MVP runbook

## Purpose

This runbook prepares Resummo for a controlled private MVP. With private access enabled, existing invited users can log in and restore their session, while public registration is blocked at the API boundary.

The flag is an access gate, not an invitation system. It does not create invitation records, send email, verify domains, or replace authentication and RBAC.

## Required environment

Copy `.env.example` to `.env` and replace placeholder values. Never commit `.env`.

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/resummo
NODE_ENV=development
PRIVATE_MVP_ACCESS=true
SHOW_DEMO_CREDENTIALS=false
```

- `PRIVATE_MVP_ACCESS=true` blocks `POST /api/auth/register` with HTTP 403.
- `PRIVATE_MVP_ACCESS=false` keeps the existing public registration flow available.
- `SHOW_DEMO_CREDENTIALS=true` exposes demo credentials in the Login UI only when `NODE_ENV=development`.
- In production, use `NODE_ENV=production`, `PRIVATE_MVP_ACCESS=true`, and `SHOW_DEMO_CREDENTIALS=false`.
- `/api/health` exposes only the non-sensitive booleans needed by the frontend. It never exposes secrets or credentials.

## Local setup

```powershell
npm.cmd install
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run db:seed
```

`db:seed` resets local seed-owned data before recreating demo, editor, and admin users. Do not run it against a database containing data that must be preserved.

Run API and client in separate PowerShell terminals:

```powershell
npm.cmd run dev:server
```

```powershell
npm.cmd run dev:client
```

## Validation

```powershell
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run lint
npm.cmd run build
node scripts/smoke-http-private-access.mjs
node scripts/smoke-http-admin.mjs
node scripts/smoke-http-qbank.mjs
node scripts/smoke-http-library.mjs
git diff --check
```

The private-access smoke verifies:

- safe flags are available through `/api/health`;
- registration returns 403 in private mode;
- seeded login and `/api/auth/me` continue to work;
- demo credentials are not exposed when `NODE_ENV=production`;
- public development mode creates a controlled smoke user and removes it before exit.

## Pre-demo checklist

- Confirm the target database contains only approved MVP accounts and content.
- Set a production-grade `JWT_SECRET`; never use the example value.
- Confirm `NODE_ENV=production`.
- Confirm `PRIVATE_MVP_ACCESS=true`.
- Confirm `SHOW_DEMO_CREDENTIALS=false`.
- Confirm `CORS_ORIGIN` matches the deployed frontend origin.
- Run the validation commands against the intended environment.
- Verify invited student, editor, and admin accounts can log in with their assigned roles.
- Verify the Registration tab is absent and the private invitation notice is visible.
- Verify `POST /api/auth/register` returns 403 without creating a user.
- Verify logs and screenshots do not expose credentials or tokens.

## Rollback

Set `PRIVATE_MVP_ACCESS=false` and restart the API to restore the existing public registration flow. No schema or data migration is involved.
