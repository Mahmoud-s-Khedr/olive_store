# Olive Oil Ecommerce Store - Project Plan (v3)

## Project Overview

**Project Name:** Egyptian Olive Oil Store
**Type:** Custom Ecommerce Solution
**Target Market:** Egypt
**Languages:** Arabic (Primary), English (Secondary)
**Direction:** RTL Support

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Page structure |
| CSS3 | - | Styling, RTL support, responsive design |
| JavaScript | ES6+ | Interactivity, API calls, cart management |
| Font Awesome | 6.x | Icons |
| Google Fonts (Cairo) | - | Arabic typography |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ LTS | Runtime environment |
| Express.js | 4.x | Web framework, REST API |
| PostgreSQL | 16.x | Database |
| pg | 8.x | PostgreSQL client |
| bcryptjs | 2.x | Password hashing |
| jsonwebtoken | 9.x | JWT authentication |
| Resend | 2.x | Email service |
| @aws-sdk/client-s3 | 3.x | Cloudflare R2 uploads |
| multer | 1.x | Multipart form handling |
| express-validator | 7.x | Input validation |
| cors | 2.x | Cross-origin requests |
| dotenv | 16.x | Environment variables |
| helmet | 7.x | Security headers |
| express-rate-limit | 7.x | Rate limiting |

### Infrastructure

| Service | Cost | Purpose |
|---------|------|---------|
| VPS (Hostinger/DigitalOcean) | ~$6-12/month | Server hosting |
| PostgreSQL (Supabase/Neon) | Free tier | Managed database |
| Cloudflare R2 | Free tier (10GB) | File storage |
| Resend | Free tier (3000 emails/month) | Transactional emails |
| Domain (.com or .com.eg) | ~$10-15/year | Custom domain |
| Cloudflare | Free | CDN, SSL, DNS |

---

## Database Schema

### Table: users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_token VARCHAR(255),
    email_token_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_otp VARCHAR(6),
    phone_otp_expires TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

### Table: addresses

```sql
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

### Table: files

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    r2_key VARCHAR(500) NOT NULL UNIQUE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_r2_key ON files(r2_key);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
```

### Table: categories

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description_ar TEXT,
    description_en TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

### Table: products

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description_ar TEXT,
    description_en TEXT,
    short_description_ar VARCHAR(500),
    short_description_en VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    weight VARCHAR(50),
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
```

### Table: product_images

```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    alt_text_ar VARCHAR(255),
    alt_text_en VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE UNIQUE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = TRUE;
```

### Table: orders

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    notes TEXT,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(100),
    payment_proof_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
    paid_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### Table: order_items

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name_ar VARCHAR(200) NOT NULL,
    product_name_en VARCHAR(200) NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### Table: settings

```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    group_name VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_group ON settings(group_name);
```

**Default Settings:**

```sql
INSERT INTO settings (key, value, type, group_name) VALUES
('store_name_ar', 'متجر زيت الزيتون', 'string', 'general'),
('store_name_en', 'Olive Oil Store', 'string', 'general'),
('store_email', 'info@example.com', 'string', 'general'),
('store_phone', '+201234567890', 'string', 'general'),
('store_address_ar', 'القاهرة، مصر', 'string', 'general'),
('store_address_en', 'Cairo, Egypt', 'string', 'general'),
('currency', 'EGP', 'string', 'general'),
('shipping_cost', '50', 'number', 'shipping'),
('free_shipping_minimum', '500', 'number', 'shipping'),
('vodafone_number', '01012345678', 'string', 'payment'),
('instapay_username', 'store@instapay', 'string', 'payment'),
('fawry_code', '1234567890', 'string', 'payment'),
('bank_name', 'البنك الأهلي', 'string', 'payment'),
('bank_account', '1234567890123', 'string', 'payment'),
('bank_iban', 'EG123456789012345678901234', 'string', 'payment');
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create new account | No |
| POST | /api/auth/login | Login, get JWT token | No |
| POST | /api/auth/forgot-password | Request password reset | No |
| POST | /api/auth/reset-password | Reset password with token | No |
| GET | /api/auth/verify-email/:token | Verify email address | No |
| POST | /api/auth/resend-verification | Resend verification email | No |
| GET | /api/auth/me | Get current user profile | Yes |
| PUT | /api/auth/profile | Update profile | Yes |
| PUT | /api/auth/password | Change password | Yes |
| POST | /api/auth/send-phone-otp | Send phone verification OTP | Yes |
| POST | /api/auth/verify-phone | Verify phone with OTP | Yes |

### Files

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/files/upload | Upload single file to R2 | Yes |
| POST | /api/files/upload-multiple | Upload multiple files | Yes |
| GET | /api/files/:id | Get file info | No |
| DELETE | /api/files/:id | Delete file from R2 | Admin |

### Categories (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/categories | List all active categories | No |
| GET | /api/categories/:slug | Get single category | No |
| GET | /api/categories/:slug/products | Products in category | No |

### Products (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/products | List products (paginated, filtered) | No |
| GET | /api/products/search | Search products | No |
| GET | /api/products/:slug | Get single product | No |

**Query Parameters for GET /api/products:**
- `page` (default: 1)
- `limit` (default: 12)
- `category` (category slug)
- `sort` (price_asc, price_desc, newest, oldest)
- `min_price`
- `max_price`
- `search` (keyword)

### Orders (Customer)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/orders | Create new order | Yes |
| GET | /api/orders | Get user's orders | Yes |
| GET | /api/orders/:orderNumber | Get order details | Yes |
| POST | /api/orders/:orderNumber/payment-proof | Upload payment proof | Yes |
| POST | /api/orders/:orderNumber/cancel | Cancel order (if pending) | Yes |

### Settings (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/settings/public | Get public store settings | No |

---

## Admin API Endpoints

### Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/dashboard | Dashboard statistics | Admin |
| GET | /api/admin/dashboard/sales | Sales chart data | Admin |
| GET | /api/admin/dashboard/recent-orders | Recent orders | Admin |

### Categories Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/categories | List all categories | Admin |
| GET | /api/admin/categories/:id | Get category details | Admin |
| POST | /api/admin/categories | Create category | Admin |
| PUT | /api/admin/categories/:id | Update category | Admin |
| DELETE | /api/admin/categories/:id | Delete category | Admin |
| PUT | /api/admin/categories/:id/toggle | Toggle active status | Admin |
| PUT | /api/admin/categories/reorder | Reorder categories | Admin |

### Products Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/products | List all products | Admin |
| GET | /api/admin/products/:id | Get product details | Admin |
| POST | /api/admin/products | Create product | Admin |
| PUT | /api/admin/products/:id | Update product | Admin |
| DELETE | /api/admin/products/:id | Delete product | Admin |
| PUT | /api/admin/products/:id/toggle | Toggle active status | Admin |
| POST | /api/admin/products/:id/images | Add product images | Admin |
| PUT | /api/admin/products/:id/images/reorder | Reorder images | Admin |
| DELETE | /api/admin/products/:id/images/:imageId | Delete product image | Admin |
| PUT | /api/admin/products/:id/images/:imageId/primary | Set primary image | Admin |

### Orders Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/orders | List all orders | Admin |
| GET | /api/admin/orders/:id | Get order details | Admin |
| PUT | /api/admin/orders/:id/status | Update order status | Admin |
| PUT | /api/admin/orders/:id/payment | Update payment status | Admin |
| GET | /api/admin/orders/:id/payment-proof | View payment proof | Admin |
| POST | /api/admin/orders/:id/notes | Add admin note | Admin |
| GET | /api/admin/orders/export | Export orders CSV | Admin |

### Customers Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/customers | List all customers | Admin |
| GET | /api/admin/customers/:id | Get customer details | Admin |
| GET | /api/admin/customers/:id/orders | Get customer orders | Admin |

### Files Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/files | List all files | Admin |
| DELETE | /api/admin/files/:id | Delete file | Admin |
| DELETE | /api/admin/files/cleanup | Remove orphaned files | Admin |

### Settings Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/settings | Get all settings | Admin |
| PUT | /api/admin/settings | Update settings | Admin |
| PUT | /api/admin/settings/:key | Update single setting | Admin |

---

## Project Structure

```
olive-store/
│
├── app/
│   ├── config/
│   │   ├── database.js         # PostgreSQL connection pool
│   │   ├── r2.js               # Cloudflare R2 client
│   │   └── resend.js           # Resend email client
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── filesController.js
│   │   ├── categoriesController.js
│   │   ├── productsController.js
│   │   ├── ordersController.js
│   │   ├── settingsController.js
│   │   └── admin/
│   │       ├── dashboardController.js
│   │       ├── productsController.js
│   │       ├── categoriesController.js
│   │       ├── ordersController.js
│   │       ├── customersController.js
│   │       ├── filesController.js
│   │       └── settingsController.js
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── admin.js            # Admin role check
│   │   ├── upload.js           # Multer + R2 upload
│   │   ├── validate.js         # Validation middleware
│   │   └── errorHandler.js     # Global error handler
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Address.js
│   │   ├── File.js
│   │   ├── Product.js
│   │   ├── ProductImage.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   └── Setting.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── categories.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── settings.js
│   │   └── admin/
│   │       ├── dashboard.js
│   │       ├── products.js
│   │       ├── categories.js
│   │       ├── orders.js
│   │       ├── customers.js
│   │       ├── files.js
│   │       └── settings.js
│   │
│   ├── services/
│   │   ├── emailService.js
│   │   ├── uploadService.js
│   │   └── orderService.js
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── slugify.js
│   │
│   └── app.js                  # Express app setup
│
├── public/
│   ├── pages/
│   │   ├── index.html
│   │   ├── products.html
│   │   ├── product.html
│   │   ├── categories.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── order-success.html
│   │   ├── my-orders.html
│   │   ├── order-detail.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   ├── reset-password.html
│   │   ├── verify-email.html
│   │   ├── profile.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── shipping.html
│   │   ├── payment-info.html
│   │   ├── terms.html
│   │   ├── logout.html
│   │   ├── admin-login.html
│   │   ├── admin-dashboard.html
│   │   ├── admin-products.html
│   │   ├── admin-product-form.html
│   │   ├── admin-categories.html
│   │   ├── admin-category-form.html
│   │   ├── admin-orders.html
│   │   ├── admin-order-detail.html
│   │   ├── admin-customers.html
│   │   ├── admin-files.html
│   │   └── admin-settings.html
│   ├── css/
│   │   ├── style.css
│   │   ├── rtl.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── products.js
│   │   ├── checkout.js
│   │   ├── orders.js
│   │   ├── profile.js
│   │   └── utils.js
│   └── images/
│
├── database/
│   ├── schema.sql
│   └── seed.js
│
├── server.js                   # Entry point
├── package.json
├── .env.example
└── .gitignore
```

---

## Frontend JavaScript Modules

### js/config.js
```javascript
const CONFIG = {
    API_URL: 'http://localhost:5000/api',
    STORAGE_KEYS: {
        TOKEN: 'auth_token',
        USER: 'user_data',
        CART: 'cart_items',
        LANG: 'language'
    },
    DEFAULT_LANG: 'ar',
    CURRENCY: 'EGP',
    ITEMS_PER_PAGE: 12
};
```

### js/api.js
```javascript
// Centralized API calls
const API = {
    // Auth
    login: (email, password) => POST('/auth/login', { email, password }),
    register: (data) => POST('/auth/register', data),
    getProfile: () => GET('/auth/me'),
    
    // Products
    getProducts: (params) => GET('/products', params),
    getProduct: (slug) => GET(`/products/${slug}`),
    
    // Categories
    getCategories: () => GET('/categories'),
    
    // Orders
    createOrder: (data) => POST('/orders', data),
    getOrders: () => GET('/orders'),
    getOrder: (orderNumber) => GET(`/orders/${orderNumber}`),
    
    // Settings
    getSettings: () => GET('/settings/public')
};
```

### js/cart.js
```javascript
// Cart management using localStorage
const Cart = {
    items: [],
    
    init() { /* Load from localStorage */ },
    add(product, quantity) { /* Add item */ },
    update(productId, quantity) { /* Update quantity */ },
    remove(productId) { /* Remove item */ },
    clear() { /* Clear cart */ },
    getTotal() { /* Calculate total */ },
    getCount() { /* Get item count */ },
    save() { /* Save to localStorage */ }
};
```

### js/auth.js
```javascript
// Authentication management
const Auth = {
    token: null,
    user: null,
    
    init() { /* Load from localStorage */ },
    login(email, password) { /* Login and store token */ },
    register(data) { /* Register new user */ },
    logout() { /* Clear token and user */ },
    isLoggedIn() { /* Check if authenticated */ },
    isAdmin() { /* Check if admin */ },
    getToken() { /* Get stored token */ }
};
```

---

## Implementation Plan

### Phase 1: Foundations (Week 1)
- [x] Initialize monolith MVC structure
- [x] Wire Express app, middleware, and routes
- [x] Configure PostgreSQL connection and env loading
- [~] Load schema from `database/schema.sql` (script ready; run `npm run db:schema`)
- [~] Seed admin user via `database/seed.js` (requires `ADMIN_PASSWORD`; run `npm run db:seed`)

### Phase 2: Core Auth & Users (Week 2)
- [x] Register/login with JWT (blocks unverified emails)
- [x] Email verification flow (Resend wired)
- [x] Password reset flow
- [x] Profile update and password change
- [x] Address CRUD for users

### Phase 3: Catalog (Week 3)
- [x] Categories CRUD (admin)
- [x] Products CRUD (admin)
- [x] Product images upload via R2 signed URLs (signed PUT URLs + DB linking in place)
- [x] Public product listing, detail, and search

### Phase 4: Orders & Payments (Week 4)
- [x] Cart and checkout flows (backend order creation)
- [x] Order creation and order items persistence
- [x] Payment proof upload
- [x] Order status/payment management (admin)
- [x] Order confirmation emails

### Phase 5: Admin & Settings (Week 5)
- [x] Admin dashboard metrics
- [x] Customers listing and order history
- [x] Store settings management

### Phase 6: Hardening & Launch (Week 6)
- [x] Validation, rate limiting, and error handling polish
- RTL refinements and responsive tweaks
- [x] Basic monitoring/logging
- Deployment checklist and production config

**Deliverables by phase:**
- Phase 1: Running server + DB schema
- Phase 2: Auth working end-to-end
- Phase 3: Catalog fully manageable + public listing
- Phase 4: Orders flow complete
- Phase 5: Admin panel functional
- Phase 6: Production-ready release

---

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
ADMIN_URL=http://localhost:5501

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/olive_store

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Olive Store <noreply@yourdomain.com>

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=olive-store
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Cloudflare R2 Setup

### Bucket Structure

```
olive-store/                    # Bucket name
├── products/                   # Product images
│   ├── {product-id}/
│   │   ├── main.webp
│   │   ├── 1.webp
│   │   └── 2.webp
├── categories/                 # Category images
│   └── {category-id}.webp
├── users/                      # User avatars
│   └── {user-id}.webp
├── orders/                     # Payment proofs
│   └── {order-number}/
│       └── proof.webp
└── misc/                       # Other files
```

---

## Development Phases

### Phase 1: Project Setup (Day 1-2)

- [x] Initialize backend with Express
- [~] Setup PostgreSQL database (pool + schema/seed scripts ready; apply DB with `ADMIN_PASSWORD`)
- [ ] Create all migration files (using schema.sql instead)
- [ ] Run migrations (pending `npm run db:schema` / `db:seed`)
- [x] Create frontend folder structure (public/ scaffold)
- [ ] Setup base HTML template with RTL
- [~] Configure Cloudflare R2 (client + signed URLs wired; envs needed)
- [~] Configure Resend (client wired; envs needed)
- [x] Setup environment variables (example provided)

### Phase 2: Authentication (Day 3-5)

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

### Phase 3: File Upload System (Day 6-7)

- [x] R2 upload service (signed PUT URLs)
- [x] Single file upload endpoint (signed URL request)
- [ ] Multiple file upload endpoint
- [ ] File deletion (with R2 cleanup)
- [ ] Frontend: File upload component

### Phase 4: Categories & Products (Day 8-11)

- [x] Category CRUD endpoints
- [x] Product CRUD endpoints
- [x] Product images management (signed upload + DB linking)
- [x] Product search & filtering
- [ ] Frontend: Homepage
- [ ] Frontend: Product listing
- [ ] Frontend: Product detail page
- [ ] Frontend: Category filtering

### Phase 5: Cart & Checkout (Day 12-15)

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

### Phase 6: Admin Panel (Day 16-21)

- [x] Admin authentication (JWT + admin middleware)
- [x] Dashboard with stats
- [x] Product management pages (APIs)
- [x] Category management pages (APIs)
- [x] Order management pages (APIs)
- [x] Payment verification
- [x] Customer list
- [x] Settings management

### Phase 7: Polish & Testing (Day 22-25)

- [ ] RTL refinements
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Loading states
- [ ] Form validations
- [ ] Email templates styling
- [ ] Cross-browser testing

### Phase 8: Deployment (Day 26-28)

- [ ] Setup VPS
- [ ] Install Node.js, PM2, Nginx
- [ ] Setup PostgreSQL (or use managed)
- [ ] Configure SSL
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Deploy admin
- [ ] Configure domain
- [ ] Final testing

---

## Estimated Costs

### Development Phase
| Item | Cost |
|------|------|
| Domain registration | ~300 EGP/year |
| Development | Free (DIY) |

### Monthly Running Costs
| Item | Cost |
|------|------|
| VPS Hosting (basic) | ~300-600 EGP/month |
| PostgreSQL (Neon free tier) | Free |
| Cloudflare R2 (10GB free) | Free |
| Resend (3000 emails/month) | Free |
| Cloudflare (CDN, SSL) | Free |
| **Total** | **~300-600 EGP/month** |

---

## Future Enhancements

- [ ] SMS OTP via local provider
- [ ] Paymob/Fawry online payment
- [ ] Product reviews & ratings
- [ ] Wishlist
- [ ] Promo codes & discounts
- [ ] Inventory alerts (low stock)
- [ ] Sales reports & analytics
- [ ] WhatsApp notifications
- [ ] PWA support
- [ ] SEO optimization

---

**Document Version:** 3.0
**Last Updated:** December 2024

## Frontend Plan (Pages)

### Phase 1 (Base Shell)
- [ ] Static HTML pages in `public/pages` (store + admin)
- [ ] Global styles: Cairo typography, spacing scale, buttons, form controls, alerts
- [ ] RTL stylesheet + responsive utilities
- [ ] Shared navbar behavior via `public/js/navbar.js`

### Phase 2 (Auth)
- [ ] Pages: login, register, verify-email, forgot-password, reset-password, profile
- [ ] JS: auth module (login/register/logout, token storage, guards), form validation

### Phase 3 (Catalog)
- [ ] Pages: homepage (hero + featured slots), product listing (filters/sort/search), product detail
- [ ] Components: product card, category chips, breadcrumbs, pagination
- [ ] JS: products listing/search/filter, add-to-cart hook

### Phase 4 (Cart & Checkout)
- [ ] Pages: cart, checkout, order-success
- [ ] JS: cart (localStorage sync, totals), checkout submit, success state

### Phase 5 (Customer Orders)
- [ ] Pages: my-orders, order-detail (status, items, payment proof upload)
- [ ] JS: orders fetch/detail, payment-proof upload

### Phase 6 (Admin UI)
- [ ] Layout/nav: admin shell with sidebar/topbar
- [ ] Pages: dashboard, products (list/form/images), categories (list/form), orders (list/detail/status/payment), customers (list/detail), settings
- [ ] JS: admin auth guard, table filters/pagination, CRUD for products/categories/settings, status/payment updates, image upload via signed URLs
