# Environment & Config

## Backend env (.env)
- PORT, NODE_ENV
- DATABASE_URL
- JWT_SECRET, JWT_EXPIRES_IN
- FRONTEND_URL, ADMIN_URL
- RESEND_API_KEY, EMAIL_FROM
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT
- RATE_LIMIT_* (optional overrides)

## Services
- Resend: required for email verification/reset/order confirmations.
- Cloudflare R2: used for product images/payment proofs via signed PUT URLs.

## Commands
- Install: `npm install`
- Run dev: `npm run dev`
- DB schema: `npm run db:schema`
- DB seed: `npm run db:seed` (requires `ADMIN_PASSWORD`; override admin name/email/phone via env)
- DB setup: `npm run db:setup`
