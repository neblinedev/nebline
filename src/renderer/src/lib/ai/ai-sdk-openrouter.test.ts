import { describe, expect, it } from 'vitest'
import { generateText } from 'ai'
import { aiRegistry } from '@renderer/lib/ai/ai-registry'

describe('ai-sdk', () => {
  describe('openrouter', () => {
    // Test case for OpenAI GPT-4o Mini
    it('should generate text using OpenAI GPT-4o Mini', async () => {
      const { text } = await generateText({
        model: aiRegistry.languageModel('openrouter:google/gemini-2.5-pro-preview-03-25'),
        prompt: 'What is love?'
      })
      expect(text).toBeDefined()
    }, 60000)
  })
})
