/**
 * Attempts to extract clean JSON from a potentially messy AI response.
 * (Keeping this utility method within AgnosticAIClient for now)
 *
 * @param text - The raw text response from the AI
 * @returns The extracted JSON string
 * @throws Error if the text is not and does not contain valid JSON
 */
export function unwrapJson(text: string): string {
  if (!text) return text
  try {
    JSON.parse(text)
    return text
  } catch (e) {}

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/
  const codeBlockMatch = text.match(codeBlockRegex)
  if (codeBlockMatch && codeBlockMatch[1]) {
    const extracted = codeBlockMatch[1].trim()
    try {
      JSON.parse(extracted)
      return extracted
    } catch (e) {
      try {
        const innerJson = findLargestJsonObject(extracted)
        if (innerJson) return innerJson
      } catch (innerError) {}
    }
  }

  try {
    const largestJson = findLargestJsonObject(text)
    if (largestJson) return largestJson
  } catch (e) {}

  throw new Error('Failed to extract valid JSON from the provided text')
}

/**
 * Helper method to find the largest valid JSON object in a string
 */
export function findLargestJsonObject(text: string): string | null {
  let bestMatch = ''
  let bestMatchLength = 0
  const startIndices = [...text.matchAll(/{/g)].map((match) => match.index)
  const endIndices = [...text.matchAll(/}/g)].map((match) => match.index)

  if (startIndices.length > 0 && endIndices.length > 0) {
    for (const startIdx of startIndices) {
      if (startIdx === undefined) continue
      for (const endIdx of endIndices) {
        if (endIdx === undefined || endIdx <= startIdx) continue
        const potentialJson = text.substring(startIdx, endIdx + 1)
        if (potentialJson.length <= bestMatchLength) continue
        try {
          JSON.parse(potentialJson)
          bestMatch = potentialJson
          bestMatchLength = potentialJson.length
        } catch (e) {}
      }
    }
  }
  return bestMatchLength > 0 ? bestMatch : null
}
