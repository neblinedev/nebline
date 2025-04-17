import { z } from 'zod'

export const projectConfigSchema = z.object({
  model: z.string(),
  anthropicApiKey: z.string(),
  openAiApiKey: z.string(),
  googleApiKey: z.string(),
  openRouterApiKey: z.string()
})

export type ProjectConfig = z.infer<typeof projectConfigSchema>
