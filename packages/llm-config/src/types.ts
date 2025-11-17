import { z } from 'zod';

/**
 * Supported LLM provider types
 */
export type LLMProviderType = 'openai' | 'anthropic' | 'local' | 'custom';

/**
 * Base configuration for any LLM provider
 */
export const LLMProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  baseUrl: z.string().url(),
  model: z.string(),
  maxTokens: z.number().int().positive().default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type LLMProviderConfig = z.infer<typeof LLMProviderConfigSchema>;

/**
 * Configuration for all LLM providers
 */
export const LLMConfigSchema = z.object({
  activeProvider: z.enum(['openai', 'anthropic', 'local', 'custom']).default('openai'),

  providers: z.object({
    openai: LLMProviderConfigSchema,
    anthropic: LLMProviderConfigSchema,
    local: LLMProviderConfigSchema,
    custom: LLMProviderConfigSchema,
  }),

  orchestratorUrl: z.string().url(),

  behavior: z.object({
    defaultTimeoutMs: z.number().int().positive().default(30000),
    maxRetries: z.number().int().min(0).default(3),
    retryDelayMs: z.number().int().positive().default(1000),
  }),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

/**
 * Interface for LLM client implementations
 */
export interface LLMClient {
  /**
   * The provider type
   */
  readonly provider: LLMProviderType;

  /**
   * Configuration for this provider
   */
  readonly config: LLMProviderConfig;

  /**
   * Send a chat completion request
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Test connection to the LLM provider
   */
  testConnection(): Promise<boolean>;
}

/**
 * Chat message types
 */
export type ChatRole = 'system' | 'user' | 'assistant' | 'function';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

/**
 * Options for chat completion
 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * Chat completion response
 */
export interface ChatResponse {
  id: string;
  content: string;
  role: ChatRole;
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Error types for LLM operations
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProviderType,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMConnectionError extends LLMError {
  constructor(provider: LLMProviderType, message = 'Failed to connect to LLM provider') {
    super(message, provider, 'CONNECTION_ERROR');
    this.name = 'LLMConnectionError';
  }
}

export class LLMAuthenticationError extends LLMError {
  constructor(provider: LLMProviderType, message = 'Authentication failed') {
    super(message, provider, 'AUTHENTICATION_ERROR', 401);
    this.name = 'LLMAuthenticationError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: LLMProviderType, message = 'Rate limit exceeded') {
    super(message, provider, 'RATE_LIMIT_ERROR', 429);
    this.name = 'LLMRateLimitError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(provider: LLMProviderType, message = 'Request timed out') {
    super(message, provider, 'TIMEOUT_ERROR');
    this.name = 'LLMTimeoutError';
  }
}
