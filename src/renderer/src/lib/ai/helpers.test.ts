import { unwrapJson } from './helpers'
import { describe, expect, it } from 'vitest'

describe('helpers', () => {
  describe('unwrapJson', () => {
    it('should return valid JSON as-is', () => {
      const json = '{"name":"John","age":30}'
      const result = unwrapJson(json)
      expect(result).toBe(json)
      // Verify it's actually parseable
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should extract JSON from markdown code blocks', () => {
      const input =
        'Here is the JSON data:\n\n```json\n{"name":"Jane","age":25}\n```\n\nHope this helps!'
      const result = unwrapJson(input)
      expect(result).toBe('{"name":"Jane","age":25}')
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should extract JSON with extraneous text before and after', () => {
      const input =
        'Here is the data you requested: {"key":"value","items":[1,2,3]} Let me know if you need anything else.'
      const result = unwrapJson(input)
      expect(result).toBe('{"key":"value","items":[1,2,3]}')
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should return the largest valid JSON object when multiple are present', () => {
      const input = 'Small: {"a":1} Larger: {"name":"Alice","details":{"age":30,"country":"US"}}'
      const result = unwrapJson(input)
      expect(result).toBe('{"name":"Alice","details":{"age":30,"country":"US"}}')
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should handle the example from Anthropic', () => {
      const input = `After analyzing the subtitles and markdown blocks, here's the time map that matches each markdown block to when its content is spoken in the audio:

\`\`\`json
{
  "0": { "start": 0, "end": 3.28 },
  "1": { "start": 3.28, "end": 11.60 },
  "2": { "start": 11.60, "end": 15.20 },
  "3": { "start": 15.20, "end": 19.04 },
  "4": { "start": 19.04, "end": 19.74 },
  "5": { "start": 19.74, "end": 23.44 },
  "6": { "start": 23.44, "end": 27.76 },
  "8": { "start": 27.76, "end": 30.80 },
  "9": { "start": 30.80, "end": 34.56 },
  "10": { "start": 34.56, "end": 52.96 },
  "12": { "start": 56.16, "end": 59.44 },
  "13": { "start": 59.44, "end": 62.64 },
  "14": { "start": 62.64, "end": 67.52 },
  "15": { "start": 62.64, "end": 65.08 },
  "16": { "start": 65.08, "end": 67.52 },
  "17": { "start": 67.52, "end": 73.60 },
  "18": { "start": 73.60, "end": 80.64 },
  "19": { "start": 80.64, "end": 85.04 },
  "20": { "start": 80.64, "end": 85.04 },
  "22": { "start": 85.04, "end": 88.64 },
  "23": { "start": 85.04, "end": 88.64 },
  "24": { "start": 88.64, "end": 97.52 },
  "26": { "start": 97.52, "end": 102.48 },
  "27": { "start": 102.48, "end": 109.68 },
  "28": { "start": 102.48, "end": 105.92 },
  "29": { "start": 105.92, "end": 109.68 },
  "30": { "start": 109.68, "end": 117.12 },
  "32": { "start": 117.12, "end": 125.12 },
  "33": { "start": 125.12, "end": 131.92 },
  "34": { "start": 131.92, "end": 136.00 },
  "35": { "start": 131.92, "end": 133.96 },
  "36": { "start": 133.96, "end": 136.00 },
  "37": { "start": 136.00, "end": 140.48 },
  "38": { "start": 140.48, "end": 146.32 },
  "39": { "start": 146.32, "end": 150.72 },
  "40": { "start": 146.32, "end": 147.52 },
  "41": { "start": 147.52, "end": 148.72 },
  "42": { "start": 148.72, "end": 150.72 },
  "43": { "start": 150.72, "end": 155.12 },
  "45": { "start": 155.12, "end": 161.44 },
  "46": { "start": 161.44, "end": 168.64 },
  "47": { "start": 161.44, "end": 163.50 },
  "48": { "start": 163.50, "end": 165.57 },
  "49": { "start": 165.57, "end": 168.64 },
  "51": { "start": 168.64, "end": 173.28 },
  "52": { "start": 173.28, "end": 178.32 },
  "53": { "start": 178.32, "end": 183.84 },
  "54": { "start": 178.32, "end": 180.16 },
  "55": { "start": 180.16, "end": 181.84 },
  "56": { "start": 181.84, "end": 183.84 },
  "58": { "start": 183.84, "end": 186.96 },
  "59": { "start": 186.96, "end": 203.44 },
  "60": { "start": 186.96, "end": 192.08 },
  "61": { "start": 192.08, "end": 197.76 },
  "62": { "start": 197.76, "end": 203.44 },
  "64": { "start": 203.44, "end": 208.88 },
  "65": { "start": 208.88, "end": 213.04 },
  "66": { "start": 208.88, "end": 213.04 },
  "67": { "start": 213.04, "end": 220.00 }
}
\`\`\``

      const result = unwrapJson(input)
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(result)

      // Check a few specific properties to ensure we got the right data
      expect(parsed['0'].start).toBe(0)
      expect(parsed['0'].end).toBe(3.28)
      expect(parsed['67'].end).toBe(220.0)
      expect(Object.keys(parsed).length).toBeGreaterThan(50) // Should have many keys
    })

    it('should throw an error if no valid JSON is found', () => {
      const input = 'This is just plain text with no JSON in it.'
      expect(() => unwrapJson(input)).toThrow('Failed to extract valid JSON from the provided text')
    })

    it('should handle nested JSON structures correctly', () => {
      const input = `Here's a complex nested object:
      {
        "users": [
          {"id": 1, "name": "Alice", "preferences": {"theme": "dark", "notifications": true}},
          {"id": 2, "name": "Bob", "preferences": {"theme": "light", "notifications": false}}
        ],
        "metadata": {
          "version": "2.0",
          "generated": "2023-04-01T12:00:00Z"
        }
      }`

      const result = unwrapJson(input)
      const parsed = JSON.parse(result)

      expect(parsed.users.length).toBe(2)
      expect(parsed.users[0].preferences.theme).toBe('dark')
      expect(parsed.metadata.version).toBe('2.0')
    })

    it('should handle JSON with special characters and unicode', () => {
      const input =
        'The JSON data contains special characters: {"message":"Hello, world! 🌍","symbols":"$€£¥"}'
      const result = unwrapJson(input)
      const parsed = JSON.parse(result)

      expect(parsed.message).toBe('Hello, world! 🌍')
      expect(parsed.symbols).toBe('$€£¥')
    })

    it('should handle Anthropic response with text before and after JSON block', () => {
      const input = `I'll analyze the content and create a time map for each markdown block based on the subtitles. I'll match the content of each markdown block with the corresponding subtitle text to determine the start and end times.

\`\`\`json
{
  "0": { "start": 0, "end": 3.28 },
  "1": { "start": 3.28, "end": 11.60 },
  "2": { "start": 11.60, "end": 15.20 },
  "3": { "start": 15.20, "end": 19.04 },
  "4": { "start": 19.04, "end": 19.80 },
  "5": { "start": 19.80, "end": 23.44 },
  "6": { "start": 23.44, "end": 27.76 },
  "8": { "start": 27.76, "end": 30.80 },
  "9": { "start": 30.80, "end": 34.56 },
  "10": { "start": 34.56, "end": 52.96 },
  "12": { "start": 52.96, "end": 59.44 },
  "13": { "start": 59.44, "end": 62.64 },
  "14": { "start": 62.64, "end": 63.50 },
  "15": { "start": 63.50, "end": 65.50 },
  "16": { "start": 65.50, "end": 67.52 },
  "17": { "start": 67.52, "end": 73.60 },
  "18": { "start": 73.60, "end": 80.64 },
  "19": { "start": 80.64, "end": 85.04 },
  "20": { "start": 85.04, "end": 88.64 },
  "22": { "start": 88.64, "end": 92.32 },
  "23": { "start": 92.32, "end": 97.52 },
  "24": { "start": 92.32, "end": 97.52 },
  "26": { "start": 97.52, "end": 102.48 },
  "27": { "start": 102.48, "end": 105.92 },
  "28": { "start": 105.92, "end": 109.68 },
  "29": { "start": 105.92, "end": 109.68 },
  "30": { "start": 109.68, "end": 121.92 },
  "32": { "start": 121.92, "end": 128.88 },
  "33": { "start": 128.88, "end": 131.92 },
  "34": { "start": 131.92, "end": 136.00 },
  "35": { "start": 131.92, "end": 136.00 },
  "36": { "start": 131.92, "end": 136.00 },
  "37": { "start": 136.00, "end": 140.48 },
  "38": { "start": 140.48, "end": 146.32 },
  "39": { "start": 146.32, "end": 150.72 },
  "40": { "start": 146.32, "end": 150.72 },
  "41": { "start": 146.32, "end": 150.72 },
  "42": { "start": 146.32, "end": 150.72 },
  "43": { "start": 150.72, "end": 155.12 },
  "45": { "start": 155.12, "end": 161.44 },
  "46": { "start": 161.44, "end": 168.64 },
  "47": { "start": 161.44, "end": 168.64 },
  "48": { "start": 161.44, "end": 168.64 },
  "49": { "start": 161.44, "end": 168.64 },
  "51": { "start": 168.64, "end": 173.28 },
  "52": { "start": 173.28, "end": 178.32 },
  "53": { "start": 178.32, "end": 183.84 },
  "54": { "start": 178.32, "end": 183.84 },
  "55": { "start": 178.32, "end": 183.84 },
  "56": { "start": 178.32, "end": 183.84 },
  "58": { "start": 183.84, "end": 186.96 },
  "59": { "start": 186.96, "end": 192.08 },
  "60": { "start": 192.08, "end": 197.76 },
  "61": { "start": 197.76, "end": 203.44 },
  "62": { "start": 203.44, "end": 208.88 },
  "64": { "start": 208.88, "end": 213.04 },
  "65": { "start": 213.04, "end": 220.00 },
  "66": { "start": 213.04, "end": 220.00 },
  "67": { "start": 213.04, "end": 228.64 }
}
\`\`\`

I've aligned each markdown block with the corresponding portion of the subtitles. Note that:

1. Some markdown blocks contain content that spans multiple subtitle segments
2. Some examples are grouped together when they're mentioned together in the audio
3. When multiple examples are mentioned in the same subtitle segment, they share the same timing
4. The final example (Alex is a teacher) extends to the end of the audio as it's part of the conclusion`

      const result = unwrapJson(input)
      const parsed = JSON.parse(result)

      // Verify we got the correct JSON
      expect(parsed['0'].start).toBe(0)
      expect(parsed['0'].end).toBe(3.28)
      expect(parsed['67'].end).toBe(228.64)
      expect(Object.keys(parsed).length).toBeGreaterThan(50)
    })
  })
})
