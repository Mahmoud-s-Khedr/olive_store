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
│
├── public/
│   ├── pages/            # Static HTML pages (store + admin)
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

### Store Pages (`public/pages/`)
| File | Purpose |
|------|---------|
| index.html | Homepage |
| products.html | Product listing |
| product.html | Product detail |
| cart.html | Shopping cart |
| checkout.html | Checkout form |
| order-success.html | Order confirmation |
| my-orders.html | Customer orders list |
| order-detail.html | Order detail |
| login.html | Login |
| register.html | Registration |
| forgot-password.html | Password reset request |
| reset-password.html | Password reset form |
| verify-email.html | Email verification |
| profile.html | User profile |
| about.html | About page |
| contact.html | Contact form |
| shipping.html | Shipping info |
| payment-info.html | Payment info |
| categories.html | Categories listing |
| terms.html | Terms |
| logout.html | Logout redirect page |

### Admin Pages (`public/pages/`)
| File | Purpose |
|------|---------|
| admin-login.html | Admin login |
| admin-dashboard.html | Dashboard |
| admin-products.html | Product list |
| admin-product-form.html | Add/edit product |
| admin-categories.html | Category management |
| admin-category-form.html | Category form |
| admin-orders.html | Order list |
| admin-order-detail.html | Order detail |
| admin-customers.html | Customer list |
| admin-files.html | Media manager |
| admin-settings.html | Store settings |
