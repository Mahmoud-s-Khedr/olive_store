# Stakeholder Guide: How People Use the Olive Store System

## User Types
- **Visitor** (not logged in): browses catalog, views product details, reads settings (store info, payment instructions), builds cart locally.
- **Customer** (logged in): everything a visitor can do, plus checkout, manage profile/addresses, view orders, upload payment proof.
- **Admin**: manages catalog, orders, customers, settings, and files; views dashboard metrics.

## Visitor Journey
1) Land on store (RTL/Arabic-first UI) and browse categories/products.
2) View product details and images; add items to a local cart.
3) See store settings (e.g., payment instructions) from public settings API.
4) Prompted to register/login to checkout.

## Customer Journey
1) **Register & verify email**: sign up, receive verification email (Resend), must verify before login succeeds.
2) **Login & profile**: authenticate, edit profile (name/phone), change password, manage saved addresses.
3) **Browse & cart**: continue browsing; cart persists locally; quantities/prices validated server-side at checkout.
4) **Checkout & order**: submit order with shipping/contact info and chosen payment method (e.g., manual payments). Server calculates totals and checks stock before creating the order.
5) **Payment proof**: upload proof (image/file) via signed R2 URL and attach to the order.
6) **Order tracking**: view order history and details, including status/payment status; cancel while pending.

## Admin Journey
1) **Authenticate**: login as admin (JWT + admin middleware).
2) **Dashboard**: view key metrics (orders, revenue summaries, recent orders).
3) **Catalog management**:
   - Categories: create/update/delete, set sort order/active status.
   - Products: create/update/delete, manage stock/pricing, SEO/meta, and images (use signed upload URLs, set primary image).
4) **Orders & payments**:
   - List/filter orders; view details with items and customer info.
   - Update order status and payment status; review attached payment proofs.
   - Cancel/refund flows can be handled via status changes.
5) **Customers**: list customers, see their order history.
6) **Files**: list/delete uploaded files (cleanup tasks planned).
7) **Settings**: edit store/shipping/payment settings stored in DB (e.g., store name, contact info, payment instructions).

## System Notes (context for stakeholders)
- **Tech**: Node/Express backend with PostgreSQL; Cloudflare R2 for file storage; Resend for email; JWT auth; rate limiting and security headers enabled.
- **Data integrity**: Order totals and stock are validated server-side; unverified emails cannot log in.
- **Uploads**: Files/images are uploaded via signed URLs to R2, then linked in the app (products, payment proofs).
- **I18n/RTL**: Arabic-first with RTL direction; English secondary.
- **Open items**: Frontend pages are scaffolded but UI build-out, RTL polish, and deployment setup are still pending; DB schema/seed need `ADMIN_PASSWORD` supplied for the admin seeder.
