import { OpenAI } from 'openai'
import {
  IAiProviderClient, // Import the interface
  FilteredGenerateRequest, // Import the request type used by the interface
  GenerateResponse // Import the response type
} from './ai'
import { unwrapJson } from './helpers'

export class OpenAIProviderClient implements IAiProviderClient {
  private openai: OpenAI

  constructor(openaiClient: OpenAI) {
    this.openai = openaiClient
  }

  /**
   * Generates content using OpenAI's API.
   */
  async generate(
    modelName: string, // Renamed from openAiModelName
    request: FilteredGenerateRequest // Use the interface's request type
  ): Promise<GenerateResponse> {
    // Configure response format if specified
    const responseFormat =
      request.responseFormat === 'json' ? { type: 'json_object' as const } : undefined // OpenAI uses 'json_object'

    // Map generic messages to OpenAI format
    const openAiMessages = request.messages.map((m) => ({
      role: m.role,
      content: m.content
    }))

    // Prepare API request parameters
    const apiParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model: modelName,
      messages: openAiMessages,
      // max_tokens / max_completion_tokens will be set conditionally below
      response_format: responseFormat
    }

    // Conditionally set max tokens based on model
    const maxTokensValue = request.maxTokens ?? 1024
    if (modelName === 'o1') {
      apiParams.max_completion_tokens = maxTokensValue
    } else {
      apiParams.max_tokens = maxTokensValue
    }

    // Call OpenAI API
    const response = await this.openai.chat.completions.create(apiParams)

    const content = response.choices?.[0]?.message?.content ?? '[No text returned]'

    // Process JSON response format if requested
    if (request.responseFormat === 'json' && responseFormat) {
      // OpenAI should return valid JSON in json_object mode,
      // but unwrapJson might still be useful for safety or if the model fails.
      try {
        // Attempt direct parse first, as OpenAI guarantees JSON format here
        JSON.parse(content)
        return { text: content }
      } catch (e) {
        // Fallback to unwrapJson if direct parsing fails (unexpected)
        return { text: unwrapJson(content) }
      }
    }

    return { text: content }
  }
}

// Removed the old standalone generateWithOpenAI function
// Removed the unused OpenAIGenerateParams interface
