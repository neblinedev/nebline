import { generateText } from 'ai'
import { aiRegistry } from '@renderer/lib/ai/ai-registry'
import { ProjectConfig } from '@renderer/lib/project/project-schema'
import { DocumentWithInsights } from '@renderer/lib/project/helpers'

export interface GenerateJournalInsightsParams {
  config: ProjectConfig
  /**
   * The current overview content to analyze, including its insights.
   */
  overviewContent: DocumentWithInsights
  /**
   * The last 6 journal entries up to the point in time being analyzed.
   * Does not include entries from weeks in the future relative to the analyzed week.
   * Each entry contains both the document content and its insights.
   */
  journalHistory: DocumentWithInsights[]
}

/**
 * Generates psychological insights for a given journal entry using the AI model specified in the config.
 *
 * @param params - The parameters for generating insights.
 * @param params.config - The project configuration object containing API keys and model information.
 * @param params.overviewContent - The current overview content to analyze, including its insights.
 * @param params.journalHistory - The last 6 journal entries up to the point in time being analyzed.
 * @returns A promise that resolves with the generated insights in markdown format.
 * @throws Will throw an error if the AI generation fails.
 */
export async function generateWeekInsights({
  config,
  overviewContent,
  journalHistory
}: GenerateJournalInsightsParams): Promise<string> {
  const seed = Date.now()
  const prompt = `${seed}
 You are a clinically‑informed assistant. Produce BRIEF, psychologically grounded insights (not therapy).

 OUTPUT FORMAT (markdown, keep headings, order & punctuation exactly):
 ## Emotions
 -

 ## Themes
 -

 ## Thought Patterns
 -

 ## Coping
 -

 ## Triggers
 -

 ## Connections
 -

 ## Questions for reflection
 1.
 2.
 3.

 RULES
 - Detect & write in the same language as the journal entry text.
 - ≤6 bullets per section, each ≤15 words.
 - If no observations, write "- none -".
 - No clichés, forced optimism, or filler. Be concrete, evidence‑based, nuanced.
 - Use previous analyses for continuity without repeating them verbatim.
 - You should focus on the latest journal entry (week), but also consider the previous ones.

 ---
${
  journalHistory && journalHistory.length > 0
    ? `
I'm providing you with up to 6 journal entries for psychological analysis.

Journal entries:
${journalHistory
  .map((entry, index) => {
    let entryText = `--- Journal ${index + 1} ---\n${entry.document}`

    // Include previous insights if available
    if (entry.insights) {
      entryText += `\n\n--- Previous Analysis for Journal ${index + 1} ---\n${entry.insights}`
    }

    return entryText
  })
  .join('\n\n')}
`
    : ''
}
${
  overviewContent
    ? `
I'm also providing you with the user's overview document for additional context.
This overview represents the user's broader perspective and can help you understand recurring themes or patterns.

--- Overview Content ---
${overviewContent.document}

${
  overviewContent.insights
    ? `--- Previous Analysis for Overview ---
${overviewContent.insights}`
    : ''
}
`
    : ''
}
Please analyze the journal entries, especially the latest one, and provide psychological insights:
`
  const { text } = await generateText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: aiRegistry.languageModel(config.model as any),
    prompt,
    temperature: 0.7
  })

  return text
}

/**
 * Generates psychological insights for an overview using the AI model specified in the config.
 *
 * @param params - The parameters for generating insights.
 * @param params.overviewContent - The content of the overview to analyze, including its insights.
 * @param params.config - The project configuration object containing API keys and model information.
 * @param params.journalHistory - The last 6 months of journal entries, including the most recent ones.
 * @returns A promise that resolves with the generated insights in markdown format.
 * @throws Will throw an error if the AI generation fails.
 */
export async function generateOverviewInsights({
  overviewContent,
  config,
  journalHistory
}: GenerateJournalInsightsParams): Promise<string> {
  const seed = Date.now()
  const prompt = `${seed}
 You are a clinically‑informed assistant. Generate concise big‑picture insights.

 OUTPUT FORMAT (markdown, headings & order fixed):
 ## Life Themes
 -

 ## Significant Events
 -

 ## Possible positive changes (if any)
 -

 ## Recurring Patterns
 -

 ## Possible Core Beliefs
 -

 ## Strengths
 -

 ## Vulnerabilities
 -

 ## Connections
 - 

 ## Free form analysis
(Provide a conversational, nuanced overview of the most important themes and potentiallly relevants insights and solutions.
Please write like a wide old psycholist would)

 ## Reflection Questions
 1.
 2.
 3.

 RULES
 - Write in the same language detected in the overview text.
 - ≤6 bullets each. For each bullet: Give a title, followed by :, then a short description with some analysis and potentially linking to real exanmples.
   Except for the Free form
 - Use "- none -" if empty.
 - No fluff, toxic positivity, or jargon bombs. Be specific, psychologically informed.
 
---
${
  journalHistory && journalHistory.length > 0
    ? `
I'm also providing you with up to 6 journal entries for context.
You should use these entries to identify patterns, changes, or recurring themes over time.
This will help you provide a more comprehensive overview of the user's psychological state.

Journal entries:
${journalHistory
  .map((entry, index) => {
    let entryText = `--- Journal ${index + 1} ---\n${entry.document}`

    // Include previous insights if available
    if (entry.insights) {
      entryText += `\n\n--- Previous Analysis for Journal ${index + 1} ---\n${entry.insights}`
    }

    return entryText
  })
  .join('\n\n')}

--- Overview Content (to analyze) ---
`
    : ''
}
Please analyze the following overview content and provide psychological insights:

${overviewContent.document}

${
  overviewContent.insights
    ? `--- Previous Analysis for Overview ---
${overviewContent.insights}`
    : ''
}
`
  const { text } = await generateText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: aiRegistry.languageModel(config.model as any),
    prompt,
    temperature: 0.7
  })

  return text
}
