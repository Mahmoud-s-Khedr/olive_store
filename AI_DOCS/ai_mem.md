# AI Memory - Olive Store

## Repo Layout
- Backend monolith: `app/` (config/controllers/middleware/models/routes/services/utils/views)
- Static assets: `public/` (css/js/images/locales)
- DB: `database/schema.sql` and `database/seed.js` (admin seeder script)
- Env sample: `.env.example`

## Backend Status
- Auth: register/login (blocks unverified), email verify/reset via Resend, profile/password update, address CRUD
- Catalog: categories/products CRUD (admin), public listing/detail/search, product images via signed R2 PUT URLs + DB linking
- Orders: server-side totals/stock checks, create/list/detail, payment proof upload, cancel; admin status/payment updates and metrics
- Settings: public and admin endpoints; settings stored in DB
- Admin: dashboard metrics, customers list/history, files/settings routes wired
- Hardening: helmet, rate limits (auth + write routes), request IDs, logging, improved error handler

## Frontend Status ✅ IMPLEMENTED
All frontend pages have been implemented:

### Store Pages (18 files in `app/views/pages/`)
- Homepage (hero, categories, featured products)
- Products listing (filters, search, sorting, pagination)
- Product detail (gallery, tabs, related products)
- Cart (items, quantities, coupon, summary)
- Checkout (shipping form, payment selection)
- Order success, My Orders, Order Detail
- Auth: login, register, forgot/reset password, verify email, profile
- Static: about, contact, shipping, payment info

### Admin Pages (11 files in `app/views/admin/`)
- Login (standalone page)
- Dashboard (stats, recent orders, quick actions)
- Products (list with filters, add/edit form)
- Categories (grid with modal CRUD)
- Orders (list with status tabs, detail with status update)
- Customers (list with detail modal)
- Files (media manager with upload)
- Settings (tabs for store info, shipping, payment, notifications)

### Layouts (2 files in `app/views/layouts/`)
- `main.ejs` - Store layout with header, footer, navigation
- `admin.ejs` - Admin layout with sidebar, topbar

### Internationalization (i18n)
- `public/js/i18n.js` - Translation module with RTL/LTR switching
- `public/locales/ar.json` - Arabic translations
- `public/locales/en.json` - English translations
- Language switcher in both store and admin headers

## Design System
- **Framework**: TailwindCSS (CDN)
- **Icons**: Material Symbols
- **Fonts**: Cairo/Tajawal (Arabic), Inter (English)
- **Colors**: Olive green primary (#6e8137), golden accent (#d4a017)
- **Direction**: RTL for Arabic, LTR for English (auto-switches)

## Key Commands
- Start dev: `npm run dev`
- Apply DB: `npm run db:schema` then `npm run db:seed`
- Request signed upload URL: POST `/api/files/upload-url` (auth) with `file_name`

## JS Modules (`public/js/`)
- `i18n.js` - Internationalization
- `config.js` - API configuration
- `utils.js` - Utility functions
- `api.js` - API helper
- `auth.js` - Authentication module
- `cart.js` - Cart management (localStorage)

## Notes for new agents
- Frontend is fully implemented with EJS templates + TailwindCSS
- Bilingual support (AR/EN) with automatic RTL/LTR switching
- Cart data stored in localStorage, synced with server on checkout
- JWT tokens: `token` for users, `adminToken` for admin
- Use server-calculated totals/stock checks; don't trust client pricing
