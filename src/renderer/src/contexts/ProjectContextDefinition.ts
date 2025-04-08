import { createContext } from 'react'
import { JournalWeek, NeblineProject } from '../lib/project' // Changed JournalDay to JournalWeek

// Define the shape of the context data
export interface ProjectContextData {
  project: NeblineProject | null
  currentWeekData: JournalWeek | null // Renamed from currentDayData
  configData: string | null
  availableWeeks: string[] // Renamed from availableDays (YYYY-CW-WW strings)
  isProjectLoading: boolean
  isWeekLoading: boolean // Renamed from isDayLoading
  error: string | null
  view: 'journal' | 'configuration' // View mode - either journal or configuration
  loadProject: (folderPath: string) => Promise<void>
  loadWeek: (date: Date) => Promise<void> // Renamed from loadDay
  // saveCurrentJournal: (content: string) => Promise<void> // Removed
  saveCurrentWeekFile: (filePath: string, content: string) => Promise<void> // Renamed from saveCurrentDayFile
  saveConfiguration: (content: string) => Promise<void> // Save configuration file
  toggleView: () => void // Toggle between journal and configuration views
  // Maybe add fetchAvailableDays here if needed externally? For now, keep it internal.
}

// Create the context object with an undefined default value
export const ProjectContext = createContext<ProjectContextData | undefined>(undefined)
