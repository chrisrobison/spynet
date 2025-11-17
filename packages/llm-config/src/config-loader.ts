import { LLMConfig, LLMConfigSchema, LLMProviderConfig, LLMProviderType } from './types';

/**
 * Loads LLM configuration from environment variables
 */
export class LLMConfigLoader {
  /**
   * Load configuration from environment variables
   */
  static loadFromEnv(): LLMConfig {
    const config: LLMConfig = {
      activeProvider: this.getEnvVar('LLM_ACTIVE_PROVIDER', 'openai') as LLMProviderType,

      providers: {
        openai: this.loadProviderConfig('OPENAI'),
        anthropic: this.loadProviderConfig('ANTHROPIC'),
        local: this.loadProviderConfig('LOCAL'),
        custom: this.loadProviderConfig('CUSTOM'),
      },

      orchestratorUrl: this.getEnvVar('LLM_ORCHESTRATOR_URL', 'http://localhost:8000'),

      behavior: {
        defaultTimeoutMs: parseInt(this.getEnvVar('LLM_DEFAULT_TIMEOUT_MS', '30000')),
        maxRetries: parseInt(this.getEnvVar('LLM_MAX_RETRIES', '3')),
        retryDelayMs: parseInt(this.getEnvVar('LLM_RETRY_DELAY_MS', '1000')),
      },
    };

    // Validate configuration
    return LLMConfigSchema.parse(config);
  }

  /**
   * Load provider-specific configuration from environment variables
   */
  private static loadProviderConfig(providerPrefix: string): LLMProviderConfig {
    const prefix = `LLM_${providerPrefix}`;

    return {
      enabled: this.getEnvVar(`${prefix}_ENABLED`, 'false') === 'true',
      apiKey: this.getEnvVar(`${prefix}_API_KEY`, undefined),
      baseUrl: this.getEnvVar(`${prefix}_BASE_URL`, ''),
      model: this.getEnvVar(`${prefix}_MODEL`, ''),
      maxTokens: parseInt(this.getEnvVar(`${prefix}_MAX_TOKENS`, '2000')),
      temperature: parseFloat(this.getEnvVar(`${prefix}_TEMPERATURE`, '0.7')),
    };
  }

  /**
   * Get environment variable with fallback
   */
  private static getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  /**
   * Get the active provider configuration
   */
  static getActiveProvider(config: LLMConfig): {
    type: LLMProviderType;
    config: LLMProviderConfig;
  } {
    const activeProvider = config.activeProvider;
    const providerConfig = config.providers[activeProvider];

    if (!providerConfig.enabled) {
      throw new Error(
        `Active provider '${activeProvider}' is not enabled. Please set LLM_${activeProvider.toUpperCase()}_ENABLED=true`,
      );
    }

    return {
      type: activeProvider,
      config: providerConfig,
    };
  }

  /**
   * Get all enabled providers
   */
  static getEnabledProviders(config: LLMConfig): Array<{
    type: LLMProviderType;
    config: LLMProviderConfig;
  }> {
    return Object.entries(config.providers)
      .filter(([_, providerConfig]) => providerConfig.enabled)
      .map(([type, providerConfig]) => ({
        type: type as LLMProviderType,
        config: providerConfig,
      }));
  }

  /**
   * Validate that at least one provider is enabled
   */
  static validateConfig(config: LLMConfig): void {
    const enabledProviders = this.getEnabledProviders(config);

    if (enabledProviders.length === 0) {
      throw new Error('No LLM providers are enabled. Please enable at least one provider in your configuration.');
    }

    const activeProvider = config.providers[config.activeProvider];
    if (!activeProvider.enabled) {
      throw new Error(
        `Active provider '${config.activeProvider}' is not enabled. Please enable it or change LLM_ACTIVE_PROVIDER to an enabled provider.`,
      );
    }
  }

  /**
   * Get configuration summary for logging (without sensitive data)
   */
  static getConfigSummary(config: LLMConfig): Record<string, any> {
    return {
      activeProvider: config.activeProvider,
      enabledProviders: this.getEnabledProviders(config).map((p) => p.type),
      orchestratorUrl: config.orchestratorUrl,
      behavior: config.behavior,
      providers: Object.entries(config.providers).reduce(
        (acc, [type, providerConfig]) => {
          acc[type] = {
            enabled: providerConfig.enabled,
            baseUrl: providerConfig.baseUrl,
            model: providerConfig.model,
            maxTokens: providerConfig.maxTokens,
            hasApiKey: !!providerConfig.apiKey,
          };
          return acc;
        },
        {} as Record<string, any>,
      ),
    };
  }
}
