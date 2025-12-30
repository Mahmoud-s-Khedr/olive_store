# API Endpoints (summary)

## Public/Auth
- POST /api/auth/register — create account
- POST /api/auth/login — JWT login (blocks unverified)
- POST /api/auth/forgot-password — request reset
- POST /api/auth/reset-password — reset with token
- GET /api/auth/verify-email/:token — verify email
- POST /api/auth/resend-verification — resend email
- GET /api/auth/me — current user (auth)
- PUT /api/auth/profile — update profile (auth)
- PUT /api/auth/password — change password (auth)

## Public Catalog/Settings
- GET /api/categories — list active
- GET /api/categories/:slug — category detail
- GET /api/categories/:slug/products — products by category
- GET /api/products — list (page/filter/sort/search)
- GET /api/products/:slug — product detail
- GET /api/settings/public — public settings

## Files
- POST /api/files/upload-url — signed R2 PUT URL (auth)

## Orders (customer)
- POST /api/orders — create order (auth, server-calculated totals)
- GET /api/orders — list user orders (auth)
- GET /api/orders/:orderNumber — order detail (auth)
- POST /api/orders/:orderNumber/payment-proof — attach proof (auth)
- POST /api/orders/:orderNumber/cancel — cancel pending (auth)

## Admin
- /api/admin/* routes protected by JWT + admin middleware + rate limit
- Dashboard: GET /api/admin/dashboard (metrics)
- Categories: CRUD at /api/admin/categories
- Products: CRUD + images at /api/admin/products
- Orders: list/detail/status/payment at /api/admin/orders
- Customers: list + orders at /api/admin/customers
- Files: list/delete/upload at /api/admin/files (POST registers uploaded R2 asset metadata)
- Settings: list/update at /api/admin/settings
