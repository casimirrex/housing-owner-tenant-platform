# Housing Owner Tenant: GitHub Ready Copy

This folder is a clean deployment copy of your working project. It is separated from the live local app, so you can push this folder to a new GitHub repository without disturbing the code that is currently running on your machine.

## Folder structure

- `frontend/`
  - Next.js web application
  - Use this for Vercel, Netlify, Railway, Render, or Docker-based frontend deploys

- `backend/`
  - Spring Boot API
  - Use this for Render, Railway, Docker VM, or any Java hosting platform

- `database/`
  - `schema.sql`
  - `data.sql`
  - Use these if you want the database scripts in a separate folder for deployment or migration tracking

- `mobile/`
  - Optional mobile app package
  - Ignore this if you only want web deployment

- `docker-compose.yml`
  - Local Docker stack for Postgres and Redis

## Domain-based deployment mapping

Use separate domains like this:

```text
Frontend:
  https://web.rentandbeyond.example.com

Backend:
  https://api.rentandbeyond.example.com

Database:
  private Postgres host only
  do not expose this directly to your client
```

The services connect like this:

```text
Browser -> Frontend domain -> Backend domain -> Postgres / Redis
```

## Environment templates

Use these files when preparing deployment:

- `frontend/.env.example`
  - local development template
- `frontend/.env.production.example`
  - production domain template
- `backend/.env.example`
  - local development template
- `backend/.env.production.example`
  - production domain template
- `DEPLOYMENT_DOMAINS.md`
  - step-by-step domain mapping guidance

## Recommended GitHub repo structure

Push this folder as one monorepo:

```text
housing-owner-tenant-github-ready/
  frontend/
  backend/
  database/
  mobile/
  docker-compose.yml
```

## What was intentionally excluded

This copy does not include local-only or generated files:

- `.git/`
- `.env`
- `node_modules/`
- `.next/`
- `target/`
- `tsconfig.tsbuildinfo`

## Suggested next steps

1. Open this folder in your editor.
2. Create a fresh Git repository here:
   - `git init`
3. Copy the example env files into real env files for your hosting platform.
4. Push this folder to GitHub.
5. Deploy `frontend/` and `backend/` separately, then wire the domains together with env vars and CORS.

## Important note

This is a copied package for GitHub and deployment preparation. Your currently running app still lives in the original folders under:

- `housing-owner-tenant-web-app`
- `housing-owner-tenant-backend-api`
- `housing-owner-tenant-mobile-app`
