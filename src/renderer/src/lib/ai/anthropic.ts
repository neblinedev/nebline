import Anthropic from '@anthropic-ai/sdk'
import { MessageParam } from '@anthropic-ai/sdk/resources'
import { IAiProviderClient, FilteredGenerateRequest, GenerateResponse } from './ai'
import { unwrapJson } from './helpers'

export class AnthropicProviderClient implements IAiProviderClient {
  private anthropic: Anthropic

  constructor(anthropicClient: Anthropic) {
    this.anthropic = anthropicClient
  }

  /**
   * Generates content using Anthropic's messages API.
   */
  async generate(
    modelName: string, // Renamed from anthropicModelName
    request: FilteredGenerateRequest // Use the interface's request type
  ): Promise<GenerateResponse> {
    // Validate that the final message is a user message.
    if (
      request.messages.length === 0 ||
      request.messages[request.messages.length - 1].role !== 'user'
    ) {
      throw new Error('Anthropic API requires that the final message is a user message.')
    }

    // Convert the generic messages to Anthropic message format
    // Handle system message if it exists (first message)
    let systemPrompt: string | undefined
    if (request.messages.length > 0 && request.messages[0].role === 'system') {
      systemPrompt = request.messages[0].content
    }

    // Filter out system messages and map the rest to Anthropic format
    const anthropicMessages: MessageParam[] = request.messages
      .filter((m) => m.role !== 'system') // Filter first
      .map((m) => ({
        // Then map
        role: m.role as 'user' | 'assistant', // Role is safe now
        content: m.content // Content is string, compatible with MessageParam
      }))

    // Prepare API request parameters
    const apiParams: Anthropic.Messages.MessageCreateParams = {
      model: modelName,
      system: systemPrompt, // Pass system prompt separately
      messages: anthropicMessages,
      max_tokens: request.maxTokens ?? 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 2000
      }
    }

    // Add JSON mode instruction if requested
    if (request.responseFormat === 'json') {
      // Add a specific instruction for JSON output if not already present
      // This is a common way to guide models towards JSON output
      if (!systemPrompt?.toLowerCase().includes('json')) {
        apiParams.system =
          (systemPrompt ? systemPrompt + '\n\n' : '') + 'Please respond ONLY with valid JSON.'
      }
    }

    // Call Anthropic's messages endpoint
    const response = await this.anthropic.messages.create(apiParams)

    // Extract the assistant's reply
    const contentText = response.content
      .map((block) => {
        if (block.type === 'text') {
          return block.text
        }
        return ''
      })
      .join('')

    // Process JSON response format if requested
    if (request.responseFormat === 'json') {
      return { text: unwrapJson(contentText) }
    }

    return { text: contentText }
  }
}
