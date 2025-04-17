import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createProviderRegistry } from 'ai'
import { proxyFetch } from './proxy-fetch'

// Create the AI registry with empty API keys initially
// These will be updated when a project is loaded
export const aiRegistry = createProviderRegistry({
  anthropic: createAnthropic({
    apiKey: '',
    fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
  }),

  openai: createOpenAI({
    apiKey: '',
    fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
  }),

  openrouter: createOpenAI({
    apiKey: '',
    baseURL: 'https://openrouter.ai/api/v1',
    fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
  })
})

/**
 * Updates the AI registry with new API keys
 * This function creates a new registry with the updated API keys
 */
export function updateAiRegistry(options: {
  anthropicApiKey?: string
  openAiApiKey?: string
  openRouterApiKey?: string
}): void {
  // Create a new registry with the updated API keys
  const newRegistry = createProviderRegistry({
    anthropic: createAnthropic({
      apiKey: options.anthropicApiKey || '',
      fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
    }),
    openai: createOpenAI({
      apiKey: options.openAiApiKey || '',
      fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
    }),
    openrouter: createOpenAI({
      apiKey: options.openRouterApiKey || '',
      baseURL: 'https://openrouter.ai/api/v1',
      fetch: proxyFetch as unknown as typeof fetch // Use our custom fetch implementation to avoid CORS issues
    })
  })

  // Copy all properties from the new registry to the existing one
  Object.assign(aiRegistry, newRegistry)
}
