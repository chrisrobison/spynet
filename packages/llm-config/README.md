# @spynet/llm-config

Multi-provider LLM configuration and client management for SpyNet. Easily switch between different LLM providers (OpenAI, Anthropic, local models, custom endpoints) without changing your code.

## Features

- **Multiple Provider Support**: OpenAI, Anthropic (Claude), local models (Ollama, LM Studio), and custom OpenAI-compatible endpoints
- **Dynamic Switching**: Switch between providers at runtime
- **Automatic Fallback**: Fail over to alternative providers if one fails
- **Type-Safe**: Full TypeScript support with Zod validation
- **Environment-Based Config**: Configure via environment variables
- **Connection Testing**: Test connectivity to all providers
- **Standardized Interface**: Unified API across all providers

## Installation

```bash
pnpm add @spynet/llm-config
```

## Quick Start

### 1. Configure Environment Variables

See `.env.example` for all available options. Basic setup:

```env
# Active provider
LLM_ACTIVE_PROVIDER=openai

# OpenAI
LLM_OPENAI_ENABLED=true
LLM_OPENAI_API_KEY=sk-...
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_MODEL=gpt-4

# Local (Ollama)
LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:11434/v1
LLM_LOCAL_MODEL=llama3.1:70b
```

### 2. Use in Your Code

```typescript
import { LLMManager } from '@spynet/llm-config';

// Initialize manager (loads config from environment)
const llm = new LLMManager();

// Simple chat
const response = await llm.simpleChat('What is the capital of France?');
console.log(response); // "Paris"

// Chat with conversation history
const chatResponse = await llm.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]);
console.log(chatResponse.content);
```

### 3. Switch Providers

```typescript
// Check available providers
console.log(llm.getAvailableProviders()); // ['openai', 'local']

// Switch to local model
llm.switchProvider('local');

// Use same API
const response = await llm.simpleChat('Hello!');
```

## Advanced Usage

### Chat with Specific Provider

```typescript
// Use OpenAI for one request
const openaiResponse = await llm.chatWithProvider(
  'openai',
  [{ role: 'user', content: 'Complex reasoning task' }],
  { temperature: 0.2 }
);

// Use local model for another
const localResponse = await llm.chatWithProvider(
  'local',
  [{ role: 'user', content: 'Simple task' }],
  { temperature: 0.8 }
);
```

### Automatic Fallback

```typescript
// Automatically try other providers if active one fails
try {
  const response = await llm.chatWithFallback([
    { role: 'user', content: 'Generate mission briefing' }
  ]);

  console.log(`Used provider: ${response.usedProvider}`);
  console.log(response.content);
} catch (error) {
  console.error('All providers failed:', error);
}
```

### Test Connections

```typescript
// Test active provider
const isConnected = await llm.testActiveConnection();
console.log(`Active provider connected: ${isConnected}`);

// Test all providers
const results = await llm.testAllConnections();
for (const [provider, connected] of results) {
  console.log(`${provider}: ${connected ? '✓' : '✗'}`);
}
```

### Custom Options

```typescript
const response = await llm.chat(
  [
    { role: 'system', content: 'You are a creative writer.' },
    { role: 'user', content: 'Write a short story about a spy.' }
  ],
  {
    temperature: 1.0,
    maxTokens: 500,
    topP: 0.9,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
    stop: ['THE END']
  }
);
```

## Configuration

### Environment Variables

All configuration is done via environment variables:

```env
# Active provider (required)
LLM_ACTIVE_PROVIDER=openai|anthropic|local|custom

# Provider configuration (for each provider)
LLM_{PROVIDER}_ENABLED=true|false
LLM_{PROVIDER}_API_KEY=your-api-key
LLM_{PROVIDER}_BASE_URL=https://api.example.com/v1
LLM_{PROVIDER}_MODEL=model-name
LLM_{PROVIDER}_MAX_TOKENS=2000
LLM_{PROVIDER}_TEMPERATURE=0.7

# Behavior settings
LLM_DEFAULT_TIMEOUT_MS=30000
LLM_MAX_RETRIES=3
LLM_RETRY_DELAY_MS=1000

# Orchestrator
LLM_ORCHESTRATOR_URL=http://localhost:8000
```

### Provider Examples

#### OpenAI (GPT-4)
```env
LLM_OPENAI_ENABLED=true
LLM_OPENAI_API_KEY=sk-...
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_MODEL=gpt-4
```

#### Anthropic (Claude)
```env
LLM_ANTHROPIC_ENABLED=true
LLM_ANTHROPIC_API_KEY=sk-ant-...
LLM_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
LLM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

#### Local (Ollama)
```env
LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:11434/v1
LLM_LOCAL_MODEL=llama3.1:70b
```

#### Local (LM Studio)
```env
LLM_LOCAL_ENABLED=true
LLM_LOCAL_API_KEY=not-required
LLM_LOCAL_BASE_URL=http://localhost:1234/v1
LLM_LOCAL_MODEL=local-model
```

#### Custom Endpoint (e.g., Together AI, Groq)
```env
LLM_CUSTOM_ENABLED=true
LLM_CUSTOM_API_KEY=your-api-key
LLM_CUSTOM_BASE_URL=https://api.together.xyz/v1
LLM_CUSTOM_MODEL=meta-llama/Llama-3-70b-chat-hf
```

## API Reference

### LLMManager

Main class for managing LLM providers.

#### Constructor
```typescript
new LLMManager(config?: LLMConfig)
```

#### Methods

- `getActiveProvider(): LLMProviderType` - Get current active provider
- `getAvailableProviders(): LLMProviderType[]` - List all enabled providers
- `switchProvider(provider: LLMProviderType): void` - Switch active provider
- `chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>` - Send chat request
- `chatWithProvider(provider: LLMProviderType, messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>` - Chat with specific provider
- `simpleChat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string>` - Simple one-shot chat
- `chatWithFallback(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse & { usedProvider: LLMProviderType }>` - Chat with automatic fallback
- `testActiveConnection(): Promise<boolean>` - Test active provider
- `testAllConnections(): Promise<Map<LLMProviderType, boolean>>` - Test all providers
- `getConfigSummary(): Record<string, any>` - Get config without secrets

### Types

#### ChatMessage
```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}
```

#### ChatOptions
```typescript
interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}
```

#### ChatResponse
```typescript
interface ChatResponse {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

## Error Handling

The package provides specific error types:

```typescript
try {
  const response = await llm.chat([...]);
} catch (error) {
  if (error instanceof LLMAuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof LLMRateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof LLMTimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof LLMConnectionError) {
    console.error('Connection failed');
  } else if (error instanceof LLMError) {
    console.error('LLM error:', error.message);
  }
}
```

## Use Cases

### Route by Task Complexity

```typescript
// Use powerful model for complex tasks
llm.switchProvider('openai');
const complexResponse = await llm.simpleChat('Explain quantum entanglement');

// Use local model for simple tasks
llm.switchProvider('local');
const simpleResponse = await llm.simpleChat('Generate a random number');
```

### Cost Optimization

```typescript
// Try local first (free), fallback to cloud if needed
llm.switchProvider('local');
const response = await llm.chatWithFallback([...]);
```

### Development vs Production

```typescript
// .env.development
LLM_ACTIVE_PROVIDER=local

// .env.production
LLM_ACTIVE_PROVIDER=openai
```

## License

MIT
