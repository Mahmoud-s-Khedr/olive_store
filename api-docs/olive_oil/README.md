# Bruno Collection: Olive Store

## Usage
1) Install Bruno: https://www.usebruno.com/
2) Open the collection folder `api-docs/olive_oil/`.
3) Select environment `env_local` and update vars (base_url, token, admin_token, credentials, ids/slugs like product_id/product_slug/order_number).
4) Run requests.

## Environments
- `env_local.bru`: base_url=http://localhost:5000, token/admin_token placeholders, sample credentials.

## Requests (folders)
- base.bru: GET {{base_url}}
- auth/: register, login, me
- addresses/: list, create, update, delete
- files/: upload-url
- catalog/: categories, products, product_detail
- orders/: create_order, my_orders, order_detail, payment_proof, cancel
- settings/: public
- admin/: dashboard, categories, products, orders, customers, settings, files

Notes:
- Path params use env vars (address_id, category_id, product_id, product_slug, product_image_id, order_number, order_id, customer_id, file_id); adjust in `env_local.bru`.
- Set `token` after login; set `admin_token` after admin login.
- Replace IDs/slugs as needed for your data.
- Order creation calculates totals server-side; ensure product_id exists and stock is available.
- Product list filters: `category` (slug), `sort` (price_asc|price_desc|oldest|newest), `search`, `min_price`, `max_price`.
- Admin orders list filters: `status`, `payment_status`.
- Order create requires `customer_name`, `phone`, `address`, `city`, `payment_method`, and items with `product_id` + `quantity`; optional `notes`, `shipping_cost`, `discount`.
- File/image uploads use signed URLs; first call upload-url, then PUT to R2, then attach via admin/product image endpoints or payment-proof.
