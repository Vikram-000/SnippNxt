import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export type AIProvider = 'gemini' | 'openai' | 'fallback';

export function getActiveAIProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return 'gemini';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  return 'fallback';
}

export function getLanguageModel() {
  const provider = getActiveAIProvider();
  if (provider === 'gemini') {
    return google('gemini-1.5-flash');
  }
  if (provider === 'openai') {
    return openai('gpt-4o-mini');
  }
  return null;
}
