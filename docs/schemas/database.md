# SpyNet AR - Database Schema

## Overview

SpyNet AR uses PostgreSQL 16 with PostGIS extension for geospatial operations. This document describes the complete database schema, relationships, and indexes.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search on handles
```

## Core Tables

### players

Stores player profiles, authentication data, and faction allegiance.

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT UNIQUE NOT NULL,
  auth_user_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  faction_id UUID NULL REFERENCES factions(id),
  rank SMALLINT DEFAULT 0 CHECK (rank >= 0 AND rank <= 100),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  credits INTEGER DEFAULT 100 CHECK (credits >= 0),
  reputation INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  is_double_agent BOOLEAN DEFAULT FALSE,
  original_faction_id UUID NULL REFERENCES factions(id),
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX players_faction_id_idx ON players(faction_id);
CREATE INDEX players_handle_trgm_idx ON players USING gin(handle gin_trgm_ops);
CREATE INDEX players_rank_idx ON players(rank DESC);
CREATE INDEX players_xp_idx ON players(xp DESC);
```

**Fields**:
- `id`: Unique player identifier
- `handle`: Player's username
- `auth_user_id`: External auth provider ID (Firebase, Auth0, etc.)
- `public_key`: Device public key for signed requests
- `faction_id`: Current faction (NULL for independents)
- `rank`: Player rank (0-100)
- `xp`: Experience points
- `credits`: In-game currency
- `reputation`: Overall reputation score
- `status`: Account status
- `is_double_agent`: Whether player is currently a double agent
- `original_faction_id`: Original faction if double agent
- `profile_data`: Additional JSON data (avatar, bio, preferences)

### factions

Represents the three main factions in the game.

```sql
CREATE TABLE factions (
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

-- Seed data
INSERT INTO factions (code, name, description, ideology, color_primary, color_secondary) VALUES
  ('obsidian', 'The Obsidian Order', 'Masters of deception, surveillance, and psychological warfare', 'Manipulation through information control', '#1a1a1a', '#4a0e4e'),
  ('aurora', 'The Aurora Syndicate', 'Tech-forward anarchists seeking to expose global secrets', 'Transparency through disruption', '#00ffff', '#ff00ff'),
  ('citadel', 'The Citadel Directorate', 'Military-precision loyalists prioritizing structure and control', 'Order through discipline', '#003d5c', '#ffd700');
```

### zones

Geofenced areas that can be controlled by factions.

```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('micro', 'meso', 'macro')),
  polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
  center_point GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters INTEGER,
  control_faction_id UUID NULL REFERENCES factions(id),
  control_score JSONB NOT NULL DEFAULT '{"obsidian":0,"aurora":0,"citadel":0}',
  capture_threshold INTEGER DEFAULT 1000,
  capture_window_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX zones_polygon_idx ON zones USING GIST(polygon);
CREATE INDEX zones_center_point_idx ON zones USING GIST(center_point);
CREATE INDEX zones_city_idx ON zones(city);
CREATE INDEX zones_control_faction_id_idx ON zones(control_faction_id);
```

**Zone Types**:
- `micro`: Individual landmarks (Ferry Building, Dolores Park)
- `meso`: Neighborhoods (Mission District, SoMa)
- `macro`: City sectors (Downtown SF, East Bay)

### missions

Represents individual missions that can be assigned to players.

```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN (
    'qr_scan', 'surveillance', 'cipher', 'raid', 'drop',
    'remote_analysis', 'social_engineering', 'triangulation'
  )),
  title TEXT NOT NULL,
  description TEXT,
  difficulty SMALLINT DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  payload JSONB NOT NULL,
  zone_id UUID NULL REFERENCES zones(id),
  target_faction_id UUID NULL REFERENCES factions(id),
  issuer TEXT NOT NULL CHECK (issuer IN ('ai', 'system', 'player')),
  issuer_player_id UUID NULL REFERENCES players(id),
  requires_field_presence BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NULL,
  max_assignments INTEGER DEFAULT 1,
  current_assignments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX missions_zone_id_idx ON missions(zone_id);
CREATE INDEX missions_kind_idx ON missions(kind);
CREATE INDEX missions_expires_at_idx ON missions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX missions_issuer_idx ON missions(issuer);
```

**Mission Kinds**:
- `qr_scan`: Scan a specific QR code
- `surveillance`: Track or follow a target
- `cipher`: Decrypt or decode data
- `raid`: Aggressive faction action in a zone
- `drop`: Place items in specific locations
- `remote_analysis`: Analyze data from anywhere
- `social_engineering`: Persuade or mislead players
- `triangulation`: Coordinate with multiple players

### mission_assignments

Tracks which missions are assigned to which players and their progress.

```sql
CREATE TABLE mission_assignments (
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'in_progress', 'succeeded', 'failed', 'expired', 'abandoned'
  )),
  progress JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (mission_id, player_id)
);

CREATE INDEX mission_assignments_player_id_idx ON mission_assignments(player_id);
CREATE INDEX mission_assignments_status_idx ON mission_assignments(status);
CREATE INDEX mission_assignments_completed_at_idx ON mission_assignments(completed_at) WHERE completed_at IS NOT NULL;
```

### qr_codes

Represents QR codes deployed in the real world or virtually.

```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  signed_jwt TEXT NOT NULL,
  qr_type TEXT NOT NULL CHECK (qr_type IN ('mission', 'item', 'intel', 'faction')),
  zone_id UUID NULL REFERENCES zones(id),
  location GEOGRAPHY(POINT, 4326) NULL,
  creator_player_id UUID NULL REFERENCES players(id),
  mission_id UUID NULL REFERENCES missions(id),
  faction_id UUID NULL REFERENCES factions(id),
  payload JSONB DEFAULT '{}',
  scan_count INTEGER DEFAULT 0,
  max_scans INTEGER NULL,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX qr_codes_code_idx ON qr_codes(code);
CREATE INDEX qr_codes_zone_id_idx ON qr_codes(zone_id);
CREATE INDEX qr_codes_location_idx ON qr_codes USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX qr_codes_active_idx ON qr_codes(active) WHERE active = TRUE;
CREATE INDEX qr_codes_expires_at_idx ON qr_codes(expires_at) WHERE expires_at IS NOT NULL;
```

### qr_scans

Tracks individual QR code scans.

```sql
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  player_id UUID NOT NULL REFERENCES players(id),
  mission_id UUID NULL REFERENCES missions(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  wifi_hash TEXT,
  success BOOLEAN DEFAULT TRUE,
  reward_xp INTEGER DEFAULT 0,
  reward_credits INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  scanned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX qr_scans_qr_code_id_idx ON qr_scans(qr_code_id);
CREATE INDEX qr_scans_player_id_idx ON qr_scans(player_id);
CREATE INDEX qr_scans_scanned_at_idx ON qr_scans(scanned_at);
```

### items

Virtual items that can be found, dropped, or traded.

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  value_credits INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX items_item_type_idx ON items(item_type);
CREATE INDEX items_rarity_idx ON items(rarity);
```

### player_inventory

Tracks items owned by players.

```sql
CREATE TABLE player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, item_id)
);

CREATE INDEX player_inventory_player_id_idx ON player_inventory(player_id);
```

### drops

Items dropped in the world by players.

```sql
CREATE TABLE drops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id),
  item_id UUID NOT NULL REFERENCES items(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  zone_id UUID NULL REFERENCES zones(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  found_by_player_id UUID NULL REFERENCES players(id),
  found_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX drops_location_idx ON drops USING GIST(location);
CREATE INDEX drops_zone_id_idx ON drops(zone_id);
CREATE INDEX drops_player_id_idx ON drops(player_id);
CREATE INDEX drops_found_by_player_id_idx ON drops(found_by_player_id) WHERE found_by_player_id IS NOT NULL;
CREATE INDEX drops_active_idx ON drops(expires_at) WHERE found_by_player_id IS NULL AND expires_at > now();
```

### encounters

Records when two players meet in proximity.

```sql
CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID NOT NULL REFERENCES players(id),
  player2_id UUID NOT NULL REFERENCES players(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  zone_id UUID NULL REFERENCES zones(id),
  distance_meters REAL,
  interaction_type TEXT CHECK (interaction_type IN ('scan', 'challenge', 'trade', 'alliance')),
  outcome JSONB DEFAULT '{}',
  encountered_at TIMESTAMPTZ DEFAULT now(),
  CHECK (player1_id != player2_id)
);

CREATE INDEX encounters_player1_id_idx ON encounters(player1_id);
CREATE INDEX encounters_player2_id_idx ON encounters(player2_id);
CREATE INDEX encounters_zone_id_idx ON encounters(zone_id);
CREATE INDEX encounters_encountered_at_idx ON encounters(encountered_at);
```

### zone_control_history

Historical record of zone control changes.

```sql
CREATE TABLE zone_control_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES zones(id),
  faction_id UUID NULL REFERENCES factions(id),
  previous_faction_id UUID NULL REFERENCES factions(id),
  control_score JSONB NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX zone_control_history_zone_id_idx ON zone_control_history(zone_id);
CREATE INDEX zone_control_history_captured_at_idx ON zone_control_history(captured_at);
```

### events

Append-only event log for analytics.

```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  player_id UUID NULL REFERENCES players(id),
  zone_id UUID NULL REFERENCES zones(id),
  faction_id UUID NULL REFERENCES factions(id),
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX events_event_type_idx ON events(event_type);
CREATE INDEX events_player_id_idx ON events(player_id);
CREATE INDEX events_timestamp_idx ON events(timestamp);

-- Partition by month for performance
CREATE TABLE events_partitioned (LIKE events INCLUDING ALL) PARTITION BY RANGE (timestamp);
```

**Note**: Consider migrating events to ClickHouse for better analytics performance at scale.

### narrative_broadcasts

AI-generated narrative messages and faction briefings.

```sql
CREATE TABLE narrative_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN (
    'global', 'city', 'faction', 'zone', 'player'
  )),
  target_faction_id UUID NULL REFERENCES factions(id),
  target_zone_id UUID NULL REFERENCES zones(id),
  target_player_id UUID NULL REFERENCES players(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

CREATE INDEX narrative_broadcasts_type_idx ON narrative_broadcasts(broadcast_type);
CREATE INDEX narrative_broadcasts_faction_idx ON narrative_broadcasts(target_faction_id);
CREATE INDEX narrative_broadcasts_created_at_idx ON narrative_broadcasts(created_at);
```

## Redis Schema

### Presence Tracking

```
presence:<zoneId>              → SET of player IDs (TTL 120s per member)
presence:player:<playerId>     → STRING zone_id (TTL 120s)
```

### BLE Beacons

```
ble:token:<playerId>           → STRING ephemeral_id (TTL 120s)
ble:reverse:<ephemeralId>      → STRING player_id (TTL 120s)
```

### Control Meters

```
zone:meter:<zoneId>            → HASH {obsidian: int, aurora: int, citadel: int}
zone:capture:<zoneId>          → HASH {faction: string, since: timestamp}
```

### Rate Limiting

```
qr:rate:<playerId>             → STRING count (TTL 60s, sliding window)
mission:rate:<playerId>        → STRING count (TTL 300s)
api:rate:<playerId>            → STRING count (TTL 60s)
```

### Nonce Tracking (Replay Prevention)

```
nonce:<nonceValue>             → STRING "used" (TTL: JWT expiry time)
```

### Session Management

```
session:<sessionId>            → HASH {player_id, device_id, created_at, last_seen}
refresh:<refreshToken>         → STRING session_id (TTL 30 days)
```

## Database Functions and Triggers

### Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Calculate Zone Containment

```sql
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
```

### Update Mission Assignment Count

```sql
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

CREATE TRIGGER mission_assignment_count_trigger
AFTER INSERT OR DELETE ON mission_assignments
FOR EACH ROW EXECUTE FUNCTION update_mission_assignment_count();
```

## Views

### Active Players by Faction

```sql
CREATE VIEW faction_player_counts AS
SELECT
  f.id as faction_id,
  f.name as faction_name,
  COUNT(p.id) as player_count,
  AVG(p.rank) as avg_rank,
  SUM(p.xp) as total_xp
FROM factions f
LEFT JOIN players p ON p.faction_id = f.id AND p.status = 'active'
GROUP BY f.id, f.name;
```

### Zone Control Summary

```sql
CREATE VIEW zone_control_summary AS
SELECT
  z.id as zone_id,
  z.name as zone_name,
  z.city,
  z.zone_type,
  f.name as controlling_faction,
  z.control_score,
  z.updated_at as last_update
FROM zones z
LEFT JOIN factions f ON z.control_faction_id = f.id
WHERE z.is_active = TRUE;
```

### Player Leaderboard

```sql
CREATE VIEW player_leaderboard AS
SELECT
  p.handle,
  p.rank,
  p.xp,
  p.reputation,
  f.name as faction,
  COUNT(DISTINCT ma.mission_id) as missions_completed
FROM players p
LEFT JOIN factions f ON p.faction_id = f.id
LEFT JOIN mission_assignments ma ON p.id = ma.player_id
  AND ma.status = 'succeeded'
WHERE p.status = 'active'
GROUP BY p.id, p.handle, p.rank, p.xp, p.reputation, f.name
ORDER BY p.xp DESC, p.reputation DESC
LIMIT 100;
```

## Backup and Maintenance

### Recommended Backup Strategy

- **Full backup**: Daily at 2 AM
- **Incremental backup**: Every 6 hours
- **WAL archiving**: Continuous
- **Retention**: 30 days for full backups, 7 days for incrementals

### Maintenance Tasks

```sql
-- Vacuum and analyze (run weekly)
VACUUM ANALYZE;

-- Reindex (run monthly)
REINDEX DATABASE spynet;

-- Clean up expired data (run daily)
DELETE FROM drops WHERE expires_at < now() AND found_by_player_id IS NULL;
DELETE FROM qr_codes WHERE expires_at < now() AND active = TRUE;
DELETE FROM mission_assignments WHERE status = 'expired' AND completed_at < now() - INTERVAL '30 days';
```

## Performance Considerations

1. **Geospatial Queries**: PostGIS indexes are critical for zone containment checks
2. **Event Log**: Consider partitioning or moving to ClickHouse at scale
3. **Redis TTLs**: Ensure presence and beacon data expires automatically
4. **Connection Pooling**: Use PgBouncer for connection management
5. **Read Replicas**: Consider read replicas for analytics queries
