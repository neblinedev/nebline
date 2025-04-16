import { useEffect, useCallback, useState } from 'react' // Import hooks
import Sidebar from './components/Sidebar'
import Main from './components/Main'
import TopBar from './components/TopBar' // Import the new TopBar component
import MonacoEditor from '@renderer/components/MonacoEditor'
import { getFromLocalStorage, saveToLocalStorage } from './utils/localStorage'
import { LOCAL_STORAGE_KEYS } from './utils/constants'
import { useProject } from './hooks/useProject' // Import the hook
import { debounce } from 'lodash-es' // Import debounce
import { generateInsights } from './lib/ai/generateInsights' // Import the new function
import WelcomeScreen from './components/WelcomeScreen' // Import the WelcomeScreen component

export const App: React.FC = () => {
  const {
    project,
    currentWeekData,
    configData,
    availableWeeks, // Add availableWeeks
    isProjectLoading,
    isWeekLoading, // Add isWeekLoading
    error,
    view,
    loadProject: openProject,
    loadWeek, // Add loadWeek
    saveCurrentWeekFile,
    saveConfiguration,
    toggleView // Add toggleView
  } = useProject()

  // State to manage which tab (journal or insights) is active
  const [activeTab, setActiveTab] = useState<'journal' | 'insights'>('journal')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false) // State for generation loading

  // Effect to load project from localStorage on initial mount
  useEffect(() => {
    const savedFolder = getFromLocalStorage<string | null>(LOCAL_STORAGE_KEYS.SELECTED_FOLDER, null)
    console.log('[App Effect - Initial Load] Reading localStorage:', savedFolder)
    if (savedFolder) {
      console.log('[App Effect - Initial Load] Found saved folder, calling openProject...')
      openProject(savedFolder)
        .then(() => {
          console.log('[App Effect - Initial Load] openProject promise resolved.')
        })
        .catch((err) => {
          console.error('[App Effect - Initial Load] openProject promise rejected:', err)
        })
    } else {
      console.log('[App Effect - Initial Load] No saved folder found.')
    }
  }, [openProject]) // Depend on openProject

  // Effect to update the preload current project whenever it changes
  useEffect(() => {
    // Make the project available to the main process
    if (window.api.setCurrentProject) {
      window.api.setCurrentProject(project)
    }
  }, [project]) // Only re-run when project changes

  // Effect to handle folder selection from main process
  useEffect(() => {
    window.api.onFolderSelected((folderPath) => {
      console.log('Folder selected via IPC:', folderPath)
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SELECTED_FOLDER, folderPath)
      openProject(folderPath)
    })
  }, [openProject]) // Depend on openProject

  // Reset active tab to journal when the day changes (identified by dayPath)
  useEffect(() => {
    if (currentWeekData) {
      // Use currentWeekData
      // Only reset if the week actually changed
      setActiveTab('journal')
      console.log('Current week changed, resetting active tab to journal.')
    }
  }, [currentWeekData?.weekPath]) // Depend specifically on the weekPath

  // --- Debounced Save for Journal ---
  const debouncedSaveJournal = useCallback(
    debounce((filePath: string, content: string) => {
      if (!filePath || !saveCurrentWeekFile) {
        // Use saveCurrentWeekFile
        console.warn('Debounced journal save skipped: no file path or save function')
        return
      }
      console.log('Debounced journal save triggered for:', filePath)
      saveCurrentWeekFile(filePath, content) // Use saveCurrentWeekFile
    }, 1000),
    [saveCurrentWeekFile] // Depend on the save function
  )

  // --- Debounced Save for Insights ---
  const debouncedSaveInsights = useCallback(
    debounce((filePath: string, content: string) => {
      if (!filePath || !saveCurrentWeekFile) {
        // Use saveCurrentWeekFile
        console.warn('Debounced insights save skipped: no file path or save function')
        return
      }
      console.log('Debounced insights save triggered for:', filePath)
      saveCurrentWeekFile(filePath, content) // Use saveCurrentWeekFile
    }, 1000),
    [saveCurrentWeekFile] // Depend on the save function
  )

  // --- Debounced Save for Configuration ---
  const debouncedSaveConfig = useCallback(
    debounce((content: string) => {
      if (!saveConfiguration) {
        console.warn('Debounced config save skipped: no save function')
        return
      }
      console.log('Debounced configuration save triggered')
      saveConfiguration(content)
    }, 1000),
    [saveConfiguration]
  )

  // Handler for editor changes based on current view and active tab
  const handleEditorChange = (newValue: string | undefined): void => {
    const content = newValue ?? '' // Handle undefined from Monaco
    if (view === 'journal' && currentWeekData) {
      // Use currentWeekData
      if (activeTab === 'journal') {
        debouncedSaveJournal(currentWeekData.journalFile, content) // Use currentWeekData
      } else if (activeTab === 'insights') {
        debouncedSaveInsights(currentWeekData.insightsFile, content) // Use currentWeekData
      }
    } else if (view === 'configuration') {
      debouncedSaveConfig(content)
    }
  }

  // Placeholder for the insight generation logic
  const handleGenerateInsights = async (): Promise<void> => {
    console.log('Generate Insights button clicked')
    if (!currentWeekData || !configData || !saveCurrentWeekFile) {
      // Use currentWeekData and saveCurrentWeekFile
      console.error('Cannot generate insights: Missing current day data, config, or save function.')
      // TODO: Show user feedback (e.g., toast notification)
      alert('Could not generate insights. Missing necessary data or configuration.')
      return
    }

    setIsGeneratingInsights(true)
    let parsedConfig: { anthropicApiKey?: string } = {}
    try {
      parsedConfig = JSON.parse(configData)
    } catch (parseError) {
      console.error('Error parsing configuration JSON:', parseError)
      alert('Error reading configuration. Please check nebline.json.')
      setIsGeneratingInsights(false)
      return
    }

    const apiKey = parsedConfig.anthropicApiKey
    if (!apiKey) {
      console.error('Anthropic API key not found in configuration.')
      alert('Anthropic API key is missing in nebline.json.')
      setIsGeneratingInsights(false)
      return
    }

    const journalContent = currentWeekData.journalContent // Use currentWeekData

    try {
      console.log('[handleGenerateInsights] Calling generateInsights function...')
      // Call the extracted function
      const insightsMarkdown = await generateInsights({ apiKey, journalContent })
      console.log('[handleGenerateInsights] generateInsights function completed.')

      console.log(
        '[handleGenerateInsights] Insights received, preparing to save file:',
        currentWeekData.insightsFile // Use currentWeekData
      )

      // Save the generated insights to the insights.md file
      await saveCurrentWeekFile(currentWeekData.insightsFile, insightsMarkdown) // Use saveCurrentWeekFile and currentWeekData
      console.log('[handleGenerateInsights] saveCurrentWeekFile call completed.')

      console.log('Insights saved successfully.')
      // Optionally switch to the insights tab after generation
      setActiveTab('insights')
      // No alert on success, the updated content is the feedback
    } catch (error) {
      console.error('Error generating or saving insights:', error)
      alert(
        `An error occurred while generating insights: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // The editor props logic is now handled directly in the JSX below

  // 1. Loading State
  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading project...</p>
      </div>
    )
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>Error: {error}</p>
        {/* Optionally add a button to retry or select a different folder */}
      </div>
    )
  }

  // 3. No Project Loaded State
  if (!project) {
    // Render only the WelcomeScreen, centered
    return (
      <div className="flex items-center justify-center h-screen">
        <WelcomeScreen />
      </div>
    )
  }

  // 4. Project Loaded State - Render the main application layout
  return (
    <div className="flex h-screen">
      {/* Sidebar is always rendered when project is loaded */}
      <div className="w-64 flex-shrink-0">
        <Sidebar
          availableWeeks={availableWeeks}
          loadWeek={loadWeek}
          currentWeekData={currentWeekData}
          isWeekLoading={isWeekLoading}
          view={view}
          toggleView={toggleView}
        />
      </div>

      {/* Main content area */}
      <Main>
        <div className="flex flex-col h-full">
          {/* Top Bar (only show in journal view) */}
          {view === 'journal' && (
            <TopBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onGenerateInsights={handleGenerateInsights}
              isGeneratingInsights={isGeneratingInsights}
            />
          )}

          {/* Editor Area */}
          <div className="flex-grow overflow-hidden">
            {/* Render editor based on view and activeTab */}
            {view === 'journal' &&
              currentWeekData && ( // Use currentWeekData
                <MonacoEditor
                  key={
                    // Use currentWeekData for key
                    activeTab === 'journal'
                      ? currentWeekData.journalFile
                      : currentWeekData.insightsFile
                  }
                  value={
                    // Use currentWeekData for value
                    activeTab === 'journal'
                      ? currentWeekData.journalContent
                      : currentWeekData.insightsContent
                  }
                  onChange={handleEditorChange}
                  language="markdown" // Explicitly set language
                />
              )}
            {view === 'configuration' && (
              <MonacoEditor
                key="configuration-editor"
                value={configData ?? ''}
                onChange={handleEditorChange}
                language="json" // Explicitly set language
              />
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}
