-- SpyNet AR Database Initialization Script
-- This script sets up extensions and initial schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create schema version table
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- Insert initial version
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema setup')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE spynet TO spynet;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spynet;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spynet;

-- Create factions table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS factions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ideology TEXT,
  lore JSONB NOT NULL DEFAULT '{}',
  color_primary TEXT NOT NULL,
  color_secondary TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed factions
INSERT INTO factions (code, name, description, ideology, color_primary, color_secondary, lore) VALUES
  (
    'obsidian',
    'The Obsidian Order',
    'Masters of deception, surveillance, and psychological warfare',
    'Manipulation through information control',
    '#1a1a1a',
    '#4a0e4e',
    '{"founding_year": 1947, "motto": "Truth is what we make it", "specialty": "counterintelligence"}'::jsonb
  ),
  (
    'aurora',
    'The Aurora Syndicate',
    'Tech-forward anarchists seeking to expose global secrets',
    'Transparency through disruption',
    '#00ffff',
    '#ff00ff',
    '{"founding_year": 2011, "motto": "Light in the darkness", "specialty": "digital infiltration"}'::jsonb
  ),
  (
    'citadel',
    'The Citadel Directorate',
    'Military-precision loyalists prioritizing structure and control',
    'Order through discipline',
    '#003d5c',
    '#ffd700',
    '{"founding_year": 1918, "motto": "Strength through unity", "specialty": "tactical operations"}'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'SpyNet AR database initialized successfully';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, postgis, pg_trgm, vector';
  RAISE NOTICE 'Factions created: Obsidian Order, Aurora Syndicate, Citadel Directorate';
END $$;
