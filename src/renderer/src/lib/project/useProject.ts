import { useState, useCallback } from 'react'
import {
  JournalWeek,
  loadConfig as loadConfigLogic,
  loadWeek as loadWeekLogic,
  NeblineProject,
  openProject,
  saveConfigFile as saveConfigFileLogic,
  saveFileContent as saveFileContentLogic
} from './project'
import { ProjectConfig } from './project-schema'

export type ProjectData = {
  project: NeblineProject | null
  currentWeekData: JournalWeek | null
  configData: ProjectConfig | null
  availableWeeks: string[]
  isProjectLoading: boolean
  isWeekLoading: boolean
  error: string | null
  view: 'journal' | 'configuration'
  loadProject: (folderPath: string) => Promise<void>
  loadWeek: (date: Date) => Promise<void>
  saveCurrentWeekFile: (filePath: string, content: string) => Promise<void>
  saveConfiguration: (content: string) => Promise<void>
  toggleView: () => void
}

export const useProject = (): ProjectData => {
  const [project, setProject] = useState<NeblineProject | null>(null)
  const [currentWeekData, setCurrentWeekData] = useState<JournalWeek | null>(null)
  const [configData, setConfigData] = useState<ProjectConfig | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(false)
  const [isWeekLoading, setIsWeekLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'journal' | 'configuration'>('journal')

  const fetchAvailableWeeks = useCallback(async (projectPath: string) => {
    console.log('[Hook] Fetching available weeks for:', projectPath)
    const weeks: string[] = []
    try {
      const journalDir = await window.api.joinPath(projectPath, 'journal')
      const yearDirs = await window.api.readDir(journalDir)

      if (yearDirs) {
        for (const yearDir of yearDirs) {
          if (yearDir.isDirectory && /^\d{4}$/.test(yearDir.name)) {
            const yearPath = await window.api.joinPath(journalDir, yearDir.name)
            const weekDirs = await window.api.readDir(yearPath)

            if (weekDirs) {
              for (const weekDir of weekDirs) {
                if (weekDir.isDirectory && /^\d{4}-CW-\d{2}$/.test(weekDir.name)) {
                  weeks.push(weekDir.name)
                }
              }
            } else {
              console.warn(`[Hook] Could not read week directories in ${yearPath}`)
            }
          }
        }
      } else {
        console.log(`[Hook] Journal directory not found or empty at ${journalDir}`)
      }

      weeks.sort((a, b) => b.localeCompare(a))
      setAvailableWeeks(weeks)
      console.log('[Hook] Available weeks loaded:', weeks)
    } catch (err) {
      console.error('[Hook] Error fetching available weeks:', err)
      setAvailableWeeks([]) // Reset on error
    }
  }, [])

  const loadProject = useCallback(
    async (folderPath: string) => {
      setIsProjectLoading(true)
      setError(null)
      console.log(`Hook: Opening project ${folderPath}`)
      try {
        const openedProject = await openProject(folderPath)
        if (openedProject) {
          setProject(openedProject)

          setIsWeekLoading(true)

          const todayWeekData = await loadWeekLogic(openedProject.projectPath, new Date())
          if (todayWeekData) {
            setCurrentWeekData(todayWeekData)
            console.log(
              "Hook: Project and current week's data loaded",
              openedProject,
              todayWeekData
            )
            await fetchAvailableWeeks(openedProject.projectPath)
          } else {
            throw new Error("Failed to load current week's journal data after opening project.")
          }

          try {
            const configFileContent = await loadConfigLogic(openedProject.projectPath)
            setConfigData(configFileContent)
            console.log('Hook: Configuration file loaded')
          } catch (configErr) {
            console.error('Hook: Error loading configuration file', configErr)
            // Don't necessarily clear configData if loading fails, maybe keep old one?
          }
          setIsWeekLoading(false)
        } else {
          throw new Error('Failed to open project folder.')
        }
      } catch (err: unknown) {
        console.error('Hook: Error opening project', err)
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while opening the project.'
        setError(message)
        setProject(null)
        setCurrentWeekData(null)
        setConfigData(null)
        setAvailableWeeks([])
        setIsWeekLoading(false)
      } finally {
        setIsProjectLoading(false)
      }
    },
    [fetchAvailableWeeks]
  )

  const loadWeek = useCallback(
    async (date: Date) => {
      if (!project) {
        setError('No project is currently open.')
        return
      }
      // setIsWeekLoading(true); // Consider adding if week loading is slow
      setError(null)
      console.log(`Hook: Loading week containing ${date.toISOString()}`)
      try {
        const weekData = await loadWeekLogic(project.projectPath, date)
        if (weekData) {
          setCurrentWeekData(weekData)
          // Update the project state to reflect the new current week
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  currentWeekPath: weekData.weekPath,
                  currentJournalFile: weekData.journalFile
                }
              : null
          )
          console.log('Hook: Week loaded', weekData)
        } else {
          throw new Error('Failed to load data for the selected week.')
        }
      } catch (err: unknown) {
        console.error('Hook: Error loading week', err)
        const message =
          err instanceof Error ? err.message : 'An unknown error occurred while loading the week.'
        setError(message)
        // Decide if we should clear currentWeekData here or leave the old one
        // setCurrentWeekData(null);
      } finally {
        // setIsWeekLoading(false); // Consider adding if week loading is slow
      }
    },
    [project]
  )

  const saveCurrentWeekFile = useCallback(
    async (filePath: string, content: string) => {
      if (!filePath) {
        console.error('Hook: Cannot save, no file path provided.')
        setError('Cannot save, no file path provided.')
        return
      }
      if (!currentWeekData) {
        console.error('Hook: Cannot save, no current week data loaded.')
        setError('Cannot save, no week data loaded.')
        return
      }

      console.log(`Hook: Saving content to ${filePath}`)
      try {
        const success = await saveFileContentLogic(filePath, content)
        if (success) {
          // Optimistically update local state
          setCurrentWeekData((prev) => {
            if (!prev) return null
            // Check which file was saved and update the corresponding content
            if (filePath === prev.journalFile) {
              return { ...prev, journalContent: content }
            } else if (filePath === prev.insightsFile) {
              return { ...prev, insightsContent: content }
            }
            return prev // Return previous state if path doesn't match known files
          })
          console.log('Hook: Save successful for', filePath)
        } else {
          throw new Error(`Failed to save content to ${filePath}.`)
        }
      } catch (err: unknown) {
        console.error(`Hook: Error saving file ${filePath}`, err)
        const message =
          err instanceof Error ? err.message : `An unknown error occurred while saving ${filePath}.`
        setError(message)
      }
    },
    [currentWeekData]
  )

  const saveConfiguration = useCallback(
    async (content: string) => {
      if (!project?.projectPath) {
        console.error('Hook: Cannot save configuration, no project path.')
        setError('Cannot save configuration, no project is currently loaded.')
        return
      }

      console.log(`Hook: Saving configuration to ${project.projectPath}`)
      try {
        const success = await saveConfigFileLogic(project.projectPath, content)
        if (success) {
          // Update local state to keep hook state in sync
          setConfigData(content)
          console.log('Hook: Configuration save successful')
        } else {
          throw new Error('Failed to save configuration content.')
        }
      } catch (err: unknown) {
        console.error('Hook: Error saving configuration', err)
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while saving configuration.'
        setError(message)
      }
    },
    [project]
  )

  const toggleView = useCallback(() => {
    setView((currentView) => (currentView === 'journal' ? 'configuration' : 'journal'))
    console.log(`Hook: Toggled view to ${view === 'journal' ? 'configuration' : 'journal'}`)
  }, [view])

  return {
    project,
    currentWeekData,
    configData,
    availableWeeks,
    isProjectLoading,
    isWeekLoading,
    error,
    view,
    loadProject,
    loadWeek,
    saveCurrentWeekFile,
    saveConfiguration,
    toggleView
  }
}
