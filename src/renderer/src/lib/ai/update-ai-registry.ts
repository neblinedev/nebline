import { ProjectConfig } from '@renderer/lib/project/project-schema'
import { updateAiRegistry } from './ai-registry'

/**
 * Updates the AI registry with API keys from the project configuration
 * This function should be called whenever the project configuration changes
 *
 * @param config The project configuration containing API keys
 */
export function updateAiRegistryWithConfig(config: ProjectConfig): void {
  if (!config) return

  // Update the AI registry with the API keys from the project configuration
  updateAiRegistry({
    anthropicApiKey: config.anthropicApiKey,
    openAiApiKey: config.openAiApiKey,
    openRouterApiKey: config.openRouterApiKey
  })
}
