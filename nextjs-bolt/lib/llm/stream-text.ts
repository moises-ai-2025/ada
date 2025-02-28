import { google } from '@ai-sdk/google';
// Removendo importações irrelevantes para Anthropic e Together, pois só Google será usado
// import { createOpenAI } from "@ai-sdk/openai";
// import { anthropic } from '@ai-sdk/anthropic';
// import { together } from './custom-together'; // Removido, pois não será usado
import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from '@/lib/llm/prompts';
import { type Provider, ProviderType } from '@/lib/stores/provider';

export interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

export function streamText({ messages, provider, ...options }: { messages: any, provider: Provider } & StreamingOptions) {
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const image = currentMessage.data?.url; // Base64 image
  console.log("messagesStreamImage:", image);

  let model;

  // Simplificando para suportar apenas Google
  if (provider.type === ProviderType.GOOGLE) {
    model = google(provider.model.id);
  } else {
    // Fallback para um modelo Google padrão, caso o tipo seja inválido (não deve ocorrer)
    model = google("gemini-2.0-flash-thinking-exp-1219");
  }

  const content = [];

  content.push({ type: 'text', text: currentMessage.content });

  if (image) {
    content.push({ type: 'image', image: new URL(image) });
  }

  return _streamText({
    model,
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    messages: [
      ...initialMessages,
      {
        role: 'user',
        content,
      },
    ],
    ...options,
  });
}