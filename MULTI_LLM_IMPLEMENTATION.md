# Multi-LLM Implementation Summary

This document summarizes the multi-LLM provider support added to SpyNet.

## Overview

SpyNet now supports multiple LLM providers with the ability to:
- Configure multiple providers (OpenAI, Anthropic, local models, custom endpoints)
- Switch between providers at runtime
- Automatic fallback if a provider fails
- Environment-based configuration
- Type-safe TypeScript implementation

## Files Added/Modified

### Configuration Files

1. **`.env.example`** (modified)
   - Added configuration for 4 provider types
   - Each provider has: enabled flag, API key, base URL, model, max tokens, temperature
   - Added behavior settings: timeout, retries, retry delay
   - Location: `/home/cdr/domains/cdr2.com/www/spynet/.env.example:29-71`

### Package: @spynet/llm-config

Created new shared package at `/home/cdr/domains/cdr2.com/www/spynet/packages/llm-config/`

#### Core Files

2. **`package.json`**
   - Package metadata and dependencies
   - Uses zod for validation

3. **`tsconfig.json`**
   - TypeScript configuration

4. **`src/types.ts`**
   - TypeScript types and interfaces
   - Zod schemas for validation
   - Custom error classes
   - LLMClient interface

5. **`src/config-loader.ts`**
   - Loads configuration from environment variables
   - Validates configuration
   - Provides helper methods for active provider

6. **`src/client-factory.ts`**
   - OpenAI-compatible client implementation
   - Factory for creating clients
   - Works with all OpenAI-compatible APIs

7. **`src/manager.ts`**
   - Main LLMManager class
   - Provider switching
   - Automatic fallback
   - Simple chat interface

8. **`src/index.ts`**
   - Package exports

#### Documentation

9. **`README.md`**
   - Complete package documentation
   - Usage examples
   - Configuration guide
   - API reference

10. **`.gitignore`**
    - Package-specific ignore rules

#### Examples

11. **`examples/basic-usage.ts`**
    - Simple usage examples
    - Provider switching
    - Connection testing

12. **`examples/mission-generation.ts`**
    - Real-world mission generation scenarios
    - Smart routing by task complexity
    - Cost optimization strategies

### Documentation Updates

13. **`docs/ai-orchestration.md`** (modified)
    - Updated architecture diagram
    - Added LLM Provider Configuration section
    - Usage examples

14. **`docs/LLM_SETUP.md`** (new)
    - Complete setup guide
    - Provider-specific instructions
    - Troubleshooting
    - Best practices

## Provider Support

### Supported Providers

1. **OpenAI (GPT-4, GPT-3.5)**
   - Base URL: `https://api.openai.com/v1`
   - Best for: Production, complex reasoning

2. **Anthropic (Claude 3.5)**
   - Base URL: `https://api.anthropic.com/v1`
   - Best for: Narrative generation, safety

3. **Local Models (Ollama, LM Studio)**
   - Base URL: `http://localhost:11434/v1` (Ollama)
   - Base URL: `http://localhost:1234/v1` (LM Studio)
   - Best for: Development, cost savings, privacy

4. **Custom Endpoints**
   - Any OpenAI-compatible API
   - Examples: Together AI, Groq, Perplexity

## Key Features

### Dynamic Provider Switching

```typescript
const llm = new LLMManager();

// Use OpenAI for complex tasks
llm.switchProvider('openai');
const complex = await llm.chat([...]);

// Use local for simple tasks
llm.switchProvider('local');
const simple = await llm.chat([...]);
```

### Automatic Fallback

```typescript
// Tries active provider first, then others if it fails
const response = await llm.chatWithFallback([...]);
console.log(`Used: ${response.usedProvider}`);
```

### Simple Interface

```typescript
// One-liner for simple requests
const response = await llm.simpleChat('Generate a spy codename');
```

### Connection Testing

```typescript
// Test all providers
const results = await llm.testAllConnections();
// Returns: Map<'openai' | 'anthropic' | 'local' | 'custom', boolean>
```

## Configuration Example

Minimal `.env` configuration:

```env
# Active provider
LLM_ACTIVE_PROVIDER=openai

# OpenAI setup
LLM_OPENAI_ENABLED=true
LLM_OPENAI_API_KEY=sk-...
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_MODEL=gpt-4

# Local model setup
LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:11434/v1
LLM_LOCAL_MODEL=llama3.1:70b
```

## Use Cases

### Development
- Use local models (free, fast, private)
- OpenAI as secondary for testing

### Production
- OpenAI as primary (reliable, high quality)
- Local as fallback for simple tasks

### Cost Optimization
- Local as primary (free)
- Cloud as fallback only when needed
- Use `chatWithFallback()` method

### Task Routing
- Complex reasoning → OpenAI GPT-4
- Creative writing → Anthropic Claude
- Simple tasks → Local models
- High throughput → Custom endpoints (Groq)

## Integration Points

### In Services

```typescript
import { LLMManager } from '@spynet/llm-config';

class MissionService {
  private llm: LLMManager;

  constructor() {
    this.llm = new LLMManager();
  }

  async generateMission(playerId: string) {
    // Use configured LLM
    const mission = await this.llm.simpleChat(
      `Generate mission for player ${playerId}`,
      'You are a spy mission director'
    );
    return mission;
  }
}
```

### In Python Orchestrator

The package is TypeScript-based for Node.js services. For Python orchestrator:

```python
import os
from openai import OpenAI

# Read same env vars
client = OpenAI(
    api_key=os.getenv('LLM_OPENAI_API_KEY'),
    base_url=os.getenv('LLM_OPENAI_BASE_URL')
)

# Can switch by changing env vars or using different clients
```

## Next Steps

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure at least one provider**
   - Add API key for OpenAI/Anthropic, OR
   - Install and run Ollama for local models

3. **Install package dependencies**
   ```bash
   cd packages/llm-config
   pnpm install
   pnpm build
   ```

4. **Test configuration**
   ```bash
   npx tsx examples/basic-usage.ts
   ```

5. **Integrate into services**
   - Import `LLMManager` from `@spynet/llm-config`
   - Use in mission generation, narrative, etc.

## Benefits

✅ **Flexibility**: Switch between providers without code changes
✅ **Cost Control**: Use free local models for development/simple tasks
✅ **Reliability**: Automatic fallback if primary provider fails
✅ **Privacy**: Option to use local models for sensitive data
✅ **Development Speed**: Fast local models for iteration
✅ **Production Ready**: Enterprise-grade cloud providers for production
✅ **Type Safety**: Full TypeScript support with validation

## Documentation

- **Setup Guide**: `docs/LLM_SETUP.md`
- **Package README**: `packages/llm-config/README.md`
- **AI Architecture**: `docs/ai-orchestration.md`
- **Examples**: `packages/llm-config/examples/`

## Questions?

See troubleshooting section in `docs/LLM_SETUP.md` or open a GitHub issue.
