# Tech Stack

## Frontend
- **Templates**: EJS (Embedded JavaScript)
- **Styling**: TailwindCSS (CDN), custom CSS
- **Icons**: Material Symbols (Google)
- **Fonts**: Cairo, Tajawal (Arabic), Inter (English) via Google Fonts
- **Client-side JS**: Vanilla ES6+
- **i18n**: Custom module with JSON translation files

## Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 4.x
- **Database**: PostgreSQL 16.x (pg 8.x driver)
- **Auth**: bcryptjs 2.x, jsonwebtoken 9.x
- **Security**: helmet 7.x, express-rate-limit 7.x
- **File Storage**: Cloudflare R2 (@aws-sdk/client-s3 + presigner)
- **Email**: Resend 2.x
- **Config**: dotenv 16.x

## Infrastructure
- **Hosting**: VPS (Hostinger/DigitalOcean) or Container
- **Database**: Managed Postgres (Supabase/Neon)
- **Storage**: Cloudflare R2
- **Email**: Resend transactional email
- **CDN/SSL**: Cloudflare

## Design System
- **Primary Color**: #6e8137 (Olive Green)
- **Accent Color**: #d4a017 (Golden)
- **Direction**: RTL (Arabic default), LTR (English)
- **Typography**: Cairo/Tajawal (AR), Inter (EN)
