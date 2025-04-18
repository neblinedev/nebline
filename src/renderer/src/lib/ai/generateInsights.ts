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
  const prompt = `
You are a helpful assistant specialized in analyzing journal entries and providing psychological insights in markdown format.
You will be given a set of journal entries to analyze.
Please avoid being overly verbose and overly optimistic.

- Identify Key Emotions. Note the primary emotions expressed or implied in the latest entry. Compare them to emotions noted in previous entries if available (e.g., "This week, there seems to be a focus on [emotion], whereas last week noted more [emotion].").
- Extract Core Themes. What are the main topics or recurring subjects discussed (e.g., relationships, work stress, self-criticism, a specific event)? Note any shifts or consistency in themes over time.
- Observe Thought Patterns. Gently highlight potential recurring thought patterns or perspectives mentioned (e.g., "You mentioned thoughts related to [specific pattern, e.g., 'assuming the worst'] again this week."). Avoid labeling them definitively (like "cognitive distortion") unless the user uses such terms themselves.
- Note Coping Mechanisms. Identify any actions or strategies the user mentioned taking in response to challenges or feelings (e.g., "You described dealing with [situation] by [action taken].").
- Identify Potential Triggers/Antecedents. Note any events or situations mentioned that seem to precede specific feelings or thoughts (e.g., "It appears the feelings of [emotion] arose after [event mentioned].").
- Highlight Connections & Shifts. Point out potential connections between thoughts, feelings, and behaviors described within the entry or across entries. Note any apparent progress, setbacks, or changes in perspective compared to previous entries.
-= Formulate Reflective Questions. Based on your observations, pose 2-3 open-ended questions to encourage deeper reflection by the user. (e.g., "What connection, if any, do you see between [theme 1] and [theme 2] this week?", "How did [coping mechanism used] feel compared to strategies you've tried before?", "What might be underlying the shift in focus towards [new theme]?").
- You should generate insights in the same language as the language of the journal entries.
- For each journal entry, I've included any previous analysis that was generated. You should use this previous analysis to inform your current insights, building upon previous observations when appropriate.
- Do not output in structured markdown. You should output in a conversational style, like a psychologist might. Don't be verbose.
- You do not need to cover every topic, it's preferable to elaborate on key points.

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
    prompt
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
  const prompt = `
You are a helpful assistant specialized in analyzing journal entries and providing psychological insights in markdown format.
Please avoid being overly verbose and overly optimistic.

This journaling app has two sides: A journal side, focuing on every week, and an overview side, focusing on the big picture.
You should provide analysis for the overview side.

- Identify majour life themes.  Summarize the central recurring topics or narratives that emerge from the user's history.
- Highlight Significant Stated Events/Periods. Note key life events or developmental periods the user identified as impactful and briefly summarize their *stated* significance (e.g., "You described [event] during adolescence as being particularly formative in shaping your views on [topic].").
- Note Recurring Patterns. Identify patterns the user describes repeating across different areas or times in their life (e.g., "A pattern seems described regarding [e.g., difficulty trusting others] appearing in both romantic relationships and friendships mentioned."). This could include relational dynamics, coping styles, or emotional responses.
- Explore Potential Underlying Beliefs (as stated/implied). Gently point towards potential core beliefs about self, others, or the world that the user's narrative *might suggest* (e.g., "The descriptions of [situations] might hint at an underlying feeling of [e.g., 'not being good enough'] that you've mentioned struggling with."). Frame these tentatively.
- Summarize Stated Strengths & Vulnerabilities. List the personal strengths, resources, and areas of struggle or vulnerability explicitly mentioned by the user in their overview.
- Identify Potential Connections. Highlight possible links between early experiences and later patterns, or between different themes identified (e.g., "Is there a potential connection for you between the early family dynamics described and the relationship patterns noted later in life?").
- Formulate Reflective Questions. Based on the overview, pose 2-3 broad, open-ended questions to encourage the user to think about their narrative as a whole. (e.g., "Looking back at this overview, what stands out most strongly to you now?", "How do you see the strengths you mentioned having helped you navigate the challenges described?", "What narrative thread feels most important for you to explore further?").

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
    prompt
  })

  return text
}
