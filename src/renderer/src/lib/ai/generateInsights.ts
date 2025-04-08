import { AgnosticAIClient, ChatMessage } from './ai'

interface GenerateInsightsParams {
  apiKey: string
  journalContent: string
}

/**
 * Generates psychological insights for a given journal entry using the specified AI model.
 *
 * @param params - The parameters for generating insights.
 * @param params.apiKey - The Anthropic API key.
 * @param params.journalContent - The content of the journal entry to analyze.
 * @returns A promise that resolves with the generated insights in markdown format.
 * @throws Will throw an error if the AI generation fails.
 */
export async function generateInsights({
  apiKey,
  journalContent
}: GenerateInsightsParams): Promise<string> {
  const aiClient = new AgnosticAIClient({ anthropicApiKey: apiKey })

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `
      You are a helpful assistant specialized in analyzing journal entries and providing psychological insights in markdown format.
      You will be given a journal entry containing a week of journal entries.

      Focus on potential patterns, underlying emotions, or cognitive biases.
      When you identify patterns known to psychology, you should mention them.

      You do not need to be overly positive or optimistic, because "cheap optimism" is not helpful. You should try to be balanced and realistic.
      However, if there is reason to be optimistic, you should mention it.

      You should generate a section called "Questions for reflection", where you ask the type of questions that a psycologist would ask to help the 
      user reflect on their thoughts and feelings and understand their emotional state.
      
      If it makes sense, you could provide a section called "Cognitive restructuring", where you suggest a different way of thinking about the situation described in the journal entry.
      This only applies if the journal entry describes a negative thought or feeling.

      If it makes sense, you could provide a section called "Actionable steps", where you suggest a few steps that the user could take to improve their emotional state or situation.
      I am a big fan of "behavioral" insights because I believe the only way to change our emotional state is through action.

      You can be as detailed as you want, just try to avoid cliche phrases, and being overly verbose.

      Important: You should generate insights in the LANGUAGE of the journal entry. If a personal writes in Portuguese, you should write in Portuguese. If the journal entry is in English, you should write in English.
      `
    },
    {
      role: 'user',
      content: `Please analyze the following journal entry and provide psychological insights:\n\n---\n\n${journalContent}`
    }
  ]

  console.log('[generateInsights] Requesting insights from AI...')
  const response = await aiClient.generate({
    model: 'anthropic-claude-3.7', // Use Claude Sonnet 3.7 as requested
    messages: messages,
    responseFormat: 'text', // Expect markdown text
    maxTokens: 6000 // Increased limit for Claude 3.7
  })
  console.log('[generateInsights] aiClient.generate call completed.')

  return response.text
}
