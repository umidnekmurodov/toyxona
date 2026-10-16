-- =========================================================
-- TO'YXONA ONLINE BAND QILISH TIZIMI
-- PostgreSQL Database Schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');

CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);

CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'partial',
    'paid'
);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    fullname VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,

    password TEXT NOT NULL,

    role user_role DEFAULT 'user',

    avatar TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TO'YXONA EGALARI
-- =========================================================

CREATE TABLE owners (
    owner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,

    company_name VARCHAR(200),
    passport_number VARCHAR(50),

    region VARCHAR(100),
    district VARCHAR(100),
    address TEXT,

    bank_account VARCHAR(100),

    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TO'YXONALAR
-- =========================================================

CREATE TABLE wedding_halls (
    hall_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    owner_id UUID REFERENCES owners(owner_id) ON DELETE CASCADE,

    hall_name VARCHAR(200) NOT NULL,

    description TEXT,

    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,

    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    capacity INTEGER NOT NULL,

    price_per_seat NUMERIC(12,2),

    phone VARCHAR(20),

    main_image TEXT,

    wifi BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    air_conditioner BOOLEAN DEFAULT FALSE,
    stage BOOLEAN DEFAULT FALSE,
    music_system BOOLEAN DEFAULT FALSE,

    rating NUMERIC(2,1) DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TO'YXONA RASMLARI
-- =========================================================

CREATE TABLE hall_images (
    image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    hall_id UUID REFERENCES wedding_halls(hall_id) ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- BAND QILISH (BOOKING)
-- =========================================================

CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    hall_id UUID REFERENCES wedding_halls(hall_id) ON DELETE CASCADE,

    booking_date DATE NOT NULL,

    guest_count INTEGER NOT NULL,

    total_price NUMERIC(12,2) NOT NULL,

    status booking_status DEFAULT 'pending',

    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TO'LOVLAR
-- =========================================================

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID REFERENCES bookings(booking_id) ON DELETE CASCADE,

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(50),

    payment_status payment_status DEFAULT 'unpaid',

    transaction_id VARCHAR(255),

    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SHARHLAR VA REYTING
-- =========================================================

CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    hall_id UUID REFERENCES wedding_halls(hall_id) ON DELETE CASCADE,

    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- FAVORITES
-- =========================================================

CREATE TABLE favorites (
    favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    hall_id UUID REFERENCES wedding_halls(hall_id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ADMIN LOGS
-- =========================================================

CREATE TABLE admin_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    admin_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    action TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_hall_region
ON wedding_halls(region);

CREATE INDEX idx_booking_date
ON bookings(booking_date);

CREATE INDEX idx_user_role
ON users(role);

CREATE INDEX idx_review_hall
ON reviews(hall_id);

-- =========================================================
-- SAMPLE ADMIN
-- password: 123456 (hash qilib qo'yiladi)
-- =========================================================

INSERT INTO users (
    fullname,
    username,
    email,
    phone,
    password,
    role
)
VALUES (
    'Super Admin',
    'admin',
    'admin@gmail.com',
    '+998901112233',
    '$2b$10$OedxXNuT/JYDJbbeQ5bXOeHxoTqjN/SeIIEB7gi6PiA4GvkPAZm/m',
    'admin'
);

-- =========================================================
-- TO'YXONA O'ZGARTIRISH/QO'SHISH ARIZALARI (REQUESTS)
-- =========================================================

CREATE TABLE IF NOT EXISTS approval_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hall_id UUID REFERENCES wedding_halls(hall_id) ON DELETE CASCADE,
    owner_id UUID REFERENCES owners(owner_id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('create', 'update')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    data JSONB NOT NULL,
    admin_comment TEXT,
    approved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- BRON UCHUN QO'SHIMCHA XIZMATLAR
-- =========================================================

CREATE TABLE IF NOT EXISTS singers (
    singer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullname VARCHAR(200) NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price > 0),
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
    car_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price > 0),
    brand VARCHAR(100),
    model_year INTEGER,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS foods (
    food_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_per_guest NUMERIC(12,2) NOT NULL CHECK (price_per_guest > 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS singer_id UUID REFERENCES singers(singer_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(car_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS food_id UUID REFERENCES foods(food_id) ON DELETE SET NULL;

