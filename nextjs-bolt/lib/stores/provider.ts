import { atom } from 'nanostores';

export type AnthropicModel = {
  id: string; // Mantém o tipo, mas sem IDs específicos
  displayName: string;
};
export type GoogleModel = {
  id: string; // Mantém o tipo, mas sem IDs específicos
  displayName: string;
};

export type TogetherAIModel = {
  id: string; // Mantém o tipo, mas sem IDs específicos
  displayName: string;
};

export type XAIModel = {
  id: string; // Mantém o tipo, mas sem IDs específicos
  displayName: string;
};

export enum ProviderType {
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  TOGETHER = 'together',
  XAI = 'xai',
}

export type Provider =
  | { type: ProviderType.GOOGLE; model: GoogleModel }

export const providerStore = atom<Provider>({ type: ProviderType.GOOGLE, model: { id: 'gemini-2.0-flash-thinking-exp-1219', displayName: 'Claude 3.7 Sonnet' } });

export function setProvider(provider: Provider) {
  console.log('setProvider called with:', provider);
  providerStore.set(provider);
}

export const togetherModels: TogetherAIModel[] = [];
export const anthropicModels: AnthropicModel[] = [];
export const googleModels: GoogleModel[] = [];
export const xAIModels: XAIModel[] = [];