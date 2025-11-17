# SpyNet AR - Lean MVP Implementation Plan

## Executive Summary

This document outlines a **realistic, achievable path** to building SpyNet AR as a web-first prototype that validates core gameplay before investing in mobile apps, AR, or complex infrastructure.

**Key Principle**: Build the minimum viable game that's actually fun to play, then iterate based on real user feedback.

---

## Philosophy: Why Lean?

### The Problem with the Original Plan
- **Too broad**: AR, BLE, mobile apps, microservices, Kubernetes
- **Too expensive**: $10-30K/month burn rate
- **Too risky**: 95% of code doesn't exist yet
- **Too slow**: 12-18 months to first playable version

### The Lean MVP Approach
- **Focused**: Web-only, QR codes, zones, factions
- **Affordable**: $50-150/month total costs
- **Low risk**: Validate gameplay in 6 weeks
- **Fast**: Playable prototype in 6 weeks, beta in 12 weeks

### Success Criteria
**This MVP succeeds if:**
1. You personally find it fun to play
2. 3 friends try it and 2 come back the next day
3. Players complete 3+ missions in their first session
4. The core loop works without bugs

**This MVP fails if:**
1. You get bored playing it yourself
2. Friends try once and never return
3. It feels like a chore, not a game
4. Too many bugs or confusing UX

---

## Phase 1: Playable Prototype (Weeks 1-6)

### Goal
**One person can play the full game loop for 30 minutes and have fun.**

### What You're Building

#### 1. Player Experience
```
User Flow:
1. Visit website on mobile browser
2. Sign up (email + password)
3. Choose a faction (Obsidian/Aurora/Citadel)
4. See map with 5 zones and 5 QR codes
5. Walk to a QR code location
6. Scan QR code with camera
7. Read mission briefing (AI-generated flavor text)
8. Get rewards (XP, credits, zone progress)
9. Check leaderboard
10. Go find next QR code
```

#### 2. Core Features (MVP)

**Authentication**
- [ ] Email/password signup
- [ ] Login with JWT tokens
- [ ] Remember me (localStorage)
- [ ] Logout
- **No OAuth, no magic links, no 2FA yet**

**Player Profile**
- [ ] Handle (unique username)
- [ ] Faction selection (one-time choice)
- [ ] XP and rank display
- [ ] Credits balance
- [ ] Mission history

**Map View**
- [ ] Leaflet.js map centered on city
- [ ] 5 zones displayed as polygons
- [ ] 5 QR code markers
- [ ] Player location (blue dot)
- [ ] Faction colors for zone control
- **No real-time updates, refresh to see changes**

**QR Code Scanner**
- [ ] Browser camera access
- [ ] jsQR library for scanning
- [ ] Validate QR code is real
- [ ] Check location proximity (100m radius)
- [ ] Display mission briefing
- [ ] Award rewards

**Missions (Pre-Written)**
```
Mission 1: "The Dead Drop"
- Location: Coffee shop at 123 Main St
- Type: QR scan
- Briefing: "An asset left intel at [location]. Retrieve it without being noticed."
- Reward: 100 XP, 50 credits

Mission 2: "Territory Surveillance"
- Location: Park at 456 Oak Ave
- Type: QR scan
- Briefing: "Scout enemy activity in [zone]. Document their movements."
- Reward: 150 XP, 75 credits

Mission 3-5: Similar structure
```

**Zone Control (Simplified)**
- [ ] Each zone tracks score per faction
- [ ] Scanning QR in a zone adds 100 points to your faction
- [ ] Zone belongs to faction with highest score
- [ ] Recalculate on each scan
- **No decay, no complex formulas yet**

**Leaderboard**
- [ ] Top 10 players by XP
- [ ] Filter by faction
- [ ] Show rank, handle, XP, faction
- **Update on page load, not real-time**

#### 3. Tech Implementation

**Frontend Structure**
```
public/
├── index.html          # Shell with nav
├── components/
│   ├── auth/
│   │   ├── login.mjs
│   │   └── signup.mjs
│   ├── game/
│   │   ├── map-view.mjs
│   │   ├── qr-scanner.mjs
│   │   ├── mission-briefing.mjs
│   │   └── profile.mjs
│   ├── faction/
│   │   └── faction-selector.mjs
│   └── leaderboard/
│       └── leaderboard.mjs
├── js/
│   ├── api.js          # API client
│   ├── router.js       # Client-side routing
│   └── utils.js        # Helpers
└── assets/
    ├── css/
    │   └── theme.css
    └── img/
        └── faction-*.png
```

**Backend Endpoints**
```
POST   /auth/register   # Create account
POST   /auth/login      # Get JWT token
GET    /auth/me         # Get current user

GET    /players/:id     # Get player profile
PATCH  /players/:id     # Update profile
GET    /players/leaderboard  # Top players

GET    /zones           # List all zones
GET    /zones/:id       # Get zone details

GET    /missions        # List available missions
GET    /missions/:id    # Get mission details

POST   /qr/scan         # Validate and process scan
  Body: { code, lat, lon }
  Returns: { success, mission, rewards }

GET    /qr/validate/:code  # Check if code is valid
```

**Database Updates (Minimal)**
```sql
-- Add faction selection tracking
ALTER TABLE players ADD COLUMN faction_selected_at TIMESTAMPTZ;

-- Add mission completion tracking
CREATE TABLE mission_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id),
  mission_id UUID NOT NULL REFERENCES missions(id),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, mission_id)
);

-- Add zone contribution tracking
CREATE TABLE zone_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES zones(id),
  player_id UUID NOT NULL REFERENCES players(id),
  faction_id UUID NOT NULL REFERENCES factions(id),
  points INTEGER NOT NULL DEFAULT 100,
  contributed_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Content Creation

**Physical QR Codes**
1. Generate 5 QR codes containing signed JWTs
2. Print on waterproof paper or laminate
3. Place at 5 locations in one neighborhood:
   - Coffee shop (high traffic)
   - Park (open space)
   - Bookstore (indoor option)
   - Street corner (public area)
   - Restaurant (evening hours)

**Zone Definitions**
```sql
-- Define 5 zones covering your test area
INSERT INTO zones (name, slug, city, zone_type, polygon, center_point) VALUES
  (
    'Downtown Core',
    'downtown-core',
    'YourCity',
    'meso',
    ST_GeographyFromText('POLYGON((...))', -- your coordinates
    ST_GeographyFromText('POINT(...)')
  );
  -- Repeat for 4 more zones
```

**Mission Content**
Write 5 compelling mission briefings that make scanning QR codes feel like spy work, not a treasure hunt.

#### 5. AI Integration (Minimal)

**What AI Does (Phase 1)**
- Generate mission briefing variations
- Create player codenames on signup
- Write faction status updates

**What AI Doesn't Do (Phase 1)**
- Generate missions dynamically
- Adapt to player behavior
- Create procedural content

**Implementation**
```javascript
// Simple AI helper for mission briefings
async function generateMissionBriefing(missionTemplate, playerContext) {
  // Check cache first
  const cacheKey = `briefing:${missionTemplate.id}:${playerContext.faction}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Generate with LLM (fallback to template)
  try {
    const prompt = `You are a spy handler. Write a 2-sentence mission briefing for:
    Mission: ${missionTemplate.description}
    Faction: ${playerContext.faction}
    Location: ${missionTemplate.location}
    Style: Terse, professional, urgent.`;

    const response = await llm.chat(prompt);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, response);
    return response;
  } catch (error) {
    // Fallback to template
    return missionTemplate.defaultBriefing;
  }
}
```

### Week-by-Week Breakdown

**Week 1: Foundation**
- [ ] Set up database schema
- [ ] Implement auth endpoints
- [ ] Build login/signup UI
- [ ] Test authentication flow

**Week 2: Map & Data**
- [ ] Integrate Leaflet.js
- [ ] Create 5 zones in database
- [ ] Display zones on map
- [ ] Show player location
- [ ] Create 5 missions

**Week 3: QR System**
- [ ] Generate 5 QR codes
- [ ] Build QR scanner component
- [ ] Implement scan validation endpoint
- [ ] Test location proximity check
- [ ] Print and place QR codes

**Week 4: Gameplay Loop**
- [ ] Mission briefing display
- [ ] Reward distribution
- [ ] XP and credits tracking
- [ ] Zone contribution system
- [ ] Profile page

**Week 5: Social Features**
- [ ] Faction selector on signup
- [ ] Leaderboard implementation
- [ ] Zone control visualization
- [ ] Faction comparison view

**Week 6: Polish & Test**
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] PWA manifest
- [ ] Test with 3 friends
- [ ] Fix critical bugs

### Success Checklist (End of Phase 1)

**Technical**
- [ ] All 5 QR codes scan successfully
- [ ] Location validation works within 100m
- [ ] Rewards are correctly awarded
- [ ] Zone control updates correctly
- [ ] Leaderboard displays accurately
- [ ] Works on iOS Safari and Android Chrome

**User Experience**
- [ ] Can complete full loop in 30 minutes
- [ ] Mission briefings feel spy-themed
- [ ] Map is easy to navigate
- [ ] QR scanner is reliable
- [ ] Progression feels rewarding

**Validation**
- [ ] You personally enjoy playing it
- [ ] 3 friends try it
- [ ] At least 2 friends return to play again
- [ ] Average 3+ missions completed per session

**If any of these fail, fix before moving to Phase 2.**

---

## Phase 2: Multiplayer Beta (Weeks 7-12)

### Goal
**10-20 active testers playing competitively with 50% day-1 retention.**

### New Features

**Expanded Content**
- [ ] 20 total missions (15 new)
- [ ] 10 zones covering full city
- [ ] 20 QR codes strategically placed

**Social Features**
- [ ] See other players on map (static markers)
- [ ] Faction chat (simple text feed)
- [ ] Mission activity feed
- [ ] Player profiles (view others)

**Competition**
- [ ] Daily/weekly leaderboards
- [ ] Faction score comparison
- [ ] Territory ownership badges
- [ ] Achievement system (simple)

**Retention Features**
- [ ] Daily login bonus (50 credits)
- [ ] Mission refresh system
- [ ] Notifications (web push)
- [ ] Streak tracking

### Metrics to Track

**Engagement**
- Daily active users (DAU)
- Session length (target: 20+ minutes)
- Missions per session (target: 3+)
- Return rate (target: 50% D1, 30% D7)

**Technical**
- QR scan success rate (target: >90%)
- API response times (target: <500ms)
- Error rate (target: <1%)

**Social**
- Players per faction (balance)
- Zone ownership changes per day
- Chat messages per user

### Success Criteria (End of Phase 2)

- [ ] 10+ active players
- [ ] 50% return next day
- [ ] 30% return next week
- [ ] 3+ missions completed per active player
- [ ] All three factions have players
- [ ] No critical bugs

**If these metrics aren't met, don't proceed to Phase 3. Instead:**
1. Interview players to understand what's not working
2. Iterate on core mechanics
3. Simplify or pivot if necessary

---

## Phase 3: Public Launch (Weeks 13-20)

### Goal
**50-100 weekly active players with sustainable engagement.**

### New Features

**Scale**
- [ ] 30+ missions
- [ ] 15+ zones
- [ ] 30+ QR codes

**Community**
- [ ] Faction forums/discussion
- [ ] Player alliances
- [ ] Mission suggestions
- [ ] User-generated codenames

**Polish**
- [ ] Onboarding tutorial
- [ ] Help documentation
- [ ] Better mobile UX
- [ ] Offline capability (PWA)
- [ ] Performance optimization

**Growth**
- [ ] Referral system
- [ ] Social media sharing
- [ ] Local business partnerships
- [ ] Press kit

### Launch Plan

**Week 13-14: Pre-Launch**
- Create landing page
- Build social media presence
- Reach out to local news
- Recruit beta testers from Phase 2

**Week 15-16: Soft Launch**
- Open to 50 players
- Monitor for bugs
- Gather feedback
- Iterate quickly

**Week 17-20: Growth**
- Expand to 100 players
- Add content based on feedback
- Optimize retention mechanics
- Plan monetization (if successful)

### Success Criteria (End of Phase 3)

**Quantitative**
- [ ] 50+ weekly active users
- [ ] 40% D7 retention
- [ ] 20% D30 retention
- [ ] 10+ missions per active player
- [ ] <5% error rate

**Qualitative**
- [ ] Positive user feedback
- [ ] Organic word-of-mouth growth
- [ ] Clear path to 100+ players
- [ ] Sustainable cost structure
- [ ] Fun to play (most important!)

**If Phase 3 succeeds**, consider:
- Building mobile apps
- Adding AR features
- Real-time multiplayer
- Advanced AI systems
- Multi-city expansion
- Monetization

**If Phase 3 fails**, consider:
- Pivoting to a simpler concept
- Open-sourcing the project
- Sunsetting gracefully
- Applying learnings to next project

---

## Cost Budget (Per Phase)

### Phase 1 Costs (Weeks 1-6)
- **Development**: $0 (your time)
- **Hosting**: $0 (local development)
- **Domain**: $12/year
- **QR Code Printing**: $10
- **Total**: ~$25

### Phase 2 Costs (Weeks 7-12)
- **VPS Hosting**: $20/month × 2 = $40
- **Domain + SSL**: $10
- **LLM API**: $20 (light usage)
- **QR Printing**: $20 (15 more codes)
- **Total**: ~$90

### Phase 3 Costs (Weeks 13-20)
- **VPS Hosting**: $40/month × 2 = $80
- **LLM API**: $50/month × 2 = $100
- **Domain/SSL**: $10
- **Marketing**: $100 (optional)
- **Total**: ~$290

**Grand Total for 20 Weeks**: ~$400

Compare this to original plan: $10-30K/month 🎯

---

## Technology Decisions Explained

### Why Web-First?
- ✅ No app store approval delays
- ✅ Instant updates without app releases
- ✅ Works on all platforms
- ✅ Easier to debug and iterate
- ✅ Lower development complexity
- ❌ Camera access requires HTTPS
- ❌ Less "native" feel
- ❌ Can't use AR frameworks

**Verdict**: Worth the tradeoffs for MVP

### Why Vanilla JavaScript?
- ✅ No build step = faster iteration
- ✅ No framework learning curve
- ✅ Smaller bundle size
- ✅ Direct browser debugging
- ❌ More boilerplate code
- ❌ No React ecosystem

**Verdict**: Simplicity wins for MVP

### Why PostgreSQL + PostGIS?
- ✅ Geospatial queries built-in
- ✅ Proven at scale
- ✅ ACID transactions
- ✅ JSON support for flexibility
- ❌ Heavier than SQLite
- ❌ Requires separate server

**Verdict**: Worth it for location features

### Why No Real-Time?
- ✅ Simpler architecture
- ✅ Lower hosting costs
- ✅ Fewer edge cases
- ✅ Easier to debug
- ❌ Less "live" feel
- ❌ Delayed leaderboard updates

**Verdict**: Not needed for MVP gameplay

### Why Limited AI?
- ✅ Predictable costs
- ✅ Faster responses (caching)
- ✅ No API rate limit issues
- ✅ Still provides value (flavor text)
- ❌ Less "magic"
- ❌ More manual content creation

**Verdict**: AI is flavor, not core mechanic

---

## Risk Mitigation

### Technical Risks

**Risk**: QR scanning doesn't work reliably on all devices
- **Mitigation**: Test on iOS Safari, Android Chrome from day 1
- **Fallback**: Manual code entry option

**Risk**: Location spoofing
- **Mitigation**: Accept it for MVP, add checks in Phase 2
- **Fallback**: Trust players initially, ban cheaters if needed

**Risk**: Database gets expensive
- **Mitigation**: Start small, optimize queries, add indexes
- **Fallback**: SQLite for single-VPS deployment

**Risk**: AI costs explode
- **Mitigation**: Heavy caching, fallback to templates
- **Fallback**: Pre-generate all content, skip AI entirely

### Product Risks

**Risk**: Core gameplay isn't fun
- **Mitigation**: Test with friends in Week 6
- **Fallback**: Pivot mechanics before Phase 2

**Risk**: Not enough players
- **Mitigation**: Start with friends, use local networks
- **Fallback**: Acceptable for MVP, pivot if Phase 2 fails

**Risk**: QR codes get vandalized/stolen
- **Mitigation**: Use durable materials, place strategically
- **Fallback**: Re-print codes, work with venues

**Risk**: No organic growth
- **Mitigation**: Focus on retention over acquisition
- **Fallback**: Acceptable for MVP, reassess in Phase 3

---

## Decision Points

### After Phase 1 (Week 6)
**Question**: Is the core loop fun?

**If YES**: Proceed to Phase 2
**If NO**: Iterate on mechanics for 2 more weeks, then re-evaluate
**If MAYBE**: Test with 5 more people, gather specific feedback

### After Phase 2 (Week 12)
**Question**: Are players coming back?

**If 50%+ D1 retention**: Proceed to Phase 3
**If 30-50% D1 retention**: Improve retention features, retest
**If <30% D1 retention**: Major pivot or sunset

### After Phase 3 (Week 20)
**Question**: Is this viable long-term?

**If 50+ WAU + 40% D7**: Scale up, consider funding
**If 20-50 WAU + 30% D7**: Keep improving, stay lean
**If <20 WAU**: Sunset gracefully, apply learnings

---

## Next Steps (Immediate)

1. **Read this document fully** ✓
2. **Update remaining docs** (GETTING_STARTED, tech-stack)
3. **Set up local environment**
   - Docker Compose up
   - Database initialized
   - API server running
4. **Start Week 1 tasks**
   - Auth endpoints
   - Login UI
   - Signup flow
5. **Create mission content**
   - Write 5 mission briefings
   - Define 5 zones
   - Scout 5 QR locations in your city

---

## Appendix: What We Learned

### From Original Plan
✅ **Good ideas to keep:**
- QR code mechanics (core to MVP)
- Faction system (simplified but present)
- Territory control (simplified formula)
- AI for flavor text (cost-controlled)
- PostgreSQL + PostGIS (right tool)

❌ **Ideas to defer:**
- Mobile apps (web-first faster)
- AR overlays (complexity without validation)
- BLE proximity (nice-to-have)
- Microservices (premature)
- Kubernetes (overkill)
- Real-time WebSocket (not core to fun)
- Dynamic AI missions (too expensive unvalidated)

### Key Insights
1. **Scope creep kills MVPs** - Every feature must earn its place
2. **Fun > Features** - 5 good missions beat 50 mediocre ones
3. **Validate before scaling** - Don't build infrastructure before product-market fit
4. **Cost discipline matters** - $400 budget forces good decisions
5. **Users don't care about tech** - They care if it's fun

---

**Remember**: The goal is not to build the perfect game. The goal is to build a playable game, test it with real people, and learn what works. Then iterate.

Good luck, agent. 🕵️
