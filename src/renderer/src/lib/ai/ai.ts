import { OpenAI } from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
// Import the provider client classes (assuming they will be created/exported)
import { OpenAIProviderClient } from './openai'
import { AnthropicProviderClient } from './anthropic'
import { GoogleProviderClient } from './gemini'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type SupportedModel =
  | 'openai-4o-mini'
  | 'openai-o1'
  | 'openai-o3-mini'
  | 'anthropic-claude-3.5'
  | 'anthropic-claude-3.7'
  | 'google-gemini-2.5-pro'

export type ResponseFormat = 'text' | 'json'

export interface GenerateRequest {
  model: SupportedModel
  messages: (ChatMessage | null)[] // Allow null values
  maxTokens?: number
  responseFormat?: ResponseFormat
}

// Internal type for filtered requests (no nulls)
export interface FilteredGenerateRequest {
  model: SupportedModel
  messages: ChatMessage[] // Guaranteed non-null messages
  maxTokens?: number
  responseFormat?: ResponseFormat
}

export interface GenerateResponse {
  text: string
}

// --- NEW: Interface for Provider Clients ---
export interface IAiProviderClient {
  // Export the interface
  generate(modelName: string, request: FilteredGenerateRequest): Promise<GenerateResponse>
}
// --- END NEW ---

interface VendorModelMapping {
  vendor: 'openai' | 'anthropic' | 'google'
  modelName: string
}

const MODEL_MAP: Record<SupportedModel, VendorModelMapping> = {
  'openai-4o-mini': { vendor: 'openai', modelName: 'gpt-4o-mini' },
  'openai-o1': { vendor: 'openai', modelName: 'o1' },
  'openai-o3-mini': { vendor: 'openai', modelName: 'o3-mini' },
  'anthropic-claude-3.5': {
    vendor: 'anthropic',
    modelName: 'claude-3-5-sonnet-latest'
  },
  'anthropic-claude-3.7': {
    vendor: 'anthropic',
    modelName: 'claude-3-7-sonnet-latest'
  },
  'google-gemini-2.5-pro': {
    vendor: 'google',
    modelName: 'gemini-2.5-pro-preview-03-25'
  }
}

export interface AgnosticAIClientConfig {
  openAiApiKey?: string
  anthropicApiKey?: string
  googleApiKey?: string
}

export class AgnosticAIClient {
  // Store API keys, but not the client instances directly
  private openAiApiKey?: string
  private anthropicApiKey?: string
  private googleApiKey?: string

  constructor(config: AgnosticAIClientConfig = {}) {
    this.openAiApiKey = config.openAiApiKey
    this.anthropicApiKey = config.anthropicApiKey
    this.googleApiKey = config.googleApiKey
  }

  public async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const vendorMap = MODEL_MAP[request.model]
    if (!vendorMap) {
      throw new Error(`Unsupported model: ${request.model}`)
    }

    const filteredMessages = request.messages.filter((msg): msg is ChatMessage => msg !== null)

    const filteredRequest: FilteredGenerateRequest = {
      ...request,
      messages: filteredMessages
    }

    let providerClient: IAiProviderClient

    // Instantiate the correct provider client on demand
    switch (vendorMap.vendor) {
      case 'openai':
        if (!this.openAiApiKey) {
          throw new Error('OpenAI usage requested, but no OpenAI API key was provided.')
        }
        // Pass the SDK client instance and unwrapJson method
        providerClient = new OpenAIProviderClient(new OpenAI({ apiKey: this.openAiApiKey }))
        break
      case 'anthropic':
        if (!this.anthropicApiKey) {
          throw new Error('Anthropic usage requested, but no Anthropic API key was provided.')
        }
        providerClient = new AnthropicProviderClient(
          new Anthropic({ apiKey: this.anthropicApiKey, dangerouslyAllowBrowser: true })
        )
        break
      case 'google':
        if (!this.googleApiKey) {
          throw new Error('Google usage requested, but no Google API key was provided.')
        }
        providerClient = new GoogleProviderClient(new GoogleGenerativeAI(this.googleApiKey))
        break
      default:
        // Should be unreachable due to MODEL_MAP structure, but good for type safety
        throw new Error(`Unknown vendor: ${vendorMap.vendor}`)
    }

    // Delegate generation to the selected provider client
    return providerClient.generate(vendorMap.modelName, filteredRequest)
  }
}
