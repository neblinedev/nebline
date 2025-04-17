import { describe, expect, it } from 'vitest'
import { generateText } from 'ai'
import { aiRegistry } from '@renderer/lib/ai/ai-registry'

describe('ai-sdk', () => {
  describe('open-ai', () => {
    // Test case for OpenAI GPT-4o Mini
    it('should generate text using OpenAI GPT-4o Mini', async () => {
      const { text } = await generateText({
        model: aiRegistry.languageModel('openai:gpt-4.1-mini'),
        prompt: 'What is love?'
      })
      expect(text).toBeDefined()
    }, 60000)
  })
})
