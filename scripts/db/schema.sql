-- SpyNet AR - Complete Database Schema
-- Run this after init.sql to create all tables

-- ============================================================================
-- PLAYERS & AUTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',
  auth_provider_id TEXT,
  public_key BYTEA,
  faction_id UUID REFERENCES factions(id),
  rank SMALLINT DEFAULT 0 CHECK (rank >= 0 AND rank <= 100),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  credits INTEGER DEFAULT 100 CHECK (credits >= 0),
  reputation INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  is_double_agent BOOLEAN DEFAULT FALSE,
  original_faction_id UUID REFERENCES factions(id),
  profile_data JSONB DEFAULT '{}',
  last_location GEOGRAPHY(POINT, 4326),
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_faction_id_idx ON players(faction_id);
CREATE INDEX IF NOT EXISTS players_handle_trgm_idx ON players USING gin(handle gin_trgm_ops);
CREATE INDEX IF NOT EXISTS players_rank_idx ON players(rank DESC);
CREATE INDEX IF NOT EXISTS players_xp_idx ON players(xp DESC);
CREATE INDEX IF NOT EXISTS players_last_location_idx ON players USING GIST(last_location);
CREATE INDEX IF NOT EXISTS players_email_idx ON players(email);

-- ============================================================================
-- ZONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('micro', 'meso', 'macro')),
  polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
  center_point GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters INTEGER,
  control_faction_id UUID REFERENCES factions(id),
  control_score JSONB NOT NULL DEFAULT '{"obsidian":0,"aurora":0,"citadel":0}',
  capture_threshold INTEGER DEFAULT 1000,
  capture_window_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zones_polygon_idx ON zones USING GIST(polygon);
CREATE INDEX IF NOT EXISTS zones_center_point_idx ON zones USING GIST(center_point);
CREATE INDEX IF NOT EXISTS zones_city_idx ON zones(city);
CREATE INDEX IF NOT EXISTS zones_control_faction_id_idx ON zones(control_faction_id);
CREATE INDEX IF NOT EXISTS zones_is_active_idx ON zones(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- MISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN (
    'qr_scan', 'surveillance', 'cipher', 'raid', 'drop',
    'remote_analysis', 'social_engineering', 'triangulation'
  )),
  title TEXT NOT NULL,
  description TEXT,
  narrative_briefing TEXT,
  difficulty SMALLINT DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  payload JSONB NOT NULL,
  zone_id UUID REFERENCES zones(id),
  target_faction_id UUID REFERENCES factions(id),
  issuer TEXT NOT NULL CHECK (issuer IN ('ai', 'system', 'player')),
  issuer_player_id UUID REFERENCES players(id),
  requires_field_presence BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_assignments INTEGER DEFAULT 1,
  current_assignments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS missions_zone_id_idx ON missions(zone_id);
CREATE INDEX IF NOT EXISTS missions_kind_idx ON missions(kind);
CREATE INDEX IF NOT EXISTS missions_expires_at_idx ON missions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS missions_issuer_idx ON missions(issuer);
CREATE INDEX IF NOT EXISTS missions_difficulty_idx ON missions(difficulty);

CREATE TABLE IF NOT EXISTS mission_assignments (
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'in_progress', 'succeeded', 'failed', 'expired', 'abandoned'
  )),
  progress JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (mission_id, player_id)
);

CREATE INDEX IF NOT EXISTS mission_assignments_player_id_idx ON mission_assignments(player_id);
CREATE INDEX IF NOT EXISTS mission_assignments_status_idx ON mission_assignments(status);
CREATE INDEX IF NOT EXISTS mission_assignments_completed_at_idx ON mission_assignments(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- QR CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  signed_jwt TEXT NOT NULL,
  qr_type TEXT NOT NULL CHECK (qr_type IN ('mission', 'item', 'intel', 'faction')),
  zone_id UUID REFERENCES zones(id),
  location GEOGRAPHY(POINT, 4326),
  creator_player_id UUID REFERENCES players(id),
  mission_id UUID REFERENCES missions(id),
  faction_id UUID REFERENCES factions(id),
  payload JSONB DEFAULT '{}',
  scan_count INTEGER DEFAULT 0,
  max_scans INTEGER,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qr_codes_code_idx ON qr_codes(code);
CREATE INDEX IF NOT EXISTS qr_codes_zone_id_idx ON qr_codes(zone_id);
CREATE INDEX IF NOT EXISTS qr_codes_location_idx ON qr_codes USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS qr_codes_active_idx ON qr_codes(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS qr_codes_expires_at_idx ON qr_codes(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  player_id UUID NOT NULL REFERENCES players(id),
  mission_id UUID REFERENCES missions(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  wifi_hash TEXT,
  success BOOLEAN DEFAULT TRUE,
  reward_xp INTEGER DEFAULT 0,
  reward_credits INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  scanned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qr_scans_qr_code_id_idx ON qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS qr_scans_player_id_idx ON qr_scans(player_id);
CREATE INDEX IF NOT EXISTS qr_scans_scanned_at_idx ON qr_scans(scanned_at);

-- ============================================================================
-- ITEMS & INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  value_credits INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_item_type_idx ON items(item_type);
CREATE INDEX IF NOT EXISTS items_rarity_idx ON items(rarity);

CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, item_id)
);

CREATE INDEX IF NOT EXISTS player_inventory_player_id_idx ON player_inventory(player_id);

CREATE TABLE IF NOT EXISTS drops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id),
  item_id UUID NOT NULL REFERENCES items(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  zone_id UUID REFERENCES zones(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  found_by_player_id UUID REFERENCES players(id),
  found_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drops_location_idx ON drops USING GIST(location);
CREATE INDEX IF NOT EXISTS drops_zone_id_idx ON drops(zone_id);
CREATE INDEX IF NOT EXISTS drops_player_id_idx ON drops(player_id);
CREATE INDEX IF NOT EXISTS drops_found_by_player_id_idx ON drops(found_by_player_id) WHERE found_by_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS drops_active_idx ON drops(expires_at) WHERE found_by_player_id IS NULL AND expires_at > now();

-- ============================================================================
-- SOCIAL & ENCOUNTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID NOT NULL REFERENCES players(id),
  player2_id UUID NOT NULL REFERENCES players(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  zone_id UUID REFERENCES zones(id),
  distance_meters REAL,
  interaction_type TEXT CHECK (interaction_type IN ('scan', 'challenge', 'trade', 'alliance')),
  outcome JSONB DEFAULT '{}',
  encountered_at TIMESTAMPTZ DEFAULT now(),
  CHECK (player1_id != player2_id)
);

CREATE INDEX IF NOT EXISTS encounters_player1_id_idx ON encounters(player1_id);
CREATE INDEX IF NOT EXISTS encounters_player2_id_idx ON encounters(player2_id);
CREATE INDEX IF NOT EXISTS encounters_zone_id_idx ON encounters(zone_id);
CREATE INDEX IF NOT EXISTS encounters_encountered_at_idx ON encounters(encountered_at);

-- ============================================================================
-- EVENTS & HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  zone_id UUID REFERENCES zones(id),
  faction_id UUID REFERENCES factions(id),
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_event_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_player_id_idx ON events(player_id);
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp);

CREATE TABLE IF NOT EXISTS zone_control_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES zones(id),
  faction_id UUID REFERENCES factions(id),
  previous_faction_id UUID REFERENCES factions(id),
  control_score JSONB NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zone_control_history_zone_id_idx ON zone_control_history(zone_id);
CREATE INDEX IF NOT EXISTS zone_control_history_captured_at_idx ON zone_control_history(captured_at);

-- ============================================================================
-- NARRATIVE
-- ============================================================================

CREATE TABLE IF NOT EXISTS narrative_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN (
    'global', 'city', 'faction', 'zone', 'player'
  )),
  target_faction_id UUID REFERENCES factions(id),
  target_zone_id UUID REFERENCES zones(id),
  target_player_id UUID REFERENCES players(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS narrative_broadcasts_type_idx ON narrative_broadcasts(broadcast_type);
CREATE INDEX IF NOT EXISTS narrative_broadcasts_faction_idx ON narrative_broadcasts(target_faction_id);
CREATE INDEX IF NOT EXISTS narrative_broadcasts_created_at_idx ON narrative_broadcasts(created_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS players_updated_at ON players;
CREATE TRIGGER players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS zones_updated_at ON zones;
CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION get_zone_for_location(lat REAL, lon REAL)
RETURNS TABLE(zone_id UUID, zone_name TEXT, zone_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT z.id, z.name, z.zone_type
  FROM zones z
  WHERE ST_Contains(z.polygon, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography)
    AND z.is_active = TRUE
  ORDER BY
    CASE z.zone_type
      WHEN 'micro' THEN 1
      WHEN 'meso' THEN 2
      WHEN 'macro' THEN 3
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_mission_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE missions
    SET current_assignments = current_assignments + 1
    WHERE id = NEW.mission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE missions
    SET current_assignments = current_assignments - 1
    WHERE id = OLD.mission_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mission_assignment_count_trigger ON mission_assignments;
CREATE TRIGGER mission_assignment_count_trigger
AFTER INSERT OR DELETE ON mission_assignments
FOR EACH ROW EXECUTE FUNCTION update_mission_assignment_count();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert sample items
INSERT INTO items (item_type, name, description, rarity, value_credits, metadata) VALUES
  ('currency', 'Gold Coin', 'Standard SpyNet currency', 'common', 10, '{}'),
  ('currency', 'Diamond', 'Rare high-value currency', 'rare', 100, '{}'),
  ('data', 'Encrypted Data Cache', 'Contains classified information', 'uncommon', 50, '{}'),
  ('intel', 'Enemy Safehouse Coordinates', 'Location of rival faction base', 'epic', 200, '{}'),
  ('tool', 'Decryption Key', 'Used to unlock encrypted messages', 'rare', 75, '{}')
ON CONFLICT DO NOTHING;

-- Create demo user (password: 'changeme')
INSERT INTO players (handle, email, password_hash, xp, rank, credits, profile_data) VALUES
  (
    'agent007',
    'demo@spynet.com',
    crypt('changeme', gen_salt('bf')),
    1250,
    15,
    350,
    '{"bio": "Elite field operative", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=agent007"}'::jsonb
  )
ON CONFLICT (handle) DO NOTHING;

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'SpyNet AR schema created successfully';
  RAISE NOTICE 'Tables created: players, zones, missions, qr_codes, items, encounters, events';
  RAISE NOTICE 'Demo user: agent007 / changeme';
END $$;
