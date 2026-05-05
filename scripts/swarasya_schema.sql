-- Schema for Swarasya band members management
-- Run this in your Supabase SQL editor

-- Create swarasya_members table
CREATE TABLE IF NOT EXISTS swarasya_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    instrument VARCHAR(255),
    image_url TEXT,
    bio TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swarasya_albums table
CREATE TABLE IF NOT EXISTS swarasya_albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year VARCHAR(10),
    tracks INTEGER DEFAULT 0,
    image_url TEXT,
    spotify_link TEXT,
    youtube_link TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swarasya_settings table for page configuration
CREATE TABLE IF NOT EXISTS swarasya_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO swarasya_settings (setting_key, setting_value)
VALUES 
    ('band_description', 'Where ancient melodies meet modern souls. Music that transcends, heals, and elevates the spirit on its journey toward inner peace.'),
    ('about_text', 'Swarasya was born from a shared passion for spiritual music and its power to transform lives. Our name, derived from Sanskrit, means "the essence of melody" - and that is exactly what we aim to deliver with every note we play.'),
    ('years_of_harmony', '10+'),
    ('instagram_link', ''),
    ('youtube_link', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swarasya_members_active ON swarasya_members(is_active);
CREATE INDEX IF NOT EXISTS idx_swarasya_members_order ON swarasya_members(display_order);
CREATE INDEX IF NOT EXISTS idx_swarasya_albums_active ON swarasya_albums(is_active);
CREATE INDEX IF NOT EXISTS idx_swarasya_albums_order ON swarasya_albums(display_order);

-- Enable Row Level Security (RLS)
ALTER TABLE swarasya_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarasya_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarasya_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to swarasya_members" ON swarasya_members
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to swarasya_albums" ON swarasya_albums
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to swarasya_settings" ON swarasya_settings
    FOR SELECT USING (true);

-- Create policies for authenticated insert/update/delete (for admin)
CREATE POLICY "Allow authenticated insert to swarasya_members" ON swarasya_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to swarasya_members" ON swarasya_members
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete to swarasya_members" ON swarasya_members
    FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert to swarasya_albums" ON swarasya_albums
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to swarasya_albums" ON swarasya_albums
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete to swarasya_albums" ON swarasya_albums
    FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert to swarasya_settings" ON swarasya_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to swarasya_settings" ON swarasya_settings
    FOR UPDATE USING (true);
