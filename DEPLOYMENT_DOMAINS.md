# Domain Deployment Map

This project is easiest to deploy with separate frontend and backend domains.

## Recommended domains

```text
Frontend:
  https://web.rentandbeyond.example.com

Backend:
  https://api.rentandbeyond.example.com

Postgres:
  internal/private host from your database provider

Redis:
  internal/private host from your cache provider
```

## How the connection works

1. The client opens the frontend domain.
2. The frontend calls the backend domain using `NEXT_PUBLIC_API_BASE_URL`.
3. The backend accepts that frontend origin using `CORS_ALLOWED_ORIGINS`.
4. The backend connects to Postgres using `DB_URL`.
5. The backend connects to Redis using `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` if needed.

## Frontend production env

Example:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.rentandbeyond.example.com
API_BASE_URL_INTERNAL=https://api.rentandbeyond.example.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
HOSTNAME=0.0.0.0
PORT=3000
```

## Backend production env

Example:

```bash
DB_URL=jdbc:postgresql://your-postgres-host:5432/housing_owner_tenant
DB_USER=your_db_user
DB_PASSWORD=your_db_password
CORS_ALLOWED_ORIGINS=https://web.rentandbeyond.example.com
PAYMENT_PROVIDER=STRIPE
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
GOOGLE_OAUTH_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-web-client-secret
GOOGLE_OAUTH_ALLOWED_CLIENT_IDS=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS=https://web.rentandbeyond.example.com/account/login/gmail,https://web.rentandbeyond.example.com/account/register/gmail,https://web.rentandbeyond.example.com/rest/oauth2-credential/callback
```

## Notes

- Postgres does not need a public domain for your client.
- Redis does not need a public domain for your client.
- Only the frontend and backend need public domains.
- You can use free subdomains first, then move to a branded domain later.
