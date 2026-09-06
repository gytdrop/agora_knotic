import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { handleCorsPreflight } from '@/lib/cors';
import { createChatCompletionsHandler } from './handler';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export const POST = createChatCompletionsHandler({
  createOpenAIClient: createOpenAI,
  streamTextImpl: streamText,
});
