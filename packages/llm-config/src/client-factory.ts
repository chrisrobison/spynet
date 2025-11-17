import {
  LLMClient,
  LLMProviderConfig,
  LLMProviderType,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  LLMConnectionError,
  LLMAuthenticationError,
  LLMRateLimitError,
  LLMTimeoutError,
  LLMError,
} from './types';

/**
 * Generic OpenAI-compatible LLM client
 * Works with OpenAI, Anthropic (with adapter), local models, and custom endpoints
 */
export class OpenAICompatibleClient implements LLMClient {
  readonly provider: LLMProviderType;
  readonly config: LLMProviderConfig;

  constructor(provider: LLMProviderType, config: LLMProviderConfig) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Send a chat completion request
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const requestBody = {
      model: this.config.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      })),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      ...(options?.topP && { top_p: options.topP }),
      ...(options?.frequencyPenalty && { frequency_penalty: options.frequencyPenalty }),
      ...(options?.presencePenalty && { presence_penalty: options.presencePenalty }),
      ...(options?.stop && { stop: options.stop }),
      stream: options?.stream ?? false,
    };

    try {
      const response = await this.makeRequest(url, requestBody);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();

      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new LLMTimeoutError(this.provider);
        }
        throw new LLMConnectionError(this.provider, error.message);
      }

      throw new LLMError('Unknown error occurred', this.provider);
    }
  }

  /**
   * Test connection to the LLM provider
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.chat(
        [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
        {
          maxTokens: 10,
        },
      );
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${this.provider}:`, error);
      return false;
    }
  }

  /**
   * Make HTTP request to LLM API
   */
  private async makeRequest(url: string, body: any): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  /**
   * Handle error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorMessage = response.statusText;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch {
      // Could not parse error response
    }

    if (statusCode === 401 || statusCode === 403) {
      throw new LLMAuthenticationError(this.provider, errorMessage);
    }

    if (statusCode === 429) {
      throw new LLMRateLimitError(this.provider, errorMessage);
    }

    throw new LLMError(errorMessage, this.provider, 'API_ERROR', statusCode);
  }

  /**
   * Parse API response into standard format
   */
  private parseResponse(data: any): ChatResponse {
    const choice = data.choices?.[0];

    if (!choice) {
      throw new LLMError('Invalid response: no choices returned', this.provider);
    }

    return {
      id: data.id || 'unknown',
      content: choice.message?.content || '',
      role: choice.message?.role || 'assistant',
      model: data.model || this.config.model,
      finishReason: choice.finish_reason || null,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
}

/**
 * Factory for creating LLM clients
 */
export class LLMClientFactory {
  /**
   * Create a client for the specified provider
   */
  static createClient(provider: LLMProviderType, config: LLMProviderConfig): LLMClient {
    // For now, all providers use the OpenAI-compatible client
    // In the future, we could add provider-specific implementations here
    return new OpenAICompatibleClient(provider, config);
  }

  /**
   * Create clients for all enabled providers
   */
  static createClients(
    providers: Array<{ type: LLMProviderType; config: LLMProviderConfig }>,
  ): Map<LLMProviderType, LLMClient> {
    const clients = new Map<LLMProviderType, LLMClient>();

    for (const { type, config } of providers) {
      clients.set(type, this.createClient(type, config));
    }

    return clients;
  }
}
