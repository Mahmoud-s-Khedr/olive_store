# API Reference (Current Backend)

Base URL: `http://localhost:5000/api`

Auth: Bearer token in `Authorization: Bearer <token>` for protected routes.

## Authentication
- **POST /auth/register**
  - Body: `{ name, email, phone, password }`
  - Notes: email/phone must be unique.

- **POST /auth/login**
  - Body: `{ email, password }`
  - Notes: blocks unverified emails.

- **POST /auth/forgot-password**
  - Body: `{ email }`

- **POST /auth/reset-password**
  - Body: `{ token, password }`

- **GET /auth/verify-email/:token**
  - Params: `token` from email link.

- **POST /auth/resend-verification**
  - Body: `{ email }`

- **GET /auth/me** (auth)
  - Returns user profile.

- **PUT /auth/profile** (auth)
  - Body: `{ name, phone }`

- **PUT /auth/password** (auth)
  - Body: `{ current_password, new_password }`

## Addresses (auth)
Base: `/addresses`
- **GET /** — list addresses for current user.
- **POST /** — create address.
  - Body: `{ full_name, phone, address_line1, address_line2?, city, postal_code? }`
- **PUT /:id** — update address (same fields as create).
- **DELETE /:id** — delete address.

## Files
- **POST /files/upload-url** (auth)
  - Body: `{ file_name, content_type?, key_prefix? }`
  - Returns: `{ key, uploadUrl, publicUrl? }` (signed R2 PUT URL).

## Categories (public)
- **GET /categories** — list active categories.
- **GET /categories/:slug** — category detail.
- **GET /categories/:slug/products** — products in category; query: `page, limit, sort, search, min_price, max_price`.

## Products (public)
- **GET /products** — list products; query: `page, limit, category, sort, search, min_price, max_price`.
- **GET /products/:slug** — product detail with images.

## Orders (auth)
Base: `/orders`
- **POST /** — create order.
  - Body: `{ customer_name, phone, address, city, postal_code?, notes?, payment_method, shipping_cost?, discount?, items: [{ product_id, quantity, product_image? }] }`
  - Notes: totals calculated server-side; stock validated.
- **GET /** — list current user orders.
- **GET /:orderNumber** — order detail (+ items).
- **POST /:orderNumber/payment-proof** — attach proof.
  - Body: `{ r2_key, filename, original_name, mime_type, size, payment_reference? }`
- **POST /:orderNumber/cancel** — cancel pending order; body `{ reason? }`.

## Settings (public)
- **GET /settings/public** — public store settings.

# Admin API (all require admin JWT)
Base: `/api/admin`

## Dashboard
- **GET /dashboard** — returns metrics + recent orders.

## Categories
- **GET /categories** — list all.
- **GET /categories/:id** — detail.
- **POST /categories** — create.
  - Body: `{ name_ar, name_en, slug?, description_ar?, description_en?, parent_id?, sort_order?, is_active? }`
- **PUT /categories/:id** — update (same fields as create).
- **DELETE /categories/:id** — delete.

## Products
- **GET /products** — list all (paged in controller if added later).
- **GET /products/:id** — detail + images.
- **POST /products** — create.
  - Body: `{ name_ar, name_en, price, category_id?, slug?, description_ar?, description_en?, short_description_ar?, short_description_en?, old_price?, cost_price?, stock?, low_stock_threshold?, weight?, dimensions?, is_active?, meta_title?, meta_description? }`
- **PUT /products/:id** — update (same fields as create).
- **DELETE /products/:id** — delete.
- **POST /products/:id/images** — add images.
  - Body: `{ files: [{ r2_key, filename, original_name, mime_type, size, is_primary?, sort_order?, alt_text_ar?, alt_text_en? }] }`
- **PUT /products/:id/images/:imageId/primary** — set primary image.
- **DELETE /products/:id/images/:imageId** — delete image.

## Orders
- **GET /orders** — list (supports `page, limit, status, payment_status`).
- **GET /orders/:id** — detail + items + user.
- **PUT /orders/:id/status** — update status/payment.
  - Body: `{ status?, payment_status? }`

## Customers
- **GET /customers** — list customers (paged).
- **GET /customers/:id/orders** — orders for a customer.

## Files
- **GET /files** — list files (placeholder response today).
- **DELETE /files/:id** — delete file (not fully implemented yet).

## Settings
- **GET /settings** — list all settings.
- **PUT /settings** — bulk update.
  - Body: array or object with `{ key, value, type?, group_name? }`; type in [string, number, boolean, json].

# Testing Plan (pre-integration)

Goal: verify each documented API flow behaves correctly, uses the right DTOs, and is ready for frontend integration.

## Setup
- Apply schema: `database/schema.sql`
- Seed data: `database/seed.js`
- Base URL: `http://localhost:5000/api`
- Auth: Bearer token in `Authorization: Bearer <token>`
- Optional tooling: Postman/Thunder Client collection or supertest integration tests

## Auth Flows
- Register: `POST /auth/register`
  - Inputs: `{ name, email, phone, password }`
  - Verify: unique email/phone, email verification token set, proper error messages on duplicates.
- Login: `POST /auth/login`
  - Inputs: `{ email, password }`
  - Verify: JWT issued for verified users, blocked response for unverified with correct message/status.
- Verify email: `GET /auth/verify-email/:token`
  - Verify: token expires, double-verify handling, correct success/failure messages.
- Resend verification: `POST /auth/resend-verification`
  - Inputs: `{ email }`
  - Verify: sends new token only if unverified.
- Forgot/reset password: `POST /auth/forgot-password`, `POST /auth/reset-password`
  - Inputs: `{ email }`, `{ token, password }`
  - Verify: token expiry, password updated, login succeeds with new password.
- Profile update: `PUT /auth/profile`
  - Inputs: `{ name, phone }`
  - Verify: auth required, phone uniqueness, DTO matches response.
- Change password: `PUT /auth/password`
  - Inputs: `{ current_password, new_password }`
  - Verify: current password check, JWT still valid.

## Addresses (auth)
- CRUD via `/addresses`
  - Create: `POST /addresses` with `{ full_name, phone, address_line1, address_line2?, city, postal_code? }`
  - Update: `PUT /addresses/:id` (same DTO)
  - Delete: `DELETE /addresses/:id`
  - Verify: ownership enforcement, validation errors, list returns only user addresses.

## Catalog (public)
- Categories:
  - `GET /categories` (active only)
  - `GET /categories/:slug`
  - `GET /categories/:slug/products` with `page, limit, sort, search, min_price, max_price`
- Products:
  - `GET /products` with `page, limit, category, sort, search, min_price, max_price`
  - `GET /products/:slug`
- Verify: slug handling, pagination metadata, filters/sort/search, image fields on product detail.

## Files (auth)
- Signed upload URL: `POST /files/upload-url`
  - Inputs: `{ file_name, content_type?, key_prefix? }`
  - Verify: response `{ key, uploadUrl, publicUrl? }`, R2 PUT works, stored key usable in later DTOs.

## Orders (auth)
- Create: `POST /orders`
  - Inputs: `{ customer_name, phone, address, city, postal_code?, notes?, payment_method, shipping_cost?, discount?, items: [{ product_id, quantity, product_image? }] }`
  - Verify: server-calculated totals, stock validation, order number format.
- List/detail:
  - `GET /orders`, `GET /orders/:orderNumber`
  - Verify: only current user's orders, items returned, totals consistent.
- Payment proof: `POST /orders/:orderNumber/payment-proof`
  - Inputs: `{ r2_key, filename, original_name, mime_type, size, payment_reference? }`
  - Verify: file record linked, status/message updated.
- Cancel: `POST /orders/:orderNumber/cancel`
  - Inputs: `{ reason? }`
  - Verify: only pending orders cancel, status transitions, reason stored.

## Settings (public + admin)
- Public: `GET /settings/public`
  - Verify: only public fields returned, values types handled correctly.
- Admin:
  - `GET /settings`, `PUT /settings`
  - Verify: DTO accepts array/object, type enforcement, updated_at changes.

## Admin APIs (auth + admin)
- Dashboard: `GET /admin/dashboard`
  - Verify: metrics and recent orders shape.
- Categories CRUD:
  - `GET /admin/categories`, `GET /admin/categories/:id`, `POST/PUT/DELETE /admin/categories`
  - Verify: slug handling, parent relations, is_active behavior.
- Products CRUD:
  - `GET /admin/products`, `GET /admin/products/:id`, `POST/PUT/DELETE /admin/products`
  - Verify: price fields, stock, activation, meta fields.
- Product images:
  - `POST /admin/products/:id/images`
  - `PUT /admin/products/:id/images/:imageId/primary`
  - `DELETE /admin/products/:id/images/:imageId`
  - Verify: single primary constraint, sort_order, alt_texts saved.
- Orders admin:
  - `GET /admin/orders`, `GET /admin/orders/:id`
  - `PUT /admin/orders/:id/status` with `{ status?, payment_status? }`
  - Verify: status transitions, payment_status changes, side effects timestamps.
- Customers:
  - `GET /admin/customers`, `GET /admin/customers/:id/orders`
  - Verify: pagination, order linkage.
- Files:
  - `GET /admin/files`, `DELETE /admin/files/:id`
  - `POST /admin/files`
    - Body: `{ r2_key, filename, original_name, mime_type, size, entity_type?, entity_id? }`
    - Verify: file metadata persisted with admin `uploaded_by`, re-usable R2 key records surface in the media manager.
  - Verify: deletion behavior, placeholders if not implemented.

## Middleware & Security
- Confirm JWT + admin middleware on `/api/admin/*`
- Rate limits on auth + write routes
- Error handler returns consistent structure and messages

## Suggested Test Data
- 1 admin user (seeded)
- 2 regular users (verified/unverified)
- 3 categories (one inactive)
- 6 products (mixed stock, price, category)
- 2 orders (pending/paid) with items and payment proofs
