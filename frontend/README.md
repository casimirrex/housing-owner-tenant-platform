# Housing Owner-Tenant Web App

Separate Next.js + React + TypeScript repository for the public website and authenticated web flows.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form + Zod

## Backend integration

Set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
API_BASE_URL_INTERNAL=http://127.0.0.1:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

The backend already supports Google sign-in without NextAuth. Add the Google client secret to
`housing-owner-tenant-backend-api/.env` with either:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-web-client-secret
```

or the shorter aliases:

```bash
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-web-client-secret
```

This app is wired to these live backend domains:

- `GET /api/v1/home`
- `GET /api/v1/listings/trending`
- `GET /api/v1/listings/new`
- `GET /api/v1/search`
- `POST /api/v1/search/map`
- `GET /api/v1/filters/metadata`
- `GET /api/v1/properties/{propertyId}`
- `GET /api/v1/properties/{propertyId}/reviews`
- `GET /api/v1/properties/{propertyId}/faq`
- `POST /api/v1/properties/{propertyId}/save`
- `DELETE /api/v1/properties/{propertyId}/save`
- `GET /api/v1/web-content/{slug}`
- `POST /api/v1/support/enquiries`
- `POST /auth/login`
- `POST /auth/oauth/google`
- `POST /auth/token/refresh`
- `POST /auth/logout`

For Gmail OAuth 2.0 on the web, add these Google authorized JavaScript origins in Google Cloud:

- `http://127.0.0.1:3000`
- `http://localhost:3000`
- `http://127.0.0.1:3001`
- `http://localhost:3001`

Then add these Google authorized redirect URIs:

- `http://127.0.0.1:3000/account/login/gmail`
- `http://127.0.0.1:3000/account/register/gmail`
- `http://localhost:3000/account/login/gmail`
- `http://localhost:3000/account/register/gmail`
- `http://127.0.0.1:3001/account/login/gmail`
- `http://127.0.0.1:3001/account/register/gmail`
- `http://localhost:3001/account/login/gmail`
- `http://localhost:3001/account/register/gmail`

## Phase 1 pages included

- Landing page
- City landing page
- Search results page
- Property detail page
- How it works
- About us
- Contact/support
- Privacy policy
- Terms & conditions
- Registration / sign up
- Login
- Logout

All of the above are runtime pages. The content-heavy routes use the Spring Boot `web-content` API and are not hardcoded static placeholders.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001) if you choose to run it on a secondary port.

## Production

1. Copy `.env.production.example` to `.env.production` and set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-public-api-domain
API_BASE_URL_INTERNAL=http://your-internal-backend-service:8080
WEB_PORT=3001
```

`NEXT_PUBLIC_API_BASE_URL` is what the browser calls. `API_BASE_URL_INTERNAL` is what server-side Next.js fetches call inside the container or internal network.

2. Build and run:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Or with plain Docker:

```bash
docker build -t housing-owner-tenant-web-app .
docker run --rm -p 3001:3000 --env-file .env.production housing-owner-tenant-web-app
```

## Notes

- Client-side auth and support calls require the backend CORS allowlist to include the deployed web origin.
- Dynamic routes are marked to render at runtime so production builds do not bake in placeholder page content.
- The contact page now submits real support enquiries to the Spring Boot backend.
