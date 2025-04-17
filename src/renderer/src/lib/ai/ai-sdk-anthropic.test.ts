import { describe, expect, it } from 'vitest'
import { generateText } from 'ai'
import { aiRegistry } from '@renderer/lib/ai/ai-registry'

describe('ai-sdk', () => {
  describe('anthropic', () => {
    // Test case for Anthropic Claude
    it('should generate text using Anthropic Claude', async () => {
      const { text } = await generateText({
        model: aiRegistry.languageModel('anthropic:claude-3-7-sonnet-20250219'),
        prompt: 'What is love?'
      })
      expect(text).toBeDefined()
    }, 60000)
  })
})
