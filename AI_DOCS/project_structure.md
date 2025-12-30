# Project Structure

```
olive_store/
├── app/
│   ├── config/           # Database, R2, Resend config
│   ├── controllers/      # Public + Admin controllers
│   ├── middleware/       # Auth, admin, error handling
│   ├── models/           # User, Product, Order, etc.
│   ├── routes/           # API routes (public + admin)
│   ├── services/         # Email, upload services
│   ├── utils/            # Async handler, slugify, tokens
│   └── views/
│       ├── layouts/      # main.ejs, admin.ejs
│       ├── partials/     # header, footer, breadcrumb
│       ├── pages/        # Store pages (18 files)
│       └── admin/        # Admin pages (11 files)
│
├── public/
│   ├── css/              # style.css (custom styles)
│   ├── js/               # Client-side modules
│   │   ├── i18n.js       # Internationalization
│   │   ├── config.js     # API config
│   │   ├── utils.js      # Utilities
│   │   ├── api.js        # API helper
│   │   ├── auth.js       # Auth module
│   │   └── cart.js       # Cart management
│   ├── locales/          # Translation files
│   │   ├── ar.json       # Arabic
│   │   └── en.json       # English
│   └── images/           # Static images
│
├── database/
│   ├── schema.sql        # Database schema
│   └── seed.js           # Admin seeder
│
├── AI_DOCS/              # Documentation (this folder)
├── server.js             # Entry point
├── package.json
└── .env.example
```

## Key View Files

### Store Pages (`app/views/pages/`)
| File | Purpose |
|------|---------|
| index.ejs | Homepage |
| products.ejs | Product listing |
| product.ejs | Product detail |
| cart.ejs | Shopping cart |
| checkout.ejs | Checkout form |
| order-success.ejs | Order confirmation |
| my-orders.ejs | Customer orders list |
| order-detail.ejs | Order detail |
| login.ejs | Login |
| register.ejs | Registration |
| forgot-password.ejs | Password reset request |
| reset-password.ejs | Password reset form |
| verify-email.ejs | Email verification |
| profile.ejs | User profile |
| about.ejs | About page |
| contact.ejs | Contact form |
| shipping.ejs | Shipping info |
| payment-info.ejs | Payment info |

### Admin Pages (`app/views/admin/`)
| File | Purpose |
|------|---------|
| login.ejs | Admin login |
| index.ejs | Dashboard |
| products.ejs | Product list |
| product-form.ejs | Add/edit product |
| categories.ejs | Category management |
| orders.ejs | Order list |
| order-detail.ejs | Order detail |
| customers.ejs | Customer list |
| files.ejs | Media manager |
| settings.ejs | Store settings |
