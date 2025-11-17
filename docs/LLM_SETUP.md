# LLM Configuration Guide

This guide explains how to configure and use multiple LLM providers in SpyNet.

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Your Providers

Edit `.env` and configure at least one provider:

#### Option A: OpenAI (Recommended for Production)

```env
LLM_ACTIVE_PROVIDER=openai

LLM_OPENAI_ENABLED=true
LLM_OPENAI_API_KEY=sk-your-api-key-here
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_MODEL=gpt-4
```

Get your API key from: https://platform.openai.com/api-keys

#### Option B: Local Model (Free, Offline)

Install Ollama: https://ollama.ai

```bash
# Pull a model
ollama pull llama3.1:70b

# Or for faster testing
ollama pull llama3.1:8b
```

Configure in `.env`:

```env
LLM_ACTIVE_PROVIDER=local

LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:11434/v1
LLM_LOCAL_MODEL=llama3.1:70b
```

#### Option C: Anthropic Claude

```env
LLM_ACTIVE_PROVIDER=anthropic

LLM_ANTHROPIC_ENABLED=true
LLM_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
LLM_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
LLM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Get your API key from: https://console.anthropic.com/

#### Option D: Custom Endpoint

```env
LLM_ACTIVE_PROVIDER=custom

LLM_CUSTOM_ENABLED=true
LLM_CUSTOM_API_KEY=your-api-key
LLM_CUSTOM_BASE_URL=https://api.together.xyz/v1
LLM_CUSTOM_MODEL=meta-llama/Llama-3-70b-chat-hf
```

### 3. Install Dependencies

```bash
cd packages/llm-config
pnpm install
pnpm build
```

### 4. Test Your Configuration

```bash
cd packages/llm-config
npx tsx examples/basic-usage.ts
```

## Multiple Provider Setup

You can enable multiple providers and switch between them:

```env
# Active provider
LLM_ACTIVE_PROVIDER=openai

# Enable all providers
LLM_OPENAI_ENABLED=true
LLM_OPENAI_API_KEY=sk-...
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_MODEL=gpt-4

LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:11434/v1
LLM_LOCAL_MODEL=llama3.1:70b

LLM_ANTHROPIC_ENABLED=true
LLM_ANTHROPIC_API_KEY=sk-ant-...
LLM_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
LLM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Usage Examples

### Basic Usage

```typescript
import { LLMManager } from '@spynet/llm-config';

// Initialize (loads from .env)
const llm = new LLMManager();

// Simple chat
const response = await llm.simpleChat('Generate a spy mission title');
console.log(response);

// Check what you're using
console.log(`Using: ${llm.getActiveProvider()}`);
```

### Switch Providers

```typescript
// Check available providers
console.log(llm.getAvailableProviders()); // ['openai', 'local']

// Switch to local model
llm.switchProvider('local');

// Now all requests use local model
const response = await llm.simpleChat('Hello!');
```

### Smart Routing

```typescript
// Use powerful model for complex tasks
llm.switchProvider('openai');
const complexMission = await llm.simpleChat(
  'Generate a complex multi-stage spy mission with puzzles',
  'You are an expert mission designer'
);

// Use local model for simple tasks
llm.switchProvider('local');
const codename = await llm.simpleChat('Generate a spy codename');
```

### Automatic Fallback

```typescript
// Try active provider, automatically fallback if it fails
const response = await llm.chatWithFallback([
  { role: 'user', content: 'Generate content' }
]);

console.log(`Success using: ${response.usedProvider}`);
```

## Provider Recommendations

### Development
- **Primary**: Local (Ollama) - Free, fast, private
- **Secondary**: OpenAI - For testing production behavior

```env
LLM_ACTIVE_PROVIDER=local
LLM_LOCAL_ENABLED=true
LLM_OPENAI_ENABLED=true
```

### Production
- **Primary**: OpenAI (GPT-4) - Best quality and reliability
- **Secondary**: Local - Fallback for simple tasks

```env
LLM_ACTIVE_PROVIDER=openai
LLM_OPENAI_ENABLED=true
LLM_LOCAL_ENABLED=true
```

### Cost-Optimized
- **Primary**: Local (Ollama) - Free
- **Secondary**: OpenAI - For tasks that need it

```env
LLM_ACTIVE_PROVIDER=local
LLM_LOCAL_ENABLED=true
LLM_OPENAI_ENABLED=true
```

Use `chatWithFallback()` to try local first, then cloud if needed.

### High-Quality Narrative
- **Primary**: Anthropic (Claude) - Excellent writing
- **Secondary**: OpenAI - Backup

```env
LLM_ACTIVE_PROVIDER=anthropic
LLM_ANTHROPIC_ENABLED=true
LLM_OPENAI_ENABLED=true
```

## Testing Connections

Test all configured providers:

```typescript
const results = await llm.testAllConnections();

for (const [provider, connected] of results) {
  console.log(`${provider}: ${connected ? '✓' : '✗'}`);
}
```

Expected output:
```
openai: ✓
local: ✓
anthropic: ✗
custom: ✗
```

## Common Issues

### "Connection refused" for Local Model

**Problem**: Can't connect to local model

**Solution**:
```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Pull a model if needed
ollama pull llama3.1:8b
```

### "Invalid API key" for OpenAI

**Problem**: Authentication failed

**Solution**:
- Check your API key at https://platform.openai.com/api-keys
- Make sure there are no extra spaces in `.env`
- Verify you have billing set up

### "Model not found"

**Problem**: Specified model doesn't exist

**Solution**:

For OpenAI:
```env
LLM_OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo
```

For Ollama:
```bash
# List available models
ollama list

# Pull the model you want
ollama pull llama3.1:70b
```

### Rate Limit Errors

**Problem**: Too many requests

**Solution**:
1. Enable fallback: `chatWithFallback()`
2. Enable local model as backup
3. Upgrade your API plan

## Advanced Configuration

### Timeout and Retries

```env
# Request timeout (ms)
LLM_DEFAULT_TIMEOUT_MS=30000

# Max retries on failure
LLM_MAX_RETRIES=3

# Delay between retries (ms)
LLM_RETRY_DELAY_MS=1000
```

### Custom Headers

For providers requiring custom headers, modify the client:

```typescript
import { OpenAICompatibleClient } from '@spynet/llm-config';

class CustomClient extends OpenAICompatibleClient {
  protected async makeRequest(url: string, body: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Custom-Header': 'value'
      },
      body: JSON.stringify(body)
    });
  }
}
```

## API Reference

See `packages/llm-config/README.md` for complete API documentation.

## Next Steps

1. Configure your providers in `.env`
2. Test with `examples/basic-usage.ts`
3. Try mission generation: `examples/mission-generation.ts`
4. Integrate into your services

## Support

- LLM Config Package: `packages/llm-config/README.md`
- AI Orchestration: `docs/ai-orchestration.md`
- Issues: GitHub Issues
