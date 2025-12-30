# Database Schema

Full DDL: `database/schema.sql` (and copy at `AI_DOCS/schema.sql`).

Key tables:
- users: auth + verification + password reset tokens; unique email/phone; is_admin flag.
- addresses: user addresses.
- files: R2 object metadata (r2_key only).
- categories/products/product_images: catalog with slugs, metadata, images linked to files.
- orders/order_items: customer orders with payment proof link and status/payment_status fields.
- settings: key/value store grouped by general/shipping/payment; seeded defaults.

Seed data:
- Default admin created via `database/seed.js` using `ADMIN_PASSWORD` (override name/email/phone with env).
- Default store settings inserted in schema.sql.

Apply:
- `npm run db:schema` then `npm run db:seed` (requires `DATABASE_URL` and `ADMIN_PASSWORD`).
