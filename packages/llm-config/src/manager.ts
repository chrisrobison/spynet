import { LLMConfigLoader } from './config-loader';
import { LLMClientFactory } from './client-factory';
import { LLMConfig, LLMClient, LLMProviderType, ChatMessage, ChatOptions, ChatResponse } from './types';

/**
 * Manager for multiple LLM providers with dynamic switching
 */
export class LLMManager {
  private config: LLMConfig;
  private clients: Map<LLMProviderType, LLMClient>;
  private activeClient: LLMClient;

  constructor(config?: LLMConfig) {
    // Load configuration from environment if not provided
    this.config = config || LLMConfigLoader.loadFromEnv();

    // Validate configuration
    LLMConfigLoader.validateConfig(this.config);

    // Create clients for all enabled providers
    const enabledProviders = LLMConfigLoader.getEnabledProviders(this.config);
    this.clients = LLMClientFactory.createClients(enabledProviders);

    // Set active client
    const activeProviderInfo = LLMConfigLoader.getActiveProvider(this.config);
    const activeClient = this.clients.get(activeProviderInfo.type);

    if (!activeClient) {
      throw new Error(`Failed to create client for active provider: ${activeProviderInfo.type}`);
    }

    this.activeClient = activeClient;
  }

  /**
   * Get the current active provider type
   */
  getActiveProvider(): LLMProviderType {
    return this.activeClient.provider;
  }

  /**
   * Get all available provider types
   */
  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Switch to a different provider
   */
  switchProvider(provider: LLMProviderType): void {
    const client = this.clients.get(provider);

    if (!client) {
      const available = this.getAvailableProviders();
      throw new Error(
        `Provider '${provider}' is not available. Available providers: ${available.join(', ')}`,
      );
    }

    this.activeClient = client;
    this.config.activeProvider = provider;

    console.log(`Switched to LLM provider: ${provider}`);
  }

  /**
   * Send a chat completion request using the active provider
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return this.activeClient.chat(messages, options);
  }

  /**
   * Send a chat completion request using a specific provider
   */
  async chatWithProvider(
    provider: LLMProviderType,
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const client = this.clients.get(provider);

    if (!client) {
      throw new Error(`Provider '${provider}' is not available`);
    }

    return client.chat(messages, options);
  }

  /**
   * Test connection to the active provider
   */
  async testActiveConnection(): Promise<boolean> {
    return this.activeClient.testConnection();
  }

  /**
   * Test connections to all available providers
   */
  async testAllConnections(): Promise<Map<LLMProviderType, boolean>> {
    const results = new Map<LLMProviderType, boolean>();

    await Promise.all(
      Array.from(this.clients.entries()).map(async ([provider, client]) => {
        const isConnected = await client.testConnection();
        results.set(provider, isConnected);
      }),
    );

    return results;
  }

  /**
   * Get configuration summary (without sensitive data)
   */
  getConfigSummary(): Record<string, any> {
    return {
      ...LLMConfigLoader.getConfigSummary(this.config),
      activeClient: this.activeClient.provider,
      availableProviders: this.getAvailableProviders(),
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): LLMConfig {
    return this.config;
  }

  /**
   * Create a simple chat completion with a single message
   * Useful for quick one-off requests
   */
  async simpleChat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages, options);
    return response.content;
  }

  /**
   * Create a chat with fallback to alternative providers
   * If the active provider fails, try other available providers
   */
  async chatWithFallback(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse & { usedProvider: LLMProviderType }> {
    const providers = this.getAvailableProviders();
    const errors: Array<{ provider: LLMProviderType; error: Error }> = [];

    // Try active provider first
    try {
      const response = await this.chat(messages, options);
      return { ...response, usedProvider: this.getActiveProvider() };
    } catch (error) {
      errors.push({
        provider: this.getActiveProvider(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    // Try other providers
    for (const provider of providers) {
      if (provider === this.getActiveProvider()) {
        continue; // Already tried
      }

      try {
        const response = await this.chatWithProvider(provider, messages, options);
        console.warn(`Fell back to provider: ${provider}`);
        return { ...response, usedProvider: provider };
      } catch (error) {
        errors.push({
          provider,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    // All providers failed
    const errorMessage = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join('; ');
    throw new Error(`All LLM providers failed: ${errorMessage}`);
  }
}
