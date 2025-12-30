-- Olive Store schema

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
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

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

-- Default admin user (replace hashed_password with a real bcrypt hash)
INSERT INTO users (name, email, phone, hashed_password, email_verified, phone_verified, is_admin)
VALUES ('Admin', 'admin@example.com', '+200000000000', '$2b$10$CHANGE_ME', TRUE, TRUE, TRUE);


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
