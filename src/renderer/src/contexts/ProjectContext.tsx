import React, { ReactNode, useCallback, useState } from 'react' // Removed useContext and createContext
import {
  JournalWeek, // Renamed import
  loadConfigFile as loadConfigFileLogic,
  loadWeek as loadWeekLogic,
  NeblineProject, // Renamed from JournalDay
  openProject as openProjectLogic,
  saveConfigFile as saveConfigFileLogic, // Renamed from loadDayLogic
  saveFileContent as saveFileContentLogic
} from '../lib/project'
import { ProjectContext } from './ProjectContextDefinition' // Import from new file, removed ProjectContextType

// Removed interface and context creation from here

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<NeblineProject | null>(null)
  const [currentWeekData, setCurrentWeekData] = useState<JournalWeek | null>(null)
  const [configData, setConfigData] = useState<string | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(false)
  const [isWeekLoading, setIsWeekLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'journal' | 'configuration'>('journal')

  // Function to fetch the list of available weeks by reading the directory structure
  const fetchAvailableWeeks = useCallback(async (projectPath: string) => {
    console.log('[Context] Fetching available weeks for:', projectPath)
    const weeks: string[] = []
    try {
      const journalDir = await window.api.joinPath(projectPath, 'journal')
      const yearDirs = await window.api.readDir(journalDir)

      if (yearDirs) {
        for (const yearDir of yearDirs) {
          // Check if it's a directory and looks like a year (e.g., '2025')
          if (yearDir.isDirectory && /^\d{4}$/.test(yearDir.name)) {
            const yearPath = await window.api.joinPath(journalDir, yearDir.name)
            const weekDirs = await window.api.readDir(yearPath)

            if (weekDirs) {
              for (const weekDir of weekDirs) {
                // Check if it's a directory and matches YYYY-CW-WW format
                if (weekDir.isDirectory && /^\d{4}-CW-\d{2}$/.test(weekDir.name)) {
                  weeks.push(weekDir.name)
                }
              }
            } else {
              console.warn(`[Context] Could not read week directories in ${yearPath}`)
            }
          }
        }
      } else {
        console.log(`[Context] Journal directory not found or empty at ${journalDir}`)
      }

      // Sort weeks chronologically (most recent first)
      weeks.sort((a, b) => b.localeCompare(a))
      setAvailableWeeks(weeks)
      console.log('[Context] Available weeks loaded:', weeks)
    } catch (err) {
      console.error('[Context] Error fetching available weeks:', err)
      setAvailableWeeks([]) // Reset on error
    }
  }, [])

  const handleOpenProject = useCallback(
    async (folderPath: string) => {
      setIsProjectLoading(true) // Changed to isProjectLoading
      setError(null)
      console.log(`Context: Opening project ${folderPath}`)
      try {
        // We expect the IPC functions to be available via window.electron.ipcRenderer
        const openedProject = await openProjectLogic(folderPath)
        if (openedProject) {
          setProject(openedProject)

          // Set isDayLoading before loading today's data
          setIsWeekLoading(true) // Renamed from setIsDayLoading

          // openProjectLogic loads current week's data implicitly via loadWeek
          const todayWeekData = await loadWeekLogic(openedProject.projectPath, new Date())
          if (todayWeekData) {
            setCurrentWeekData(todayWeekData) // Renamed from setCurrentDayData
            console.log(
              "Context: Project and current week's data loaded",
              openedProject,
              todayWeekData
            )
            // Fetch available weeks after project and week's data are loaded
            await fetchAvailableWeeks(openedProject.projectPath) // Renamed from fetchAvailableDays
          } else {
            throw new Error("Failed to load current week's journal data after opening project.")
          }

          // Load configuration file
          try {
            const configFileContent = await loadConfigFileLogic(openedProject.projectPath)
            setConfigData(configFileContent)
            console.log('Context: Configuration file loaded')
          } catch (configErr) {
            console.error('Context: Error loading configuration file', configErr)
            // Don't throw error here, we don't want to prevent project loading if config fails
          }
          setIsWeekLoading(false) // Renamed from setIsDayLoading
        } else {
          throw new Error('Failed to open project folder.')
        }
      } catch (err: unknown) {
        console.error('Context: Error opening project', err)
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while opening the project.'
        setError(message)
        setProject(null)
        setCurrentWeekData(null) // Renamed from setCurrentDayData
        setConfigData(null)
        setAvailableWeeks([]) // Renamed from setAvailableDays
        setIsWeekLoading(false) // Renamed from setIsDayLoading
      } finally {
        setIsProjectLoading(false) // Changed to isProjectLoading
      }
    },
    [fetchAvailableWeeks] // Renamed from fetchAvailableDays
  ) // Add fetchAvailableWeeks dependency

  const handleLoadWeek = useCallback(
    async (date: Date) => {
      if (!project) {
        setError('No project is currently open.')
        return
      }
      // setIsWeekLoading(true); // Consider adding if week loading is slow
      setError(null)
      console.log(`Context: Loading week containing ${date.toISOString()}`)
      try {
        const weekData = await loadWeekLogic(project.projectPath, date) // Use loadWeekLogic
        if (weekData) {
          setCurrentWeekData(weekData) // Use setCurrentWeekData
          // Update the project state to reflect the new current week
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  currentWeekPath: weekData.weekPath, // Use currentWeekPath and weekData.weekPath
                  currentJournalFile: weekData.journalFile // Keep this updated
                }
              : null
          )
          console.log('Context: Week loaded', weekData)
        } else {
          throw new Error('Failed to load data for the selected week.')
        }
      } catch (err: unknown) {
        console.error('Context: Error loading week', err)
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
  ) // Depends on project being set

  // Removed handleSaveCurrentJournal

  // Handler for saving content to a specific file within the current week
  const handleSaveCurrentWeekFile = useCallback(
    async (filePath: string, content: string) => {
      if (!filePath) {
        console.error('Context: Cannot save, no file path provided.')
        setError('Cannot save, no file path provided.')
        return
      }
      if (!currentWeekData) {
        // Use currentWeekData
        console.error('Context: Cannot save, no current week data loaded.')
        setError('Cannot save, no week data loaded.')
        return
      }

      console.log(`Context: Saving content to ${filePath}`)
      try {
        const success = await saveFileContentLogic(filePath, content) // Use renamed logic function
        if (success) {
          // Optimistically update local state
          setCurrentWeekData((prev) => {
            // Use setCurrentWeekData
            if (!prev) return null
            // Check which file was saved and update the corresponding content
            if (filePath === prev.journalFile) {
              return { ...prev, journalContent: content }
            } else if (filePath === prev.insightsFile) {
              return { ...prev, insightsContent: content }
            }
            return prev // Return previous state if path doesn't match known files
          })
          console.log('Context: Save successful for', filePath)
        } else {
          throw new Error(`Failed to save content to ${filePath}.`)
        }
      } catch (err: unknown) {
        console.error(`Context: Error saving file ${filePath}`, err)
        const message =
          err instanceof Error ? err.message : `An unknown error occurred while saving ${filePath}.`
        setError(message)
      }
    },
    [currentWeekData] // Depends on currentWeekData to update state correctly
  )

  // Handler for saving configuration
  const handleSaveConfiguration = useCallback(
    async (content: string) => {
      if (!project?.projectPath) {
        console.error('Context: Cannot save configuration, no project path.')
        setError('Cannot save configuration, no project is currently loaded.')
        return
      }

      console.log(`Context: Saving configuration to ${project.projectPath}`)
      try {
        const success = await saveConfigFileLogic(project.projectPath, content)
        if (success) {
          // Update local state to keep context in sync
          setConfigData(content)
          console.log('Context: Configuration save successful')
        } else {
          throw new Error('Failed to save configuration content.')
        }
      } catch (err: unknown) {
        console.error('Context: Error saving configuration', err)
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while saving configuration.'
        setError(message)
      }
    },
    [project]
  ) // Depends on project

  // Toggle between journal and configuration views
  const handleToggleView = useCallback(() => {
    setView((currentView) => (currentView === 'journal' ? 'configuration' : 'journal'))
    console.log(`Context: Toggled view to ${view === 'journal' ? 'configuration' : 'journal'}`)
  }, [view])

  return (
    <ProjectContext.Provider
      value={{
        project,
        currentWeekData, // Renamed from currentDayData
        configData,
        availableWeeks, // Renamed from availableDays
        isProjectLoading,
        isWeekLoading, // Renamed from isDayLoading
        error,
        view,
        loadProject: handleOpenProject,
        loadWeek: handleLoadWeek, // Renamed from loadDay/handleLoadDay
        saveCurrentWeekFile: handleSaveCurrentWeekFile, // Renamed from saveCurrentDayFile
        saveConfiguration: handleSaveConfiguration,
        toggleView: handleToggleView
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}
