/**
 * Basic usage examples for @spynet/llm-config
 */

import { LLMManager } from '../src';

async function main() {
  console.log('=== SpyNet Multi-LLM Configuration Examples ===\n');

  // Initialize LLM manager (loads from environment)
  const llm = new LLMManager();

  // Display configuration
  console.log('Configuration:');
  console.log(JSON.stringify(llm.getConfigSummary(), null, 2));
  console.log();

  // Example 1: Simple chat with active provider
  console.log('Example 1: Simple chat with active provider');
  console.log(`Active provider: ${llm.getActiveProvider()}`);
  try {
    const response = await llm.simpleChat(
      'Generate a brief spy mission briefing in 2 sentences.',
      'You are a spy mission coordinator.'
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log();

  // Example 2: Test all connections
  console.log('Example 2: Test all provider connections');
  const connections = await llm.testAllConnections();
  for (const [provider, connected] of connections) {
    console.log(`  ${provider}: ${connected ? '✓ Connected' : '✗ Failed'}`);
  }
  console.log();

  // Example 3: Switch providers
  console.log('Example 3: Switch between providers');
  const providers = llm.getAvailableProviders();
  console.log(`Available providers: ${providers.join(', ')}`);

  if (providers.length > 1) {
    for (const provider of providers) {
      llm.switchProvider(provider);
      console.log(`\nSwitched to: ${provider}`);

      try {
        const response = await llm.simpleChat('Say "Hello from ${provider}"');
        console.log(`Response: ${response.substring(0, 100)}...`);
      } catch (error) {
        console.error(`Error with ${provider}:`, error);
      }
    }
  }
  console.log();

  // Example 4: Chat with specific provider
  console.log('Example 4: Chat with specific provider');
  if (providers.includes('openai')) {
    try {
      const response = await llm.chatWithProvider(
        'openai',
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is 2+2?' }
        ]
      );
      console.log('OpenAI response:', response.content);
      console.log('Tokens used:', response.usage.totalTokens);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  console.log();

  // Example 5: Automatic fallback
  console.log('Example 5: Automatic fallback');
  try {
    const response = await llm.chatWithFallback([
      { role: 'user', content: 'Generate a random spy codename.' }
    ]);
    console.log(`Used provider: ${response.usedProvider}`);
    console.log('Response:', response.content);
  } catch (error) {
    console.error('All providers failed:', error);
  }
  console.log();

  // Example 6: Advanced options
  console.log('Example 6: Advanced chat options');
  try {
    const response = await llm.chat(
      [
        { role: 'system', content: 'You are a creative spy fiction writer.' },
        { role: 'user', content: 'Write a tense 2-sentence spy scenario.' }
      ],
      {
        temperature: 1.0,
        maxTokens: 100,
        topP: 0.95
      }
    );
    console.log('Creative response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
main().catch(console.error);
