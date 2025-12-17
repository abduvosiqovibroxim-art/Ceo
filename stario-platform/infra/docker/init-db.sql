-- Stario Platform - Database Initialization Script
-- This script runs on first PostgreSQL startup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS stario;

-- =============================================================================
-- Users and Authentication
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    telegram_id VARCHAR(50),
    telegram_username VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON stario.users(email);
CREATE INDEX idx_users_telegram_id ON stario.users(telegram_id);
CREATE INDEX idx_users_role ON stario.users(role);

-- =============================================================================
-- Artists
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255),
    bio TEXT,
    category VARCHAR(100) NOT NULL,
    country VARCHAR(10) DEFAULT 'UZ',
    avatar_url TEXT,
    cover_url TEXT,
    source_image_url TEXT,
    voice_model_id VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT false,
    total_videos INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_artists_category ON stario.artists(category);
CREATE INDEX idx_artists_country ON stario.artists(country);
CREATE INDEX idx_artists_status ON stario.artists(verification_status);

-- Artist verification documents
CREATE TABLE IF NOT EXISTS stario.artist_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES stario.artists(id),
    passport_document_url TEXT NOT NULL,
    contract_document_url TEXT NOT NULL,
    additional_info TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES stario.users(id),
    reviewer_notes TEXT
);

-- Artist content restrictions
CREATE TABLE IF NOT EXISTS stario.artist_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID UNIQUE REFERENCES stario.artists(id),
    whitelist_topics TEXT[] DEFAULT '{"birthday","greeting","congratulation","holiday"}',
    blacklist_topics TEXT[] DEFAULT '{"politics","religion","violence","adult"}',
    max_video_duration_seconds INTEGER DEFAULT 60,
    allow_face_quiz BOOLEAN DEFAULT true,
    allow_voice_clone BOOLEAN DEFAULT true,
    allow_merch BOOLEAN DEFAULT true,
    custom_rules TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artist prompt templates
CREATE TABLE IF NOT EXISTS stario.artist_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES stario.artists(id),
    name VARCHAR(255) NOT NULL,
    template_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Content Generation
-- =============================================================================

-- Videos
CREATE TABLE IF NOT EXISTS stario.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES stario.users(id),
    artist_id UUID REFERENCES stario.artists(id),
    prompt_template_id UUID REFERENCES stario.artist_prompts(id),
    custom_message TEXT,
    recipient_name VARCHAR(255),
    occasion VARCHAR(100),
    language VARCHAR(10) DEFAULT 'uz',
    duration_seconds INTEGER,
    video_url TEXT,
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    moderation_status VARCHAR(50) DEFAULT 'pending',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_videos_user ON stario.videos(user_id);
CREATE INDEX idx_videos_artist ON stario.videos(artist_id);
CREATE INDEX idx_videos_status ON stario.videos(status);

-- Posters
CREATE TABLE IF NOT EXISTS stario.posters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES stario.users(id),
    artist_id UUID REFERENCES stario.artists(id),
    template_id UUID,
    style VARCHAR(100),
    text_content TEXT,
    secondary_text TEXT,
    poster_url TEXT,
    poster_url_hd TEXT,
    thumbnail_url TEXT,
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    status VARCHAR(50) DEFAULT 'pending',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice messages
CREATE TABLE IF NOT EXISTS stario.voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES stario.users(id),
    artist_id UUID REFERENCES stario.artists(id),
    text_content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'uz',
    emotion VARCHAR(50) DEFAULT 'neutral',
    audio_url TEXT,
    duration_seconds DECIMAL(6,2),
    status VARCHAR(50) DEFAULT 'pending',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face Quiz results
CREATE TABLE IF NOT EXISTS stario.face_quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES stario.users(id),
    artist_id UUID REFERENCES stario.artists(id),
    similarity_score DECIMAL(5,2),
    matching_features TEXT[],
    rank_percentile DECIMAL(5,2),
    badge_earned VARCHAR(100),
    share_image_url TEXT,
    photo_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_face_quiz_user ON stario.face_quiz_results(user_id);
CREATE INDEX idx_face_quiz_artist ON stario.face_quiz_results(artist_id);
CREATE INDEX idx_face_quiz_score ON stario.face_quiz_results(similarity_score DESC);

-- =============================================================================
-- Orders and Payments
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES stario.users(id),
    status VARCHAR(50) DEFAULT 'created',
    subtotal_uzs INTEGER NOT NULL DEFAULT 0,
    discount_uzs INTEGER DEFAULT 0,
    shipping_uzs INTEGER DEFAULT 0,
    total_uzs INTEGER NOT NULL DEFAULT 0,
    promo_code VARCHAR(50),
    payment_provider VARCHAR(50),
    payment_id VARCHAR(255),
    shipping_address JSONB,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_user ON stario.orders(user_id);
CREATE INDEX idx_orders_status ON stario.orders(status);

-- Order items
CREATE TABLE IF NOT EXISTS stario.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES stario.orders(id),
    product_type VARCHAR(50) NOT NULL,
    product_id UUID,
    artist_id UUID REFERENCES stario.artists(id),
    quantity INTEGER DEFAULT 1,
    unit_price_uzs INTEGER NOT NULL,
    customization JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS stario.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES stario.orders(id),
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255),
    amount_uzs INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'UZS',
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_payments_order ON stario.payments(order_id);
CREATE INDEX idx_payments_provider ON stario.payments(provider);
CREATE INDEX idx_payments_status ON stario.payments(status);

-- Refunds
CREATE TABLE IF NOT EXISTS stario.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES stario.payments(id),
    amount_uzs INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    processed_by UUID REFERENCES stario.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- Merchandise
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS stario.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES stario.product_categories(id),
    artist_id UUID REFERENCES stario.artists(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price_uzs INTEGER NOT NULL,
    images TEXT[],
    customization_options JSONB,
    is_available BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    production_cost_uzs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Moderation and Audit
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    content_url TEXT,
    content_text TEXT,
    flags TEXT[],
    confidence_scores JSONB,
    artist_id UUID REFERENCES stario.artists(id),
    user_id UUID REFERENCES stario.users(id),
    priority INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    reviewer_id UUID REFERENCES stario.users(id),
    review_decision VARCHAR(50),
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_moderation_status ON stario.moderation_queue(status);
CREATE INDEX idx_moderation_priority ON stario.moderation_queue(priority DESC);

-- Audit logs (90-day retention)
CREATE TABLE IF NOT EXISTS stario.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_timestamp ON stario.audit_logs(timestamp);
CREATE INDEX idx_audit_action ON stario.audit_logs(action);
CREATE INDEX idx_audit_actor ON stario.audit_logs(actor_id);

-- Partition audit logs by month for easier cleanup
-- (Implementation depends on PostgreSQL version)

-- =============================================================================
-- Analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS stario.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES stario.users(id),
    session_id VARCHAR(100),
    properties JSONB,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    platform VARCHAR(50),
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_event ON stario.analytics_events(event_name);
CREATE INDEX idx_analytics_user ON stario.analytics_events(user_id);
CREATE INDEX idx_analytics_time ON stario.analytics_events(created_at);

-- =============================================================================
-- Functions and Triggers
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON stario.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_artists_updated_at
    BEFORE UPDATE ON stario.artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON stario.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Insert default product categories
INSERT INTO stario.product_categories (name, description, icon_url, sort_order) VALUES
    ('T-Shirts', 'Custom printed t-shirts', '/icons/tshirt.svg', 1),
    ('Posters & Prints', 'High-quality art prints', '/icons/poster.svg', 2),
    ('Phone Cases', 'Personalized phone cases', '/icons/phone.svg', 3),
    ('Mugs', 'Custom printed mugs', '/icons/mug.svg', 4),
    ('3D Figurines', 'AI-generated 3D collectibles', '/icons/figurine.svg', 5)
ON CONFLICT DO NOTHING;

-- Insert demo artist (for development)
INSERT INTO stario.artists (name, stage_name, bio, category, country, verification_status, is_active) VALUES
    ('Demo Artist', 'Demo', 'Demo artist for testing', 'singer', 'UZ', 'approved', true)
ON CONFLICT DO NOTHING;

COMMIT;
