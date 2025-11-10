# SpyNet AR - AI Orchestration System

## Overview

The SpyNet Intelligence Network (SIN) is an AI-driven orchestration engine that powers the dynamic mission system, narrative generation, and adaptive gameplay. It uses a Large Language Model (LLM) with tool-calling capabilities to create emergent storylines and personalized player experiences.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    AI Orchestrator                       │
│                    (Python FastAPI)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Mission    │  │  Narrative   │  │   Faction    │ │
│  │   Director   │  │   Engine     │  │  Strategist  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         LLM (GPT-4 / Claude / Local)             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              RAG Knowledge Base                   │  │
│  │         (Game Docs + Player History)             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌───────────┐        ┌───────────┐       ┌───────────┐
    │  Game API │        │ Postgres  │       │   Redis   │
    └───────────┘        └───────────┘       └───────────┘
```

## Core Systems

### 1. Mission Director

The Mission Director analyzes player behavior, faction dynamics, and world state to generate appropriate missions.

#### Responsibilities
- Generate missions based on player skill, location, and faction
- Adapt mission difficulty based on player performance
- Create interconnected mission chains
- Balance field vs. remote operations
- Trigger faction-specific storylines

#### Process Flow

```python
def generate_mission(player_id: str) -> Mission:
    # 1. Gather context
    player_context = get_player_context(player_id)
    zone_state = get_zone_snapshot(player_context.current_zone)
    faction_state = get_faction_state(player_context.faction)

    # 2. Query knowledge base
    relevant_docs = query_kb(f"mission types for {player_context.playstyle}")

    # 3. Generate mission with LLM
    mission_spec = llm.generate_mission(
        context={
            "player": player_context,
            "zone": zone_state,
            "faction": faction_state,
            "docs": relevant_docs
        },
        constraints=get_mission_constraints()
    )

    # 4. Validate and create
    validate_mission_spec(mission_spec)
    return create_mission(mission_spec)
```

### 2. Narrative Engine

Generates contextual narrative content, faction briefings, and world events.

#### Features
- Dynamic story generation based on player actions
- Faction-specific narrative voice
- Contextual mission descriptions
- World event announcements
- Player dossier updates

#### Example Prompt

```python
NARRATIVE_SYSTEM_PROMPT = """
You are the SpyNet Intelligence Network narrative director.
Generate immersive spy fiction content that:

1. Maintains faction identity and voice
2. References real-world locations in {city}
3. Creates tension and urgency
4. Connects to ongoing faction wars
5. Personalizes based on player history

Tone: Serious espionage thriller with subtle dark humor.
Length: 2-4 sentences for briefings, 1-2 paragraphs for broadcasts.
"""
```

### 3. Faction Strategist

Manages faction-level decisions and zone control strategy.

#### Capabilities
- Allocate faction pressure to contested zones
- Trigger faction-wide operations
- Identify strategic targets
- Coordinate multi-player missions
- Manage faction resource allocation

## Tool Functions

The AI has access to these tool functions to interact with the game world:

### Player Tools

```python
@tool
def get_player_context(player_id: str) -> PlayerContext:
    """
    Get comprehensive player profile including:
    - Current location and zone
    - Faction allegiance
    - Skill profile (stealthy, aggressive, analytical)
    - Recent mission history
    - Playstyle preferences
    - Success/failure rates
    """
    pass

@tool
def get_player_dossier(player_id: str) -> Dossier:
    """
    Get detailed player intelligence:
    - All completed missions
    - Zone activity patterns
    - Faction contributions
    - Rival interactions
    - Reliability score
    """
    pass
```

### Zone Tools

```python
@tool
def get_zone_snapshot(zone_id: str) -> ZoneSnapshot:
    """
    Get current zone state:
    - Control meters
    - Active players by faction
    - Recent activity
    - Contested status
    - Available QR codes
    """
    pass

@tool
def get_zone_heatmap(city: str) -> Heatmap:
    """
    Get city-wide activity distribution:
    - Player density by zone
    - Faction control map
    - Hot zones (high activity)
    - Strategic targets
    """
    pass
```

### Mission Tools

```python
@tool
def issue_mission(player_id: str, spec: MissionSpec) -> Mission:
    """
    Create and assign a mission to a player.
    Validates spec, creates mission record, sends notification.
    """
    pass

@tool
def update_mission_difficulty(mission_id: str, difficulty: int) -> None:
    """
    Adjust mission difficulty based on player performance.
    """
    pass

@tool
def create_mission_chain(specs: List[MissionSpec]) -> List[Mission]:
    """
    Create interconnected mission sequence.
    """
    pass
```

### Communication Tools

```python
@tool
def message_players(player_ids: List[str], payload: MessagePayload) -> None:
    """
    Send narrative message to specific players.
    Types: briefing, intel, warning, reward
    """
    pass

@tool
def broadcast(
    scope: BroadcastScope,
    content: BroadcastContent
) -> Broadcast:
    """
    Create faction/zone/global broadcast.
    Scopes: global, city, faction, zone
    """
    pass
```

### Analytics Tools

```python
@tool
def score_event(event: GameEvent) -> None:
    """
    Process game event and update control meters.
    Updates faction scores, zone control, player stats.
    """
    pass

@tool
def analyze_faction_balance(city: str) -> BalanceReport:
    """
    Analyze faction power balance and suggest adjustments.
    """
    pass
```

### Knowledge Base Tools

```python
@tool
def query_kb(query: str, doc_filter: Optional[str] = None) -> List[Chunk]:
    """
    RAG query against game design docs and lore.
    Returns: Top 6 relevant chunks with context.
    """
    pass

@tool
def get_mission_templates(kind: str) -> List[Template]:
    """
    Retrieve mission templates for specific type.
    """
    pass
```

## Mission Spec Schema

The AI generates missions according to this schema:

```typescript
interface MissionSpec {
  kind: 'qr_scan' | 'surveillance' | 'cipher' | 'raid' |
        'drop' | 'remote_analysis' | 'social_engineering' |
        'triangulation';

  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;

  zone?: string;  // Zone ID or slug
  target_faction?: string;  // Faction code

  objectives: Objective[];

  rewards: {
    xp: number;
    credits: number;
    faction_points?: number;
    items?: string[];  // Item IDs
  };

  requires_field_presence: boolean;
  expires_in?: number;  // Seconds

  narrative: {
    briefing: string;
    success_message: string;
    failure_message: string;
  };

  metadata?: Record<string, any>;
}

interface Objective {
  type: 'qr_scan' | 'location_visit' | 'time_window' |
        'encounter' | 'item_collect' | 'puzzle_solve';
  params: Record<string, any>;
  optional?: boolean;
}
```

### Example Mission Specs

#### QR Scan Mission
```json
{
  "kind": "qr_scan",
  "title": "Retrieve Dead Drop",
  "description": "Scan the QR code hidden near the Ferry Building clock tower",
  "difficulty": 2,
  "zone": "embarcadero",
  "objectives": [
    {
      "type": "qr_scan",
      "params": {
        "qr_code": "Q7MX93"
      }
    }
  ],
  "rewards": {
    "xp": 120,
    "credits": 30,
    "faction_points": 10
  },
  "requires_field_presence": true,
  "expires_in": 14400,
  "narrative": {
    "briefing": "Intelligence indicates a dead drop containing Aurora Syndicate communications. Retrieve it before enemy agents arrive.",
    "success_message": "Dead drop retrieved. The encrypted data reveals coordinates to an enemy safehouse.",
    "failure_message": "The dead drop has been compromised. Aurora agents arrived first."
  }
}
```

#### Remote Cipher Mission
```json
{
  "kind": "cipher",
  "title": "Decode Intercepted Transmission",
  "description": "Decrypt the intercepted message using frequency analysis",
  "difficulty": 3,
  "objectives": [
    {
      "type": "puzzle_solve",
      "params": {
        "puzzle_id": "cipher_001",
        "encrypted_text": "Wkh Revlgldq Rughu lv sodqqlqj..."
      }
    }
  ],
  "rewards": {
    "xp": 200,
    "credits": 50,
    "faction_points": 15
  },
  "requires_field_presence": false,
  "expires_in": 7200,
  "narrative": {
    "briefing": "We've intercepted a coded transmission from The Obsidian Order. Decode it to reveal their next move.",
    "success_message": "Message decoded: 'The Obsidian Order is planning an assault on Mission District at dawn.'",
    "failure_message": "Time's up. The intelligence is now obsolete."
  }
}
```

## RAG Knowledge Base

### Document Indexing

Game design documents are embedded and stored in PostgreSQL with pgvector:

```sql
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY,
  doc_id TEXT NOT NULL,
  section TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(3072),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX kb_chunks_embedding_idx
  ON kb_chunks USING ivfflat (embedding vector_ip_ops);
```

### Indexed Documents

1. **gameplay.md**: Game mechanics, mission types, progression
2. **tech-stack.md**: Technical constraints, APIs, data models
3. **faction-lore.md**: Faction backgrounds, ideologies, narratives
4. **location-data.md**: SF zones, landmarks, historical context
5. **mission-templates.md**: Pre-designed mission patterns

### Query Process

```python
def query_kb(query: str, limit: int = 6) -> List[Chunk]:
    # 1. Generate query embedding
    query_embedding = embed(query)

    # 2. Vector similarity search
    results = db.execute("""
        SELECT id, doc_id, section, content, metadata
        FROM kb_chunks
        ORDER BY embedding <#> $1
        LIMIT $2
    """, query_embedding, limit)

    # 3. Return with context
    return [
        Chunk(
            content=r.content,
            source=r.doc_id,
            section=r.section,
            relevance=calculate_relevance(r)
        )
        for r in results
    ]
```

## Guardrails & Safety

### Content Filtering

```python
SAFETY_RULES = [
    "No missions in private property without explicit permission",
    "No missions requiring trespassing or illegal activity",
    "No missions in safety-restricted zones (schools, hospitals, etc.)",
    "No missions after curfew hours for minor players",
    "No content promoting violence, discrimination, or harm",
    "No exposure of real player personal information"
]
```

### Mission Validation

```python
def validate_mission_spec(spec: MissionSpec) -> ValidationResult:
    """
    Validate mission before creation:
    1. Check zone blacklist
    2. Verify time constraints
    3. Validate difficulty vs rewards
    4. Check content policy
    5. Verify technical feasibility
    """

    errors = []

    # Zone validation
    if spec.zone in get_blacklisted_zones():
        errors.append("Zone is blacklisted for safety")

    # Time validation
    if spec.requires_field_presence:
        hour = datetime.now().hour
        if hour < 6 or hour > 22:
            errors.append("Field missions not allowed at night")

    # Content validation
    if contains_unsafe_content(spec.narrative):
        errors.append("Narrative violates content policy")

    return ValidationResult(valid=len(errors) == 0, errors=errors)
```

### Rate Limiting

- Mission generation: 1 per player per 5 minutes
- Broadcast creation: 10 per faction per hour
- Player messaging: 50 per player per day

## Monitoring & Metrics

### Key Metrics

```python
METRICS = {
    "mission_acceptance_rate": "% of offered missions accepted",
    "mission_completion_rate": "% of accepted missions completed",
    "narrative_engagement": "Time spent reading vs skipping",
    "faction_balance": "Standard deviation of faction scores",
    "player_retention": "7-day and 30-day retention rates",
    "ai_response_time": "Latency of LLM calls",
    "tool_success_rate": "% of successful tool invocations"
}
```

### Logging

```python
@log_ai_decision
def generate_mission(context):
    logger.info("Generating mission", extra={
        "player_id": context.player_id,
        "zone": context.zone,
        "faction": context.faction,
        "playstyle": context.playstyle
    })

    # ... generation logic ...

    logger.info("Mission generated", extra={
        "mission_id": mission.id,
        "kind": mission.kind,
        "difficulty": mission.difficulty,
        "llm_tokens": response.usage.total_tokens,
        "latency_ms": response.latency
    })
```

## Example Orchestrator Implementation

```python
# services/orchestrator/app.py
from fastapi import FastAPI
from langchain.agents import AgentExecutor
from langchain.tools import tool

app = FastAPI()

# Initialize LLM
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# Define tools
@tool
def get_player_context(player_id: str) -> dict:
    """Get player context for mission generation."""
    return api_client.get(f"/v1/player/{player_id}/context")

@tool
def issue_mission(player_id: str, spec: dict) -> dict:
    """Create and assign mission to player."""
    return api_client.post(f"/v1/missions", json={"player_id": player_id, "spec": spec})

# Create agent
agent = create_agent(
    llm=llm,
    tools=[get_player_context, issue_mission, ...],
    system_prompt=MISSION_DIRECTOR_PROMPT
)

executor = AgentExecutor(agent=agent, tools=tools)

@app.post("/generate-mission/{player_id}")
async def generate_mission(player_id: str):
    result = executor.invoke({
        "input": f"Generate an appropriate mission for player {player_id}"
    })
    return result
```

## Future Enhancements

1. **Multi-Agent Coordination**: Multiple AI agents collaborating (Mission Director + Narrative Engine + Faction Strategist)
2. **Player Modeling**: ML models predicting player churn, preferences, skill
3. **Dynamic Difficulty Adjustment**: Real-time mission difficulty tuning
4. **Procedural Narrative Generation**: Long-form story arcs spanning weeks
5. **Voice Integration**: AI-generated audio briefings
6. **Computer Vision**: Image analysis for AR verification

## References

- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
