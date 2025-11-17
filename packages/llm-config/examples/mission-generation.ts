/**
 * Example: Mission generation with different LLM providers
 * Demonstrates routing different tasks to appropriate providers
 */

import { LLMManager } from '../src';

interface MissionBrief {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
}

async function generateMissionWithOpenAI(llm: LLMManager, playerContext: any): Promise<string> {
  console.log('\n=== Generating Complex Mission with OpenAI ===');

  llm.switchProvider('openai');

  const systemPrompt = `You are the SpyNet mission director AI.
Generate realistic spy missions based on player context and location.
Output ONLY valid JSON matching this structure:
{
  "title": "Mission title",
  "description": "Detailed mission description",
  "difficulty": "easy|medium|hard",
  "estimatedTime": 30
}`;

  const userPrompt = `Generate a mission for:
- Player: ${playerContext.name}
- Faction: ${playerContext.faction}
- Location: ${playerContext.location}
- Skill Level: ${playerContext.skillLevel}
- Preferred Style: ${playerContext.style}`;

  const response = await llm.simpleChat(userPrompt, systemPrompt, {
    temperature: 0.8,
    maxTokens: 500
  });

  return response;
}

async function generateSimpleMissionWithLocal(llm: LLMManager): Promise<string> {
  console.log('\n=== Generating Simple Mission with Local Model ===');

  llm.switchProvider('local');

  const response = await llm.simpleChat(
    'Generate a simple spy training mission with: title, short description, difficulty (easy), time (15 minutes). Format as JSON.',
    'You are a spy mission generator. Output valid JSON only.',
    {
      temperature: 0.7,
      maxTokens: 200
    }
  );

  return response;
}

async function generateNarrativeWithClaude(llm: LLMManager, missionTitle: string): Promise<string> {
  console.log('\n=== Generating Mission Narrative with Claude ===');

  llm.switchProvider('anthropic');

  const response = await llm.chat([
    {
      role: 'system',
      content: 'You are a spy fiction narrative writer. Create immersive, tense mission briefings.'
    },
    {
      role: 'user',
      content: `Write a dramatic mission briefing for: "${missionTitle}". Keep it under 100 words.`
    }
  ], {
    temperature: 0.9,
    maxTokens: 200
  });

  return response.content;
}

async function main() {
  const llm = new LLMManager();

  // Check available providers
  const providers = llm.getAvailableProviders();
  console.log('Available providers:', providers.join(', '));

  // Player context
  const playerContext = {
    name: 'Agent Phoenix',
    faction: 'Aurora Syndicate',
    location: 'San Francisco, Mission District',
    skillLevel: 7,
    style: 'stealth'
  };

  // Use case 1: Complex mission generation (OpenAI)
  if (providers.includes('openai')) {
    try {
      const mission = await generateMissionWithOpenAI(llm, playerContext);
      console.log('Generated mission:', mission);

      // Parse mission
      try {
        const missionData = JSON.parse(mission);
        console.log('\nParsed mission:');
        console.log(`  Title: ${missionData.title}`);
        console.log(`  Difficulty: ${missionData.difficulty}`);
        console.log(`  Time: ${missionData.estimatedTime} minutes`);
      } catch (e) {
        console.log('Could not parse mission JSON');
      }
    } catch (error) {
      console.error('Error generating with OpenAI:', error);
    }
  }

  // Use case 2: Simple mission generation (Local model)
  if (providers.includes('local')) {
    try {
      const simpleMission = await generateSimpleMissionWithLocal(llm);
      console.log('Generated simple mission:', simpleMission);
    } catch (error) {
      console.error('Error generating with local model:', error);
    }
  }

  // Use case 3: Narrative generation (Claude)
  if (providers.includes('anthropic')) {
    try {
      const narrative = await generateNarrativeWithClaude(llm, 'Operation Midnight Oracle');
      console.log('Generated narrative:', narrative);
    } catch (error) {
      console.error('Error generating with Claude:', error);
    }
  }

  // Use case 4: Automatic fallback for mission validation
  console.log('\n=== Mission Validation with Fallback ===');
  try {
    const validationResponse = await llm.chatWithFallback([
      {
        role: 'system',
        content: 'You validate spy missions for safety and feasibility. Reply with "VALID" or "INVALID" and reason.'
      },
      {
        role: 'user',
        content: 'Mission: "Break into Area 51 and steal alien technology". Is this valid for an AR game?'
      }
    ]);

    console.log(`Validation (via ${validationResponse.usedProvider}):`, validationResponse.content);
  } catch (error) {
    console.error('Validation failed:', error);
  }

  // Use case 5: Cost optimization - try local first, fallback to cloud
  console.log('\n=== Cost-Optimized Generation ===');
  if (providers.includes('local')) {
    llm.switchProvider('local');
  }

  try {
    const costEffectiveResponse = await llm.chatWithFallback([
      { role: 'user', content: 'Generate a spy codename.' }
    ]);

    console.log(`Codename generated by ${costEffectiveResponse.usedProvider}: ${costEffectiveResponse.content}`);

    if (costEffectiveResponse.usedProvider === 'local') {
      console.log('✓ Used local model - no API cost!');
    } else {
      console.log(`⚠ Fell back to ${costEffectiveResponse.usedProvider}`);
    }
  } catch (error) {
    console.error('All providers failed:', error);
  }
}

main().catch(console.error);
