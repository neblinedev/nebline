import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  GenerationConfig
} from '@google/generative-ai'
import {
  ChatMessage,
  GenerateResponse,
  IAiProviderClient, // Import the interface
  FilteredGenerateRequest // Import the correct type from ai.ts
} from './ai'
import { unwrapJson } from './helpers'

export class GoogleProviderClient implements IAiProviderClient {
  private googleAiClient: GoogleGenerativeAI

  constructor(googleAiClient: GoogleGenerativeAI) {
    this.googleAiClient = googleAiClient
  }

  async generate(modelName: string, request: FilteredGenerateRequest): Promise<GenerateResponse> {
    const { history, systemInstruction } = convertMessagesToGoogleFormat(request.messages)

    // Ensure the conversation history ends appropriately if needed,
    // although generateContent usually handles the full history.
    // The previous validation logic seemed complex and might not be strictly necessary
    // if generateContent handles the history correctly. Let's simplify.

    const generationConfig: GenerationConfig = {
      maxOutputTokens: request.maxTokens
    }

    if (request.responseFormat === 'json') {
      generationConfig.responseMimeType = 'application/json'
    }

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ]

    try {
      const modelInstance = this.googleAiClient.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings,
        ...(systemInstruction && { systemInstruction })
      })

      const result = await modelInstance.generateContent({
        contents: history
      })

      const response = result.response

      // Check for prompt feedback block reason first
      if (response?.promptFeedback?.blockReason) {
        throw new Error(
          `Google AI request blocked due to: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`
        )
      }

      // Now check if candidates are missing
      if (!response || !response.candidates || response.candidates.length === 0) {
        console.error(
          'Google AI returned empty candidates. Full response:',
          JSON.stringify(response, null, 2)
        )
        throw new Error(
          'Google AI returned an empty response (no candidates). Check logs for details.'
        )
      }

      const candidate = response.candidates[0]
      if (response.promptFeedback?.blockReason) {
        throw new Error(
          `Google AI request blocked due to prompt content: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`
        )
      }
      if (candidate.finishReason === 'SAFETY') {
        const safetyInfo =
          candidate.safetyRatings?.map((r) => `${r.category}: ${r.probability}`).join(', ') ||
          'No specific ratings available'
        throw new Error(
          `Google AI response blocked due to safety settings. Finish Reason: SAFETY. ${candidate.finishMessage || ''} Ratings: [${safetyInfo}]`
        )
      }
      if (
        candidate.finishReason &&
        candidate.finishReason !== 'STOP' &&
        candidate.finishReason !== 'MAX_TOKENS'
      ) {
        throw new Error(
          `Google AI generation finished unexpectedly: ${candidate.finishReason}. ${candidate.finishMessage || ''}`
        )
      }

      let text = response.text()

      if (!text) {
        console.warn('Google AI response.text() was empty. Checking candidate content parts.')
        if (candidate.content?.parts && candidate.content.parts.length > 0) {
          text = candidate.content.parts.map((part) => part.text).join('')
        } else {
          throw new Error('Google AI response was empty or malformed.')
        }
      }

      if (request.responseFormat === 'json') {
        try {
          // Use the unwrapJson function passed from AgnosticAIClient
          text = unwrapJson(text)
        } catch (e: any) {
          throw new Error(
            `Failed to parse JSON from Google AI response: ${e.message}. Raw response: ${text}`
          )
        }
      }

      return { text }
    } catch (error: any) {
      console.error('Error calling Google Generative AI:', error)
      if (error.message.includes('API key not valid')) {
        throw new Error('Invalid Google AI API key provided.')
      }
      if (error.message.includes('quota')) {
        throw new Error('Google AI quota exceeded.')
      }
      if (error instanceof Error) {
        throw new Error(`Google AI API error: ${error.message}`)
      }
      throw new Error('An unknown error occurred while communicating with Google AI.')
    }
  }
}

// --- Helper Functions (kept standalone) ---

function mapRoleToGoogle(role: 'system' | 'user' | 'assistant'): 'user' | 'model' {
  switch (role) {
    case 'user':
      return 'user'
    case 'assistant':
      return 'model'
    case 'system':
      // System messages are handled by convertMessagesToGoogleFormat
      // This case shouldn't be hit if logic is correct, but map as 'user' if it does.
      console.warn("mapRoleToGoogle called with 'system' role unexpectedly.")
      return 'user'
    default:
      throw new Error(`Unsupported role for Google AI: ${role}`)
  }
}

function convertMessagesToGoogleFormat(messages: ChatMessage[]): {
  history: Content[]
  systemInstruction?: string
} {
  let systemInstruction: string | undefined = undefined
  const history: Content[] = []

  messages.forEach((msg, index) => {
    if (msg.role === 'system') {
      if (index === 0) {
        systemInstruction = msg.content
      } else {
        console.warn(
          "Multiple system messages found or system message not at the start. Subsequent system messages treated as 'user'."
        )
        history.push({
          role: 'user',
          parts: [{ text: msg.content }]
        })
      }
    } else {
      history.push({
        role: mapRoleToGoogle(msg.role),
        parts: [{ text: msg.content }]
      })
    }
  })

  return { history, systemInstruction }
}
