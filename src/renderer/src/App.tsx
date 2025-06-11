import { useEffect, useCallback, useState } from 'react'
import Sidebar from './components/Sidebar'
import Main from './components/Main'
import TopBar from './components/TopBar'
import MonacoEditor from '@renderer/components/MonacoEditor'
import { getFromLocalStorage, saveToLocalStorage } from './utils/localStorage'
import { LOCAL_STORAGE_KEYS } from './utils/constants'
import { useProject } from './lib/project/useProject'
import { debounce } from 'lodash-es'
import { generateWeekInsights, generateOverviewInsights } from './lib/ai/generateInsights'
import WelcomeScreen from './components/WelcomeScreen'
import { TabType } from '@renderer/components/TopBarTab'
import OverviewTopBar from '@renderer/components/OverviewTopBar'
import { updateAiRegistryWithConfig } from './lib/ai/update-ai-registry'
import { showErrorDialog } from './utils/dialog'
import { DocumentWithInsights, fetchJournalHistory } from './lib/project/helpers'

export const App: React.FC = () => {
  const {
    project,
    currentWeekData,
    configData,
    overviewContent,
    overviewInsightsContent,
    availableWeeks,
    isProjectLoading,
    isWeekLoading,
    error,
    view,
    activeOverviewTab,
    loadProject,
    loadWeek,
    saveCurrentWeekFile,
    saveConfigData,
    saveOverviewContent,
    saveOverviewInsightsContent,
    setView,
    setActiveOverviewTab
  } = useProject()

  const [activeTab, setActiveTab] = useState<TabType>('document')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

  useEffect(() => {
    const savedFolder = getFromLocalStorage<string | null>(LOCAL_STORAGE_KEYS.SELECTED_FOLDER, null)
    console.log('[App Effect - Initial Load] Reading localStorage:', savedFolder)
    if (savedFolder) {
      console.log('[App Effect - Initial Load] Found saved folder, calling loadProject...')
      loadProject(savedFolder)
        .then(() => {
          console.log('[App Effect - Initial Load] loadProject promise resolved.')
        })
        .catch((err) => {
          console.error('[App Effect - Initial Load] loadProject promise rejected:', err)
        })
    } else {
      console.log('[App Effect - Initial Load] No saved folder found.')
    }
  }, [loadProject]) // Depend on loadProject

  // Effect to update the preload current project whenever it changes
  useEffect(() => {
    // Make the project available to the main process
    if (window.api.setCurrentProject) {
      window.api.setCurrentProject(project)
    }
  }, [project]) // Only re-run when project changes

  // Effect to update the AI registry when the configuration changes
  useEffect(() => {
    if (configData) {
      console.log('Updating AI registry with project configuration')
      updateAiRegistryWithConfig(configData)
    }
  }, [configData]) // Only re-run when configData changes

  // Effect to handle folder selection from main process
  useEffect(() => {
    window.api.onFolderSelected((folderPath) => {
      console.log('Folder selected via IPC:', folderPath)
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SELECTED_FOLDER, folderPath)
      loadProject(folderPath)
    })
  }, [loadProject]) // Depend on loadProject

  // Reset active tab to document when the week changes (identified by weekPath)
  useEffect(() => {
    if (currentWeekData?.weekPath) {
      // Only reset if the week actually changed
      setActiveTab('document')
      console.log('Current week changed, resetting active tab to document.')
    }
  }, [currentWeekData?.weekPath]) // Only depend on weekPath, not the entire currentWeekData object

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
      if (!saveConfigData) {
        console.warn('Debounced config save skipped: no save function')
        return
      }
      console.log('Debounced configuration save triggered')
      saveConfigData(content)
    }, 1000),
    [saveConfigData]
  )

  const onEditorChange = (newValue: string | undefined): void => {
    const content = newValue ?? ''
    if (view === 'journal' && currentWeekData) {
      if (activeTab === 'document') {
        debouncedSaveJournal(currentWeekData.journalFile, content) // Use currentWeekData
      } else if (activeTab === 'insights') {
        debouncedSaveInsights(currentWeekData.insightsFile, content) // Use currentWeekData
      }
    } else if (view === 'configuration') {
      debouncedSaveConfig(content)
    } else if (view === 'overview') {
      if (activeOverviewTab === 'document') {
        saveOverviewContent(content)
      } else if (activeOverviewTab === 'insights') {
        saveOverviewInsightsContent(content)
      }
    }
  }

  const onGenerateJournalInsights = async (): Promise<void> => {
    console.log('Generate Journal Insights button clicked')
    if (!currentWeekData || !configData || !saveCurrentWeekFile || !project || !overviewContent) {
      console.error(
        'Cannot generate insights: Missing current day data, config, project, overview content, or save function.'
      )
      await showErrorDialog('Could not generate insights. Missing necessary data or configuration.')
      return
    }

    setIsGeneratingInsights(true)

    // Check if the Anthropic API key exists in the config
    if (!configData.anthropicApiKey) {
      console.error('Anthropic API key not found in configuration.')
      await showErrorDialog('Anthropic API key is missing in nebline.json.', 'Configuration Error')
      setIsGeneratingInsights(false)
      return
    }

    try {
      console.log('[handleGenerateInsights] Fetching journal history...')
      // Get the last 5 weeks of journal entries
      const journalHistory = await fetchJournalHistory(
        project.projectPath,
        currentWeekData.weekFolderName,
        6
      )
      console.log(
        `[handleGenerateInsights] Fetched ${journalHistory.length} journal entries for history`
      )

      console.log('[handleGenerateInsights] Calling generateJournalInsights function...')
      // Call the extracted function with journal history
      // Create DocumentWithInsights object for overview content
      const overviewWithInsights: DocumentWithInsights = {
        document: overviewContent || '',
        insights: overviewInsightsContent || ''
      }

      const insightsMarkdown = await generateWeekInsights({
        config: configData,
        overviewContent: overviewWithInsights,
        journalHistory: journalHistory
      })
      console.log('[handleGenerateInsights] generateJournalInsights function completed.')

      console.log(
        '[handleGenerateInsights] Insights received, preparing to save file:',
        currentWeekData.insightsFile
      )

      // Save the generated insights to the insights.md file
      await saveCurrentWeekFile(currentWeekData.insightsFile, insightsMarkdown)
      console.log('[handleGenerateInsights] saveCurrentWeekFile call completed.')

      console.log('Insights saved successfully.')
      // Optionally switch to the insights tab after generation
      setActiveTab('insights')
      // No alert on success, the updated content is the feedback
    } catch (error) {
      console.error('Error generating or saving insights:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      await showErrorDialog(
        `An error occurred while generating insights.`,
        'AI Generation Error',
        errorMessage
      )
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const onGenerateOverviewInsights = async (): Promise<void> => {
    console.log('Generate Overview Insights button clicked')
    if (!configData || !overviewContent || !project || !currentWeekData) {
      console.error(
        'Cannot generate insights: Missing overview content, config, project, or current week data.'
      )
      await showErrorDialog('Could not generate insights. Missing necessary data or configuration.')
      return
    }

    setIsGeneratingInsights(true)

    // Check if the Anthropic API key exists in the config
    if (!configData.anthropicApiKey) {
      console.error('Anthropic API key not found in configuration.')
      await showErrorDialog('Anthropic API key is missing in nebline.json.', 'Configuration Error')
      setIsGeneratingInsights(false)
      return
    }

    try {
      console.log('[handleGenerateOverviewInsights] Fetching journal history...')
      // Get the last 6 weeks of journal entries
      const journalHistory = await fetchJournalHistory(
        project.projectPath,
        currentWeekData.weekFolderName,
        6 // Get 6 weeks
      )
      console.log(
        `[handleGenerateOverviewInsights] Fetched ${journalHistory.length} journal entries for history`
      )

      console.log('[handleGenerateOverviewInsights] Calling generateOverviewInsights function...')
      // Create DocumentWithInsights object for overview content
      const overviewWithInsights: DocumentWithInsights = {
        document: overviewContent || '',
        insights: overviewInsightsContent || ''
      }

      // Call the extracted function with journal history
      const insightsMarkdown = await generateOverviewInsights({
        overviewContent: overviewWithInsights,
        config: configData,
        journalHistory: journalHistory
      })
      console.log('[handleGenerateOverviewInsights] generateOverviewInsights function completed.')

      console.log('[handleGenerateOverviewInsights] Insights received, preparing to save file')

      // Save the generated insights
      saveOverviewInsightsContent(insightsMarkdown)
      console.log('[handleGenerateOverviewInsights] saveOverviewInsightsContent call completed.')

      console.log('Overview insights saved successfully.')
      // Switch to the insights tab after generation
      setActiveOverviewTab('insights')
      // No alert on success, the updated content is the feedback
    } catch (error) {
      console.error('Error generating or saving overview insights:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      await showErrorDialog(
        `An error occurred while generating overview insights.`,
        'AI Generation Error',
        errorMessage
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

  // 2. Error State - Only show blocking errors that prevent app functionality
  // Parsing errors and other non-critical errors should be shown as notifications instead
  if (error && !project) {
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
      <div className="w-64 flex-shrink-0">
        <Sidebar
          availableWeeks={availableWeeks}
          loadWeek={loadWeek}
          currentWeekData={currentWeekData}
          isWeekLoading={isWeekLoading}
          view={view}
          setView={setView}
        />
      </div>
      <Main>
        <div className="flex flex-col h-full">
          {/* Top Bar (show in journal and overview views) */}
          {view === 'journal' && (
            <TopBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onGenerateInsights={onGenerateJournalInsights}
              isGeneratingInsights={isGeneratingInsights}
            />
          )}
          {view === 'overview' && (
            <OverviewTopBar
              activeTab={activeOverviewTab}
              setActiveTab={setActiveOverviewTab}
              onGenerateInsights={onGenerateOverviewInsights}
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
                    activeTab === 'document'
                      ? currentWeekData.journalFile
                      : currentWeekData.insightsFile
                  }
                  value={
                    // Use currentWeekData for value
                    activeTab === 'document'
                      ? currentWeekData.journalContent
                      : currentWeekData.insightsContent
                  }
                  onChange={onEditorChange}
                  language="markdown" // Explicitly set language
                />
              )}
            {view === 'configuration' && (
              <MonacoEditor
                key="configuration-editor"
                value={configData ? JSON.stringify(configData, null, 2) : ''}
                onChange={onEditorChange}
                language="json" // Explicitly set language
              />
            )}
            {view === 'overview' && (
              <MonacoEditor
                key={
                  activeOverviewTab === 'document' ? 'overview-editor' : 'overview-insights-editor'
                }
                value={
                  activeOverviewTab === 'document'
                    ? (overviewContent ?? '')
                    : (overviewInsightsContent ?? '')
                }
                onChange={onEditorChange}
                language="markdown" // Explicitly set language
              />
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}
