/**
 * @spynet/llm-config
 *
 * Multi-provider LLM configuration and client management for SpyNet.
 * Supports OpenAI, Anthropic, local models (Ollama, LM Studio), and custom endpoints.
 */

// Core manager
export { LLMManager } from './manager';

// Configuration
export { LLMConfigLoader } from './config-loader';

// Client factory
export { LLMClientFactory, OpenAICompatibleClient } from './client-factory';

// Types and schemas
export {
  // Type definitions
  LLMProviderType,
  LLMProviderConfig,
  LLMConfig,
  LLMClient,
  ChatRole,
  ChatMessage,
  ChatOptions,
  ChatResponse,

  // Schemas
  LLMProviderConfigSchema,
  LLMConfigSchema,

  // Errors
  LLMError,
  LLMConnectionError,
  LLMAuthenticationError,
  LLMRateLimitError,
  LLMTimeoutError,
} from './types';
