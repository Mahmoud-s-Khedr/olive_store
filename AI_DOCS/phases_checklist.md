# Day-by-Day Checklist (from original plan)

## Phase 1: Project Setup (Day 1-2)
- [x] Initialize backend with Express
- [~] Setup PostgreSQL database (pool + schema/seed scripts ready; apply DB)
- [ ] Create all migration files (using schema.sql instead)
- [ ] Run migrations (pending `npm run db:schema` / `db:seed`)
- [x] Create frontend folder structure (public/ scaffold)
- [ ] Setup base HTML template with RTL
- [~] Configure Cloudflare R2 (client + signed URLs wired; envs needed)
- [~] Configure Resend (client wired; envs needed)
- [x] Setup environment variables (example provided)

## Phase 2: Authentication (Day 3-5)
- [x] User registration endpoint
- [x] Password hashing
- [x] Email verification (Resend)
- [x] Login with JWT
- [x] Auth middleware
- [x] Profile management
- [ ] Frontend: Login page
- [ ] Frontend: Register page
- [ ] Frontend: Verify email page
- [ ] Frontend: Profile page
- [ ] Frontend: Auth JS module

## Phase 3: File Upload System (Day 6-7)
- [x] R2 upload service (signed PUT URLs)
- [x] Single file upload endpoint (signed URL request)
- [ ] Multiple file upload endpoint
- [ ] File deletion (with R2 cleanup)
- [ ] Frontend: File upload component

## Phase 4: Categories & Products (Day 8-11)
- [x] Category CRUD endpoints
- [x] Product CRUD endpoints
- [x] Product images management (signed upload + DB linking)
- [x] Product search & filtering
- [ ] Frontend: Homepage
- [ ] Frontend: Product listing
- [ ] Frontend: Product detail page
- [ ] Frontend: Category filtering

## Phase 5: Cart & Checkout (Day 12-15)
- [x] Cart JS module (localStorage scaffolding)
- [x] Order creation endpoint
- [x] Order confirmation email
- [x] Payment instructions (order fields + payment proof flow)
- [x] Payment proof upload
- [ ] Frontend: Cart page
- [ ] Frontend: Checkout page
- [ ] Frontend: Order success page
- [ ] Frontend: My orders page
- [ ] Frontend: Order detail page

## Phase 6: Admin Panel (Day 16-21)
- [x] Admin authentication (JWT + admin middleware)
- [x] Dashboard with stats
- [x] Product management pages (APIs)
- [x] Category management pages (APIs)
- [x] Order management pages (APIs)
- [x] Payment verification
- [x] Customer list
- [x] Settings management

## Phase 7: Polish & Testing (Day 22-25)
- [ ] RTL refinements
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Loading states
- [ ] Form validations
- [ ] Email templates styling
- [ ] Cross-browser testing

## Phase 8: Deployment (Day 26-28)
- [ ] Setup VPS
- [ ] Install Node.js, PM2, Nginx
- [ ] Setup PostgreSQL (or use managed)
- [ ] Configure SSL
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Deploy admin
- [ ] Configure domain
- [ ] Final testing
