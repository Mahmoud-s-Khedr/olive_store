# Implementation Plan

## Backend (Complete ✅)

### Phase 1: Foundations ✅
- [x] Monolith MVC scaffold (Express, routes, middleware)
- [x] DB pool config and env loading
- [x] Apply schema/seed (`npm run db:schema` / `db:seed`)

### Phase 2: Core Auth & Users ✅
- [x] Register/login with JWT (blocks unverified)
- [x] Email verification via Resend
- [x] Password reset
- [x] Profile/password update
- [x] Address CRUD

### Phase 3: Catalog ✅
- [x] Categories CRUD (admin)
- [x] Products CRUD (admin)
- [x] Product images via R2 signed URLs + DB linking
- [x] Public listing/detail/search

### Phase 4: Orders & Payments ✅
- [x] Order creation with server-side totals/stock checks
- [x] Order items persistence
- [x] Payment proof upload
- [x] Admin status/payment updates
- [x] Order confirmation email

### Phase 5: Admin & Settings ✅
- [x] Dashboard metrics
- [x] Customers list + order history
- [x] Settings list/update

### Phase 6: Hardening ✅
- [x] Rate limiting (auth + write routes)
- [x] Helmet, logging, request IDs, improved error handler

---

## Frontend (Complete ✅)

### Phase 1: Foundation ✅
- [x] Store layout (`main.ejs`) with header/footer
- [x] Admin layout (`admin.ejs`) with sidebar/topbar
- [x] TailwindCSS theming (olive green, Cairo font)
- [x] RTL/LTR auto-switching

### Phase 2: Authentication Pages ✅
- [x] Login, Register, Forgot/Reset Password
- [x] Email Verification, Profile

### Phase 3: Storefront Pages ✅
- [x] Homepage, Products listing, Product detail
- [x] Cart, Checkout, Order success
- [x] My Orders, Order detail

### Phase 4: Static Pages ✅
- [x] About, Contact, Shipping, Payment Info

### Phase 5: Admin Dashboard ✅
- [x] Dashboard with stats
- [x] Products (list + form)
- [x] Categories (grid + modal)
- [x] Orders (list + detail)
- [x] Customers (list + modal)
- [x] Files (media manager)
- [x] Settings (tabbed interface)

### Phase 6: Internationalization ✅
- [x] i18n module with translation loading
- [x] Arabic & English translations
- [x] Language switcher in layouts
- [x] Auto RTL/LTR direction

---

## Remaining Tasks

- [ ] End-to-end testing
- [ ] Deployment configuration
- [ ] Production build optimization
