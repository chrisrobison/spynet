# SpyNet AR - API Documentation

## Overview

The SpyNet AR API is a RESTful API with WebSocket support for real-time features. All API endpoints use JSON for request and response bodies.

**Base URL (Development)**: `http://localhost:3000`
**Base URL (Production)**: `https://api.spynet.ar`

## Authentication

### Auth Flow

SpyNet AR uses magic link authentication with JWT tokens.

1. Request magic link: `POST /v1/auth/magic/start`
2. User clicks link in email
3. Exchange token: `POST /v1/auth/magic/verify`
4. Receive access + refresh tokens

### Using Tokens

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

## API Versioning

All endpoints are versioned with `/v1/` prefix. Breaking changes will increment the version number.

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **Mission endpoints**: 30 requests per minute per user
- **QR scan endpoints**: 10 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Error Codes

- `INVALID_REQUEST`: Malformed request
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## API Endpoints

### Authentication

#### Request Magic Link
```http
POST /v1/auth/magic/start
Content-Type: application/json

{
  "email": "agent@spynet.com"
}
```

**Response**: `200 OK`
```json
{
  "message": "Magic link sent to agent@spynet.com"
}
```

#### Verify Magic Link
```http
POST /v1/auth/magic/verify
Content-Type: application/json

{
  "token": "magic_link_token_from_email"
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

### Players

#### Get Current Player Profile
```http
GET /v1/player/me
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "handle": "agent007",
  "rank": 15,
  "xp": 12450,
  "credits": 350,
  "reputation": 890,
  "faction": {
    "id": "faction-uuid",
    "name": "The Obsidian Order",
    "code": "obsidian"
  },
  "is_double_agent": false,
  "stats": {
    "missions_completed": 47,
    "qr_codes_scanned": 23,
    "agents_spotted": 15,
    "drops_found": 31,
    "zones_captured": 3
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Update Player Profile
```http
PATCH /v1/player/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "profile_data": {
    "bio": "Master of stealth",
    "avatar_url": "https://..."
  }
}
```

**Response**: `200 OK`

#### Get Player Inventory
```http
GET /v1/player/me/inventory
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "item-uuid",
      "item_type": "data_cache",
      "name": "Encrypted Data Cache",
      "rarity": "rare",
      "quantity": 3,
      "acquired_at": "2025-01-15T14:22:00Z"
    }
  ]
}
```

### Zones

#### Get Nearby Zones
```http
GET /v1/zones/near?lat=37.7749&lon=-122.4194&radius=5000
Authorization: Bearer <token>
```

**Query Parameters**:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `radius` (optional): Search radius in meters (default: 1000, max: 10000)

**Response**: `200 OK`
```json
{
  "zones": [
    {
      "id": "zone-uuid",
      "name": "Mission District",
      "slug": "mission-district",
      "zone_type": "meso",
      "controlling_faction": {
        "id": "faction-uuid",
        "name": "The Aurora Syndicate",
        "code": "aurora"
      },
      "control_score": {
        "obsidian": 450,
        "aurora": 890,
        "citadel": 320
      },
      "distance_meters": 342,
      "is_contested": true
    }
  ]
}
```

#### Get Zone Details
```http
GET /v1/zones/:zoneId
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "zone-uuid",
  "name": "Mission District",
  "slug": "mission-district",
  "city": "San Francisco",
  "zone_type": "meso",
  "controlling_faction": {...},
  "control_score": {...},
  "capture_threshold": 1000,
  "active_players": 23,
  "recent_activity": [
    {
      "event": "mission_completed",
      "faction": "aurora",
      "timestamp": "2025-01-15T15:30:00Z"
    }
  ]
}
```

### Missions

#### Get Available Missions
```http
GET /v1/missions?status=available&zone_id=zone-uuid
Authorization: Bearer <token>
```

**Query Parameters**:
- `status`: `available`, `assigned`, `in_progress`, `completed`
- `zone_id`: Filter by zone
- `kind`: Filter by mission type
- `difficulty`: Filter by difficulty (1-5)

**Response**: `200 OK`
```json
{
  "missions": [
    {
      "id": "mission-uuid",
      "kind": "qr_scan",
      "title": "Retrieve Dead Drop",
      "description": "Scan the QR code at Dolores Park to retrieve classified intel",
      "difficulty": 2,
      "zone": {
        "id": "zone-uuid",
        "name": "Mission District"
      },
      "requires_field_presence": true,
      "rewards": {
        "xp": 120,
        "credits": 30,
        "faction_points": 10
      },
      "expires_at": "2025-01-16T18:00:00Z"
    }
  ]
}
```

#### Accept Mission
```http
POST /v1/missions/:missionId/accept
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "assignment": {
    "mission_id": "mission-uuid",
    "player_id": "player-uuid",
    "status": "assigned",
    "assigned_at": "2025-01-15T16:00:00Z"
  }
}
```

#### Update Mission Progress
```http
POST /v1/missions/:missionId/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": {
    "checkpoints_completed": 2,
    "distance_traveled": 350
  }
}
```

**Response**: `200 OK`

#### Complete Mission
```http
POST /v1/missions/:missionId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "evidence": {
    "qr_code": "scanned_code",
    "location": {
      "lat": 37.7749,
      "lon": -122.4194
    }
  }
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "rewards": {
    "xp": 120,
    "credits": 30,
    "faction_points": 10,
    "items": []
  },
  "narrative": {
    "title": "Dead Drop Retrieved",
    "message": "You've successfully retrieved the encrypted data. The Aurora Syndicate will be pleased..."
  }
}
```

### QR Codes

#### Scan QR Code
```http
POST /v1/qr/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "Q7MX93",
  "jwt": "eyJhbGciOiJFUzI1NiIs...",
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "wifi_hash": "hashed_wifi_fingerprint"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "qr_type": "mission",
  "mission": {
    "id": "mission-uuid",
    "title": "Infiltrate Enemy Territory",
    "accepted": true
  },
  "rewards": {
    "xp": 50,
    "credits": 10
  },
  "narrative": {
    "message": "The dead drop contains coordinates to an enemy safehouse..."
  }
}
```

### Proximity & Encounters

#### Report BLE Beacons
```http
POST /v1/presence/beacon
Authorization: Bearer <token>
Content-Type: application/json

{
  "eph_ids": [
    "a7f3b2e1c9d4...",
    "e8d2c3a5b1f6..."
  ],
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  }
}
```

**Response**: `200 OK`
```json
{
  "nearby": [
    {
      "player_id": "player-uuid",
      "handle": "shadow_agent",
      "faction": "citadel",
      "strength": 0.8,
      "can_interact": true
    }
  ],
  "missions": [
    {
      "id": "mission-uuid",
      "title": "Spot the Mole",
      "triggered": true
    }
  ]
}
```

### Drops

#### Get Nearby Drops
```http
GET /v1/drops/near?lat=37.7749&lon=-122.4194&radius=500
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "drops": [
    {
      "id": "drop-uuid",
      "item": {
        "id": "item-uuid",
        "name": "Gold Coin",
        "rarity": "common"
      },
      "distance_meters": 127,
      "expires_at": "2025-01-16T12:00:00Z"
    }
  ]
}
```

#### Create Drop
```http
POST /v1/drops
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "item-uuid",
  "quantity": 1,
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "expires_in": 86400
}
```

**Response**: `201 Created`

#### Collect Drop
```http
POST /v1/drops/:dropId/collect
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  }
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "item": {
    "id": "item-uuid",
    "name": "Gold Coin",
    "quantity": 1
  },
  "rewards": {
    "xp": 25
  }
}
```

### Factions

#### Get All Factions
```http
GET /v1/factions
```

**Response**: `200 OK`
```json
{
  "factions": [
    {
      "id": "faction-uuid",
      "code": "obsidian",
      "name": "The Obsidian Order",
      "description": "Masters of deception...",
      "player_count": 1247,
      "zones_controlled": 15
    }
  ]
}
```

#### Get Faction State
```http
GET /v1/factions/state?city=san-francisco
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "city": "San Francisco",
  "factions": {
    "obsidian": {
      "zones_controlled": 15,
      "total_score": 45680,
      "active_players": 342
    },
    "aurora": {
      "zones_controlled": 18,
      "total_score": 52340,
      "active_players": 401
    },
    "citadel": {
      "zones_controlled": 12,
      "total_score": 38920,
      "active_players": 298
    }
  }
}
```

#### Join Faction
```http
POST /v1/factions/:factionId/join
Authorization: Bearer <token>
```

**Response**: `200 OK`

### Narrative

#### Get Recent Broadcasts
```http
GET /v1/narrative/broadcasts?type=faction
Authorization: Bearer <token>
```

**Query Parameters**:
- `type`: `global`, `city`, `faction`, `zone`, `player`
- `limit`: Number of broadcasts (default: 20)

**Response**: `200 OK`
```json
{
  "broadcasts": [
    {
      "id": "broadcast-uuid",
      "type": "faction",
      "title": "Control Point Lost",
      "content": "The Obsidian Order has captured Embarcadero Station. Aurora agents must respond immediately.",
      "created_at": "2025-01-15T17:00:00Z"
    }
  ]
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_access_token'
  }));
};
```

### Events

#### Subscribe to Zone
```json
{
  "type": "subscribe",
  "channel": "zone:zone-uuid"
}
```

#### Subscribe to Faction
```json
{
  "type": "subscribe",
  "channel": "faction:obsidian"
}
```

#### Receive Updates
```json
{
  "type": "zone_update",
  "zone_id": "zone-uuid",
  "data": {
    "control_score": {...},
    "controlling_faction": "aurora"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { SpyNetClient } from '@spynet/sdk';

const client = new SpyNetClient({
  baseUrl: 'https://api.spynet.ar',
  apiKey: process.env.SPYNET_API_KEY
});

// Get player profile
const profile = await client.players.me();

// Accept mission
const mission = await client.missions.accept('mission-uuid');

// Scan QR code
const result = await client.qr.scan({
  code: 'Q7MX93',
  jwt: 'eyJ...',
  location: { lat: 37.7749, lon: -122.4194 }
});
```

### Python

```python
from spynet import SpyNetClient

client = SpyNetClient(
    base_url="https://api.spynet.ar",
    api_key=os.environ["SPYNET_API_KEY"]
)

# Get player profile
profile = client.players.me()

# Accept mission
mission = client.missions.accept("mission-uuid")

# Scan QR code
result = client.qr.scan(
    code="Q7MX93",
    jwt="eyJ...",
    location={"lat": 37.7749, "lon": -122.4194}
)
```

## Testing

### Postman Collection

Import the Postman collection from `docs/api/spynet-ar.postman_collection.json`.

### cURL Examples

See individual endpoint documentation above.

## Changelog

### v1.0.0 (TBD)
- Initial API release
- Player management
- Mission system
- Zone control
- QR code scanning
- BLE proximity
- WebSocket support

## Support

For API support:
- GitHub Issues: https://github.com/yourusername/spynet-ar/issues
- Email: dev@spynet.ar
- Discord: [Join our server]
