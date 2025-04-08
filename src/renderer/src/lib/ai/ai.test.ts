import { AgnosticAIClient, ChatMessage } from './ai'
import { describe, expect, it } from 'vitest'

describe('AgnosticAIClient', () => {
  describe('generate', () => {
    // Test case for OpenAI GPT-4o Mini
    it('should generate text using OpenAI GPT-4o Mini', async () => {
      const client = new AgnosticAIClient() // Assumes API keys are in env vars
      const messages: ChatMessage[] = [{ role: 'user', content: 'Tell me a short joke.' }]
      const result = await client.generate({
        model: 'openai-4o-mini',
        messages
      })
      console.log('OpenAI Result:', result.text) // Log for debugging
      expect(result.text).toBeTypeOf('string')
      expect(result.text.length).toBeGreaterThan(5) // Basic check for non-empty response
    }, 60000) // Increase timeout for AI generation

    // Test case for Anthropic Claude 3.5
    it('should generate text using Anthropic Claude 3.5', async () => {
      const client = new AgnosticAIClient() // Assumes API keys are in env vars
      const messages: ChatMessage[] = [{ role: 'user', content: 'What is the capital of France?' }]
      const result = await client.generate({
        model: 'anthropic-claude-3.5',
        messages
      })
      console.log('Anthropic Result:', result.text) // Log for debugging
      expect(result.text).toBeTypeOf('string')
      expect(result.text.toLowerCase()).toContain('paris') // Check for expected content
    }, 60000) // Increase timeout for AI generation

    // Test case for OpenAI GPT-4o Mini JSON output
    it('should generate JSON using OpenAI GPT-4o Mini', async () => {
      const client = new AgnosticAIClient()
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: 'Generate a JSON object with two keys: "name" (string) and "count" (number).'
        }
      ]
      const result = await client.generate({
        model: 'openai-4o-mini',
        messages,
        responseFormat: 'json' // Request JSON output
      })
      console.log('OpenAI JSON Result:', result.text)
      expect(result.text).toBeTypeOf('string')
      let parsedJson
      expect(() => {
        parsedJson = JSON.parse(result.text)
      }).not.toThrow()
      expect(parsedJson).toHaveProperty('name')
      expect(parsedJson).toHaveProperty('count')
      expect(typeof parsedJson.name).toBe('string')
      expect(typeof parsedJson.count).toBe('number')
    }, 60000)

    // Test case for Anthropic Claude 3.5 JSON output
    it('should generate JSON using Anthropic Claude 3.5', async () => {
      const client = new AgnosticAIClient()
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content:
            'Generate ONLY a JSON object (no surrounding text or markdown) with two keys: "city" (string) and "population" (number).'
        }
      ]
      const result = await client.generate({
        model: 'anthropic-claude-3.5',
        messages
        // Note: Anthropic doesn't have a dedicated JSON mode param like OpenAI,
        // rely on prompt instructions and unwrapJson.
      })
      console.log('Anthropic JSON Result:', result.text)
      expect(result.text).toBeTypeOf('string')
      let parsedJson
      expect(() => {
        parsedJson = JSON.parse(result.text)
      }).not.toThrow()
      expect(parsedJson).toHaveProperty('city')
      expect(parsedJson).toHaveProperty('population')
      expect(typeof parsedJson.city).toBe('string')
      expect(typeof parsedJson.population).toBe('number')
    }, 60000)

    // Test case for Google Gemini 2.5 Pro
    it('should generate text using Google Gemini 2.5 Pro', async () => {
      const client = new AgnosticAIClient() // Assumes API keys are in env vars
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: 'What is the largest planet in our solar system?'
        }
      ]
      const result = await client.generate({
        model: 'google-gemini-2.5-pro',
        messages
      })
      expect(result.text).toBeTypeOf('string')
      expect(result.text.toLowerCase()).toContain('jupiter') // Check for expected content
    }, 60000)

    it('should generate JSON using Google Gemini 2.5 Pro', async () => {
      const client = new AgnosticAIClient()
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content:
            'Generate a JSON object with two keys: "fruit" (string, e.g., "apple") and "color" (string, e.g., "red"). Respond ONLY with the JSON object itself, no extra text or markdown.'
        }
      ]
      const result = await client.generate({
        model: 'google-gemini-2.5-pro',
        messages,
        responseFormat: 'json'
      })
      expect(result.text).toBeTypeOf('string')
      let parsedJson
      expect(() => {
        parsedJson = JSON.parse(result.text)
      }).not.toThrow()
      expect(parsedJson).toHaveProperty('fruit')
      expect(parsedJson).toHaveProperty('color')
      expect(typeof parsedJson.fruit).toBe('string')
      expect(typeof parsedJson.color).toBe('string')
    }, 60000)
  })
})
